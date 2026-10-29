import type { PdfContext, PageState } from "../types";
import {
  mm,
  PT,
  PAD_SIDE,
  CONTENT_WIDTH,
  TOTALS_NOTES_HEIGHT,
  NOTES_W,
  TOTALS_W,
  DARK,
  GRAND_TOTAL_BG,
  TOTALS_BORDER,
} from "../layout";
import { calcQuotationTotals, formatCurrency } from "../../../../lib/documentUtils";

export function drawTotalsAndNotes(state: PageState, ctx: PdfContext): void {
  const { page, y } = state;
  const { fonts, quotation } = ctx;
  const sectionTop = y;
  const sectionBottom = sectionTop - TOTALS_NOTES_HEIGHT;
  const sectionCenterY = sectionTop - TOTALS_NOTES_HEIGHT / 2;

  // Notes (left, 80mm)
  const notesX = PAD_SIDE;
  const notesLabelSize = 11 * PT;
  const notesSpanSize = 9 * PT;
  const notesLabelPadBottom = mm(1);
  const hasNotes = Boolean(quotation.notes);
  const notesBlockH =
    notesLabelSize + notesLabelPadBottom + (hasNotes ? notesSpanSize : 0);
  const notesBlockTop = sectionCenterY + notesBlockH / 2;

  page.drawText("Notes:", {
    x: notesX,
    y: notesBlockTop - notesLabelSize,
    size: notesLabelSize,
    font: fonts.boldFont,
    color: DARK,
  });
  if (hasNotes) {
    let notesText = quotation.notes;
    const maxNotesW = NOTES_W - 8;
    if (
      fonts.serifItalic.widthOfTextAtSize(notesText, notesSpanSize) > maxNotesW
    ) {
      while (
        fonts.serifItalic.widthOfTextAtSize(notesText + "...", notesSpanSize) >
          maxNotesW &&
        notesText.length > 0
      )
        notesText = notesText.slice(0, -1);
      notesText += "...";
    }
    page.drawText(notesText, {
      x: notesX,
      y: notesBlockTop - notesLabelSize - notesLabelPadBottom - notesSpanSize,
      size: notesSpanSize,
      font: fonts.serifItalic,
      color: DARK,
    });
  }

  // Totals table (right, 75mm)
  const totalsX = PAD_SIDE + CONTENT_WIDTH - TOTALS_W;
  const totalsFont = 11 * PT;
  const grandTotalFont = 12 * PT;
  const rowH = mm(7);
  const padV = mm(2);
  const borderThick = mm(1);

  const { subtotal, tax, total } = calcQuotationTotals(
    quotation.items,
    quotation.taxRate,
  );

  const drawTotalsRow = (
    label: string,
    value: string,
    isGrandTotal: boolean,
  ) => {
    const fontSize = isGrandTotal ? grandTotalFont : totalsFont;
    const pt_ = isGrandTotal ? mm(3) : padV;
    const rowTotal = isGrandTotal ? pt_ + fontSize + padV : rowH;
    const textY = state.y - pt_ - fontSize;

    if (isGrandTotal) {
      page.drawRectangle({
        x: totalsX,
        y: state.y - rowTotal,
        width: TOTALS_W,
        height: rowTotal,
        color: GRAND_TOTAL_BG,
      });
    }

    page.drawText(label, {
      x: totalsX + mm(3),
      y: textY,
      size: fontSize,
      font: isGrandTotal ? fonts.boldFont : fonts.serifFont,
      color: DARK,
    });
    const vw = fonts.serifFont.widthOfTextAtSize(value, fontSize);
    page.drawText(value, {
      x: totalsX + TOTALS_W - vw - mm(3),
      y: textY,
      size: fontSize,
      font: fonts.serifFont,
      color: DARK,
    });

    if (!isGrandTotal) {
      page.drawLine({
        start: { x: totalsX, y: state.y - rowTotal },
        end: { x: totalsX + TOTALS_W, y: state.y - rowTotal },
        thickness: borderThick,
        color: TOTALS_BORDER,
      });
    }

    state.y = state.y - rowTotal;
  };

  const totalsBlockHeight = rowH * 2 + mm(3) + grandTotalFont + mm(3);
  state.y = sectionCenterY + totalsBlockHeight / 2;

  drawTotalsRow("Sub-Total", formatCurrency(subtotal), false);
  drawTotalsRow(`Tax (${quotation.taxRate}%)`, formatCurrency(tax), false);
  drawTotalsRow("Grand Total", formatCurrency(total), true);

  state.y = sectionBottom;
}

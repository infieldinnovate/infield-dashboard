// components\QuotationDocument\pdf\sections\totalsAndNotes.ts

import { rgb } from "pdf-lib";
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
import {
  calcQuotationTotals,
  formatCurrency,
} from "../../../../lib/documentUtils";

const NOTES_MAX_HEIGHT = mm(30);
const CSS_LINE_HEIGHT = 1.2;
const TOTALS_TEXT = rgb(17 / 255, 17 / 255, 17 / 255);

/**
 * Wrap text to a maximum PDF width.
 * Long words are split only when needed to fit the available width.
 */
function wrapTextToWidth(
  text: string,
  maxWidth: number,
  measure: (value: string) => number,
): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    let pieces: string[];

    if (measure(word) <= maxWidth) {
      pieces = [word];
    } else {
      pieces = [];
      let chunk = "";

      for (const character of word) {
        if (chunk && measure(chunk + character) > maxWidth) {
          pieces.push(chunk);
          chunk = character;
        } else {
          chunk += character;
        }
      }

      if (chunk) pieces.push(chunk);
    }

    for (const piece of pieces) {
      const candidate = line ? `${line} ${piece}` : piece;

      if (line && measure(candidate) > maxWidth) {
        lines.push(line);
        line = piece;
      } else {
        line = candidate;
      }
    }
  }

  if (line) lines.push(line);

  return lines;
}

export function drawTotalsAndNotes(state: PageState, ctx: PdfContext): void {
  const { page } = state;
  const { fonts, quotation } = ctx;

  const sectionTop = state.y;
  const sectionBottom = sectionTop - TOTALS_NOTES_HEIGHT;
  const sectionCenterY = sectionTop - TOTALS_NOTES_HEIGHT / 2;

  // =========================================================
  // 1. NOTES — left side, 80mm wide, vertically centered
  // =========================================================

  const notesX = PAD_SIDE;
  const notesLabelSize = 11 * PT;
  const notesTextSize = 9 * PT;
  const notesLabelPadBottom = mm(1);

  const notesLabelLineH = notesLabelSize * CSS_LINE_HEIGHT;
  const notesTextLineH = notesTextSize * CSS_LINE_HEIGHT;

  const hasNotes = Boolean(quotation.notes);

  const allNotesLines = hasNotes
    ? wrapTextToWidth(String(quotation.notes), NOTES_W, (text) =>
        fonts.serifItalic.widthOfTextAtSize(text, notesTextSize),
      )
    : [];

  // Only draw complete lines that fit inside the 30mm CSS max-height.
  const maxNotesLines = Math.max(
    0,
    Math.floor(
      (NOTES_MAX_HEIGHT - notesLabelLineH - notesLabelPadBottom) /
        notesTextLineH,
    ),
  );

  const visibleNotesLines = allNotesLines.slice(0, maxNotesLines);

  // The CSS container grows naturally until its 30mm maximum.
  const naturalNotesHeight =
    notesLabelLineH +
    notesLabelPadBottom +
    allNotesLines.length * notesTextLineH;

  const notesBlockH = Math.min(NOTES_MAX_HEIGHT, naturalNotesHeight);
  const notesBlockTop = sectionCenterY + notesBlockH / 2;

  // The PDF text baseline is centered within each CSS-like line box.
  const notesLabelY = notesBlockTop - (notesLabelLineH + notesLabelSize) / 2;

  page.drawText("Notes:", {
    x: notesX,
    y: notesLabelY,
    size: notesLabelSize,
    font: fonts.boldFont,
    color: DARK,
  });

  visibleNotesLines.forEach((line, index) => {
    const textY =
      notesBlockTop -
      notesLabelLineH -
      notesLabelPadBottom -
      (notesTextLineH + notesTextSize) / 2 -
      index * notesTextLineH;

    page.drawText(line, {
      x: notesX,
      y: textY,
      size: notesTextSize,
      font: fonts.serifItalic,
      color: DARK,
    });
  });

  // =========================================================
  // 2. FINANCIAL TOTALS — right side, 75mm wide
  // =========================================================

  const totalsX = PAD_SIDE + CONTENT_WIDTH - TOTALS_W;

  const totalsFont = 11 * PT;
  const grandTotalFont = 12 * PT;

  // Match the CSS cell height and padding.
  const rowContentH = mm(7);
  const padV = mm(2);
  const borderThick = mm(1);

  // CSS: height: 7mm; padding: 2mm 4mm;
  //      border-bottom: 1mm solid #bcbcbc.
  const regularRowH = rowContentH + 2 * padV + borderThick;

  // CSS: Grand Total has 3mm top/bottom padding and no border.
  const grandPaddingV = mm(3);
  const grandLineH = grandTotalFont * CSS_LINE_HEIGHT;
  const grandRowH = 2 * grandPaddingV + grandLineH;

  const { subtotal, tax, total } = calcQuotationTotals(
    quotation.items,
    quotation.taxRate,
  );

  const totalsBlockHeight = 2 * regularRowH + grandRowH;

  // Center the entire totals table inside the 40mm section.
  state.y = sectionCenterY + totalsBlockHeight / 2;

  const drawTotalsRow = (
    label: string,
    value: string,
    isGrandTotal: boolean,
  ): void => {
    const rowTop = state.y;

    const fontSize = isGrandTotal ? grandTotalFont : totalsFont;
    const rowHeight = isGrandTotal ? grandRowH : regularRowH;
    const rowBottom = rowTop - rowHeight;

    // Vertically center the text in the row's content area.
    const textY = isGrandTotal
      ? rowTop - grandPaddingV - (grandLineH + fontSize) / 2
      : rowTop - padV - (rowContentH + fontSize) / 2;

    if (isGrandTotal) {
      page.drawRectangle({
        x: totalsX,
        y: rowBottom,
        width: TOTALS_W,
        height: rowHeight,
        color: GRAND_TOTAL_BG,
      });
    }

    page.drawText(label, {
      x: totalsX + mm(3),
      y: textY,
      size: fontSize,
      font: isGrandTotal ? fonts.boldFont : fonts.serifFont,
      color: TOTALS_TEXT,
    });

    // CSS last cell: right-aligned, 3mm right padding,
    // normal font weight for the amount, including Grand Total.
    const valueWidth = fonts.serifFont.widthOfTextAtSize(value, fontSize);

    page.drawText(value, {
      x: totalsX + TOTALS_W - valueWidth - mm(3),
      y: textY,
      size: fontSize,
      font: fonts.serifFont,
      color: TOTALS_TEXT,
    });

    // Regular rows have a 1mm #bcbcbc bottom border.
    // Grand Total explicitly removes this border in the CSS.
    if (!isGrandTotal) {
      page.drawLine({
        start: {
          x: totalsX,
          y: rowBottom + borderThick / 2,
        },
        end: {
          x: totalsX + TOTALS_W,
          y: rowBottom + borderThick / 2,
        },
        thickness: borderThick,
        color: TOTALS_BORDER,
      });
    }

    state.y = rowBottom;
  };

  drawTotalsRow("Sub-Total", formatCurrency(subtotal), false);
  drawTotalsRow(`Tax (${quotation.taxRate}%)`, formatCurrency(tax), false);
  drawTotalsRow("Grand Total", formatCurrency(total), true);

  // Preserve the section layout contract for the next PDF section.
  state.y = sectionBottom;
}

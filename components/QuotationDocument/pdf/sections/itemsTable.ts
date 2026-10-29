import type { QuotationItem } from "../../../../types";
import type { PdfContext, PageState } from "../types";
import {
  mm,
  PT,
  PX,
  PAD_SIDE,
  PAGE_WIDTH,
  CONTENT_WIDTH,
  TABLE_HEADER_HEIGHT,
  TABLE_ROW_HEIGHT,
  TABLE_BODY_FONT,
  COL_WIDTHS,
  COL_XS,
  TABLE_HEADER_BG,
  TABLE_HEADER_BORDER,
  ROW_BORDER,
  EVEN_ROW_BG,
  WHITE,
  DARK,
  CONTENT_BOTTOM,
} from "../layout";
import { calcItemTotal } from "../../../../lib/documentUtils";
import { formatAmount } from "../../documentHelpers";

export function drawTableHeader(state: PageState, ctx: PdfContext): void {
  const { page, y } = state;
  const { fonts } = ctx;
  const thH = TABLE_HEADER_HEIGHT;
  const thY = y - thH;
  page.drawRectangle({
    x: PAD_SIDE,
    y: thY,
    width: CONTENT_WIDTH,
    height: thH,
    color: TABLE_HEADER_BG,
  });
  const headers = [
    { text: "No.", x: COL_XS.no, w: COL_WIDTHS.no },
    { text: "Description", x: COL_XS.desc, w: COL_WIDTHS.desc },
    { text: "Size", x: COL_XS.unit, w: COL_WIDTHS.unit },
    { text: "Qty", x: COL_XS.qty, w: COL_WIDTHS.qty },
    { text: "Price", x: COL_XS.price, w: COL_WIDTHS.price },
    { text: "Total", x: COL_XS.total, w: COL_WIDTHS.total },
  ];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (i < headers.length - 1) {
      const sepX = h.x + h.w;
      page.drawLine({
        start: { x: sepX, y: thY },
        end: { x: sepX, y: thY + thH },
        thickness: mm(1),
        color: TABLE_HEADER_BORDER,
      });
    }
    const tw = fonts.boldFont.widthOfTextAtSize(h.text, 12 * PT);
    const tx = h.x + (h.w - tw) / 2;
    page.drawText(h.text, {
      x: tx,
      y: thY + (thH - 12 * PT) / 2,
      size: 12 * PT,
      font: fonts.boldFont,
      color: WHITE,
    });
  }
  state.y = thY;
}

export function drawItems(
  state: PageState,
  ctx: PdfContext,
  items: QuotationItem[],
  startIndex: number,
): void {
  const { page } = state;
  const { fonts } = ctx;
  drawTableHeader(state, ctx);
  state.y -= 2;

  for (let i = 0; i < items.length; i++) {
    if (state.y - (TABLE_ROW_HEIGHT + 4) < CONTENT_BOTTOM + 10) {
      return;
    }
    const item = items[i];
    const rowY = state.y - TABLE_ROW_HEIGHT;
    if ((startIndex + i + 1) % 2 === 0) {
      page.drawRectangle({
        x: PAD_SIDE,
        y: rowY,
        width: CONTENT_WIDTH,
        height: TABLE_ROW_HEIGHT,
        color: EVEN_ROW_BG,
      });
    }
    page.drawLine({
      start: { x: PAD_SIDE, y: rowY },
      end: { x: PAGE_WIDTH - PAD_SIDE, y: rowY },
      thickness: 3 * PX,
      color: ROW_BORDER,
    });
    const cellY = rowY + (TABLE_ROW_HEIGHT - TABLE_BODY_FONT) / 2;
    const noStr = String(startIndex + i + 1);
    page.drawText(noStr, {
      x:
        COL_XS.no +
        (COL_WIDTHS.no - fonts.serifFont.widthOfTextAtSize(noStr, TABLE_BODY_FONT)) / 2,
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });
    let descText = item.productName;
    const maxDescW = COL_WIDTHS.desc - mm(3) - 4;
    if (fonts.serifFont.widthOfTextAtSize(descText, TABLE_BODY_FONT) > maxDescW) {
      while (
        fonts.serifFont.widthOfTextAtSize(descText + "...", TABLE_BODY_FONT) >
          maxDescW &&
        descText.length > 0
      )
        descText = descText.slice(0, -1);
      descText += "...";
    }
    page.drawText(descText, {
      x: COL_XS.desc + mm(3),
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });
    const unitStr = item.size || "-";
    page.drawText(unitStr, {
      x:
        COL_XS.unit +
        (COL_WIDTHS.unit - fonts.serifFont.widthOfTextAtSize(unitStr, TABLE_BODY_FONT)) / 2,
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });
    const qtyStr = `${item.quantity} ${item.unit || ""}`;
    page.drawText(qtyStr, {
      x:
        COL_XS.qty +
        (COL_WIDTHS.qty - fonts.serifFont.widthOfTextAtSize(qtyStr, TABLE_BODY_FONT)) / 2,
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });
    const priceStr = formatAmount(item.unitPrice);
    page.drawText(priceStr, {
      x:
        COL_XS.price +
        COL_WIDTHS.price -
        fonts.serifFont.widthOfTextAtSize(priceStr, TABLE_BODY_FONT) -
        mm(3),
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });
    const totalStr = formatAmount(calcItemTotal(item));
    page.drawText(totalStr, {
      x:
        COL_XS.total +
        COL_WIDTHS.total -
        fonts.serifFont.widthOfTextAtSize(totalStr, TABLE_BODY_FONT) -
        mm(3),
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });
    state.y = rowY;
  }
}

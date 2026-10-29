import type { PdfContext, PageState } from "../types";
import {
  mm,
  PT,
  PAD_SIDE,
  BF_HEIGHT,
  BF_RIGHT_W,
  BF_RIGHT_X,
  FOR_HEIGHT,
  FOR_LABEL_W,
  DARK,
  BILLTO_LABEL,
  FOR_LABEL_BG,
  FOR_CONTENT_BG,
} from "../layout";

export function drawBillToAndFor(state: PageState, ctx: PdfContext): void {
  const { page, y } = state;
  const { fonts, quotation } = ctx;
  const bfTop = y;
  const bfBottom = bfTop - BF_HEIGHT;
  const bfCenterY = bfTop - BF_HEIGHT / 2;
  const bfLabelSize = 12 * PT;
  const bfContentSize = 11 * PT;
  const bfContentLineH = bfContentSize * 1.2 + mm(1);

  const bfLines = quotation.customerAddress ? 3 : 2;
  const bfBlockH = bfLabelSize + 4 + bfLines * bfContentLineH;
  const bfBlockTop = bfCenterY + bfBlockH / 2;

  let bfCursorY = bfBlockTop - bfLabelSize;
  page.drawText("BILL TO:", {
    x: PAD_SIDE,
    y: bfCursorY,
    size: bfLabelSize,
    font: fonts.boldFont,
    color: BILLTO_LABEL,
  });
  bfCursorY -= 4 + bfContentSize;
  page.drawText(quotation.customerName, {
    x: PAD_SIDE,
    y: bfCursorY,
    size: bfContentSize,
    font: fonts.boldFont,
    color: DARK,
  });
  if (quotation.customerAddress) {
    bfCursorY -= bfContentLineH;
    page.drawText(quotation.customerAddress, {
      x: PAD_SIDE,
      y: bfCursorY,
      size: bfContentSize,
      font: fonts.serifFont,
      color: DARK,
    });
  }
  bfCursorY -= bfContentLineH;
  page.drawText(quotation.customerContact, {
    x: PAD_SIDE,
    y: bfCursorY,
    size: bfContentSize,
    font: fonts.serifFont,
    color: DARK,
  });

  const forTop = bfCenterY + FOR_HEIGHT / 2;
  const forBottom = forTop - FOR_HEIGHT;
  page.drawRectangle({
    x: BF_RIGHT_X,
    y: forBottom,
    width: BF_RIGHT_W,
    height: FOR_HEIGHT,
    color: FOR_CONTENT_BG,
  });
  page.drawRectangle({
    x: BF_RIGHT_X,
    y: forBottom,
    width: FOR_LABEL_W,
    height: FOR_HEIGHT,
    color: FOR_LABEL_BG,
  });
  page.drawText("FOR:", {
    x: BF_RIGHT_X + mm(4),
    y: forBottom + (FOR_HEIGHT - 11 * PT) / 2,
    size: 11 * PT,
    font: fonts.boldFont,
    color: DARK,
  });
  let forText = quotation.quoteFor || "";
  const maxForW = BF_RIGHT_W - FOR_LABEL_W - mm(8);
  if (fonts.serifFont.widthOfTextAtSize(forText, 10 * PT) > maxForW) {
    while (
      fonts.serifFont.widthOfTextAtSize(forText + "...", 10 * PT) > maxForW &&
      forText.length > 0
    )
      forText = forText.slice(0, -1);
    forText += "...";
  }
  page.drawText(forText, {
    x: BF_RIGHT_X + FOR_LABEL_W + mm(4),
    y: forBottom + (FOR_HEIGHT - 10 * PT) / 2,
    size: 10 * PT,
    font: fonts.serifFont,
    color: DARK,
  });

  state.y = bfBottom;
}

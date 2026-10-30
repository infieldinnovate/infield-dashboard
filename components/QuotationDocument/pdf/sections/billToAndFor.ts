// components/QuotationDocument/pdf/sections/billToAndFor.ts

import { rgb, type PDFFont } from "pdf-lib";
import type { PdfContext, PageState } from "../types";

import {
  mm,
  PT,
  PAD_SIDE,
  BF_HEIGHT,
  BF_LEFT_W,
  BF_RIGHT_W,
  BF_RIGHT_X,
  FOR_HEIGHT,
  FOR_LABEL_W,
  DARK,
  BILLTO_LABEL,
  FOR_LABEL_BG,
  FOR_CONTENT_BG,
} from "../layout";

const FOR_TEXT_COLOR = rgb(17 / 255, 17 / 255, 17 / 255);

const LINE_HEIGHT_FACTOR = 1.2;
const PARAGRAPH_MARGIN = mm(1);
const FOR_HORIZONTAL_PADDING = mm(4);

type TextParagraph = {
  font: PDFFont;
  lines: string[];
};

/**
 * Wraps text at word boundaries to fit within the available width.
 *
 * Like normal CSS wrapping, an individual word that is wider than
 * the available width is left intact rather than split arbitrarily.
 */
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const normalizedText = text.trim().replace(/\s+/g, " ");

  if (!normalizedText) {
    return [""];
  }

  const words = normalizedText.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (
      !currentLine ||
      font.widthOfTextAtSize(candidate, fontSize) <= maxWidth
    ) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Calculates the PDF text baseline that centers the font's
 * ascender/descender bounds around the specified vertical center.
 */
function centeredBaselineY(
  font: PDFFont,
  fontSize: number,
  centerY: number,
): number {
  const ascent = font.heightAtSize(fontSize, {
    descender: false,
  });

  const fullHeight = font.heightAtSize(fontSize, {
    descender: true,
  });

  const descent = Math.max(0, fullHeight - ascent);

  return centerY - (ascent - descent) / 2;
}

export function drawBillToAndFor(state: PageState, ctx: PdfContext): void {
  const { page, y } = state;
  const { fonts, quotation } = ctx;

  // ---------------------------------------------------------
  // 1. Shared section geometry
  // ---------------------------------------------------------

  const bfTop = y;
  const bfBottom = bfTop - BF_HEIGHT;
  const bfCenterY = bfTop - BF_HEIGHT / 2;

  const bfLabelSize = 12 * PT;
  const bfContentSize = 11 * PT;

  // Explicitly mirror line-height: 1.2 in the CSS.
  const bfLabelLineH = bfLabelSize * LINE_HEIGHT_FACTOR;
  const bfContentLineH = bfContentSize * LINE_HEIGHT_FACTOR;

  // ---------------------------------------------------------
  // 2. BILL TO block
  // ---------------------------------------------------------

  const customerNameLines = wrapText(
    quotation.customerName,
    fonts.boldFont,
    bfContentSize,
    BF_LEFT_W,
  );

  const billParagraphs: TextParagraph[] = [
    {
      font: fonts.boldFont,
      lines: customerNameLines,
    },
  ];

  if (quotation.customerAddress.trim() !== "") {
    billParagraphs.push({
      font: fonts.serifFont,
      lines: wrapText(
        quotation.customerAddress,
        fonts.serifFont,
        bfContentSize,
        BF_LEFT_W,
      ),
    });
  }

  billParagraphs.push({
    font: fonts.serifFont,
    lines: wrapText(
      quotation.customerContact,
      fonts.serifFont,
      bfContentSize,
      BF_LEFT_W,
    ),
  });

  // Account for wrapped lines and the CSS paragraph margins.
  const billContentH = billParagraphs.reduce(
    (height, paragraph) =>
      height + paragraph.lines.length * bfContentLineH + PARAGRAPH_MARGIN,
    0,
  );

  const billBlockH = bfLabelLineH + billContentH;

  // Center the complete customer block vertically.
  let billCursorTop = bfCenterY + billBlockH / 2;

  const billLabelCenterY = billCursorTop - bfLabelLineH / 2;

  page.drawText("BILL TO:", {
    x: PAD_SIDE,
    y: centeredBaselineY(fonts.boldFont, bfLabelSize, billLabelCenterY),
    size: bfLabelSize,
    font: fonts.boldFont,
    color: BILLTO_LABEL,
  });

  billCursorTop -= bfLabelLineH;

  for (const paragraph of billParagraphs) {
    for (const line of paragraph.lines) {
      const lineCenterY = billCursorTop - bfContentLineH / 2;

      page.drawText(line, {
        x: PAD_SIDE,
        y: centeredBaselineY(paragraph.font, bfContentSize, lineCenterY),
        size: bfContentSize,
        font: paragraph.font,
        color: DARK,
      });

      billCursorTop -= bfContentLineH;
    }

    // Matches .qt-billto-content p { margin-bottom: 1mm; }
    billCursorTop -= PARAGRAPH_MARGIN;
  }

  // ---------------------------------------------------------
  // 3. FOR section geometry and backgrounds
  // ---------------------------------------------------------

  const forTop = bfCenterY + FOR_HEIGHT / 2;
  const forBottom = forTop - FOR_HEIGHT;
  const forCenterY = forBottom + FOR_HEIGHT / 2;

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

  // ---------------------------------------------------------
  // 4. FOR label
  // ---------------------------------------------------------

  const forLabelSize = 11 * PT;

  page.drawText("FOR:", {
    x: BF_RIGHT_X + FOR_HORIZONTAL_PADDING,
    y: centeredBaselineY(fonts.boldFont, forLabelSize, forCenterY),
    size: forLabelSize,
    font: fonts.boldFont,
    color: FOR_TEXT_COLOR,
  });

  // ---------------------------------------------------------
  // 5. Quotation-purpose text
  // ---------------------------------------------------------

  const forText = quotation.quoteFor;
  const forTextSize = 10 * PT;
  const forLineH = forTextSize * LINE_HEIGHT_FACTOR;

  const maxForW = BF_RIGHT_W - FOR_LABEL_W - 2 * FOR_HORIZONTAL_PADDING;

  const forLines = forText
    ? wrapText(forText, fonts.serifFont, forTextSize, maxForW)
    : [];

  // Center a potentially multiline text block vertically.
  const forTextBlockH = forLines.length * forLineH;

  let forLineCenterY = forCenterY + (forTextBlockH - forLineH) / 2;

  const forTextX = BF_RIGHT_X + FOR_LABEL_W + FOR_HORIZONTAL_PADDING;

  for (const line of forLines) {
    page.drawText(line, {
      x: forTextX,
      y: centeredBaselineY(fonts.serifFont, forTextSize, forLineCenterY),
      size: forTextSize,
      font: fonts.serifFont,
      color: FOR_TEXT_COLOR,
    });

    forLineCenterY -= forLineH;
  }

  // ---------------------------------------------------------
  // 6. Advance the PDF layout
  // ---------------------------------------------------------

  state.y = bfBottom;
}

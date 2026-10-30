// components/QuotationDocument/pdf/sections/itemsTable.ts

import type { PDFFont } from "pdf-lib";
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

// =========================================================
// ITEM ROW LAYOUT
// Calculate the wrapped description and actual row height.
// =========================================================

type ItemRowLayout = {
  descriptionLines: string[];
  height: number;
  lineHeight: number;
};

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const normalized = text.trim();
  const words = (normalized || "-").split(/\s+/);
  const lines: string[] = [];

  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      line = candidate;
      continue;
    }

    // Save the current line before handling the word that does not fit.
    if (line) {
      lines.push(line);
      line = "";
    }

    // Split unusually long words that exceed the available column width.
    if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
      let fragment = "";

      for (const char of word) {
        const next = fragment + char;

        if (fragment && font.widthOfTextAtSize(next, fontSize) > maxWidth) {
          lines.push(fragment);
          fragment = char;
        } else {
          fragment = next;
        }
      }

      line = fragment;
    } else {
      line = word;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines.length > 0 ? lines : ["-"];
}

function getItemRowLayout(item: QuotationItem, ctx: PdfContext): ItemRowLayout {
  const font = ctx.fonts.serifFont;
  const maxDescriptionWidth = COL_WIDTHS.desc - mm(3) - 4;

  const descriptionLines = wrapText(
    item.productName ?? "",
    font,
    TABLE_BODY_FONT,
    maxDescriptionWidth,
  );

  const fontHeight = font.heightAtSize(TABLE_BODY_FONT, {
    descender: true,
  });

  const lineHeight = Math.max(fontHeight * 1.2, TABLE_BODY_FONT * 1.2);

  const verticalPadding = mm(2);

  // Short descriptions retain the existing minimum row height.
  // Longer descriptions increase the row height as needed.
  const height = Math.max(
    TABLE_ROW_HEIGHT,
    descriptionLines.length * lineHeight + verticalPadding * 2,
  );

  return {
    descriptionLines,
    height,
    lineHeight,
  };
}

// =========================================================
// TABLE HEADER
// =========================================================

export function drawTableHeader(state: PageState, ctx: PdfContext): void {
  const { page, y } = state;
  const { fonts } = ctx;

  const thH = TABLE_HEADER_HEIGHT;
  const thY = y - thH;
  const thCenterY = thY + thH / 2;

  const headerFontSize = 12 * PT;
  const horizontalPadding = mm(3);

  // Header background.
  page.drawRectangle({
    x: PAD_SIDE,
    y: thY,
    width: CONTENT_WIDTH,
    height: thH,
    color: TABLE_HEADER_BG,
  });

  // Vertically center text using the font's actual metrics.
  const ascent = fonts.boldFont.heightAtSize(headerFontSize, {
    descender: false,
  });

  const fullHeight = fonts.boldFont.heightAtSize(headerFontSize, {
    descender: true,
  });

  const descent = Math.max(0, fullHeight - ascent);

  const textY = thCenterY - (ascent - descent) / 2 - mm(0.6);

  // Column definitions.
  const headers = [
    {
      text: "No.",
      x: COL_XS.no,
      w: COL_WIDTHS.no,
      paddingLeft: 0,
      paddingRight: 0,
    },
    {
      text: "Description",
      x: COL_XS.desc,
      w: COL_WIDTHS.desc,
      paddingLeft: horizontalPadding,
      paddingRight: 0,
    },
    {
      text: "Size",
      x: COL_XS.unit,
      w: COL_WIDTHS.unit,
      paddingLeft: 0,
      paddingRight: 0,
    },
    {
      text: "Qty",
      x: COL_XS.qty,
      w: COL_WIDTHS.qty,
      paddingLeft: 0,
      paddingRight: 0,
    },
    {
      text: "Price",
      x: COL_XS.price,
      w: COL_WIDTHS.price,
      paddingLeft: 0,
      paddingRight: horizontalPadding,
    },
    {
      text: "Total",
      x: COL_XS.total,
      w: COL_WIDTHS.total,
      paddingLeft: 0,
      paddingRight: horizontalPadding,
    },
  ];

  // Draw column separators and header text.
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];

    // Draw a separator after every column except the last.
    if (i < headers.length - 1) {
      const separatorX = h.x + h.w;

      page.drawLine({
        start: {
          x: separatorX,
          y: thY,
        },
        end: {
          x: separatorX,
          y: thY + thH,
        },
        thickness: mm(1),
        color: TABLE_HEADER_BORDER,
      });
    }

    const innerX = h.x + h.paddingLeft;
    const innerW = h.w - h.paddingLeft - h.paddingRight;

    const textWidth = fonts.boldFont.widthOfTextAtSize(h.text, headerFontSize);

    const textX = innerX + (innerW - textWidth) / 2;

    page.drawText(h.text, {
      x: textX,
      y: textY,
      size: headerFontSize,
      font: fonts.boldFont,
      color: WHITE,
    });
  }

  // Advance to the bottom of the table header.
  state.y = thY;
}

// =========================================================
// TABLE BODY / ITEM ROWS
// Returns the number of items successfully drawn.
// =========================================================

export function drawItems(
  state: PageState,
  ctx: PdfContext,
  items: QuotationItem[],
  startIndex: number,
): number {
  const { page } = state;
  const { fonts } = ctx;

  // Do not draw a table header on a page that cannot fit its first row.
  // This allows the caller to retry the row on a fresh page.
  if (items.length > 0) {
    const firstRow = getItemRowLayout(items[0], ctx);

    const requiredSpace = TABLE_HEADER_HEIGHT + firstRow.height + 4;

    if (state.y - requiredSpace < CONTENT_BOTTOM + 10) {
      return 0;
    }
  }

  drawTableHeader(state, ctx);

  let drawnCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const {
      descriptionLines,
      height: rowHeight,
      lineHeight: descriptionLineHeight,
    } = getItemRowLayout(item, ctx);

    // Reserve room for the actual height of the next row.
    if (state.y - (rowHeight + 4) < CONTENT_BOTTOM + 10) {
      return drawnCount;
    }

    const rowY = state.y - rowHeight;

    // -------------------------------------------------------
    // Alternating row background
    // -------------------------------------------------------

    if ((startIndex + i + 1) % 2 === 0) {
      page.drawRectangle({
        x: PAD_SIDE,
        y: rowY,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: EVEN_ROW_BG,
      });
    }

    // -------------------------------------------------------
    // Bottom row border
    // -------------------------------------------------------

    page.drawLine({
      start: {
        x: PAD_SIDE,
        y: rowY,
      },
      end: {
        x: PAGE_WIDTH - PAD_SIDE,
        y: rowY,
      },
      thickness: 3 * PX,
      color: ROW_BORDER,
    });

    // Center single-line cell content within the actual row height.
    const cellY = rowY + (rowHeight - TABLE_BODY_FONT) / 2 + mm(0.7);

    // -------------------------------------------------------
    // No. column — centered
    // -------------------------------------------------------

    const noStr = String(startIndex + i + 1);

    const noWidth = fonts.serifFont.widthOfTextAtSize(noStr, TABLE_BODY_FONT);

    page.drawText(noStr, {
      x: COL_XS.no + (COL_WIDTHS.no - noWidth) / 2,
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });

    // -------------------------------------------------------
    // Description column — wrapped and vertically centered
    // -------------------------------------------------------

    const descriptionBlockHeight =
      TABLE_BODY_FONT + (descriptionLines.length - 1) * descriptionLineHeight;

    const descriptionBottomLineY =
      rowY + (rowHeight - descriptionBlockHeight) / 2 + mm(0.7);

    for (let lineIndex = 0; lineIndex < descriptionLines.length; lineIndex++) {
      // PDF coordinates start from the bottom. Draw the first line
      // at the top of the text block and subsequent lines below it.
      const lineY =
        descriptionBottomLineY +
        (descriptionLines.length - lineIndex - 1) * descriptionLineHeight;

      page.drawText(descriptionLines[lineIndex], {
        x: COL_XS.desc + mm(3),
        y: lineY,
        size: TABLE_BODY_FONT,
        font: fonts.serifFont,
        color: DARK,
      });
    }

    // -------------------------------------------------------
    // Size column — centered
    // -------------------------------------------------------

    const unitStr = item.size || "-";

    const unitWidth = fonts.serifFont.widthOfTextAtSize(
      unitStr,
      TABLE_BODY_FONT,
    );

    page.drawText(unitStr, {
      x: COL_XS.unit + (COL_WIDTHS.unit - unitWidth) / 2,
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });

    // -------------------------------------------------------
    // Quantity column — centered
    // -------------------------------------------------------

    const qtyStr = `${item.quantity} ${item.unit || ""}`;

    const qtyWidth = fonts.serifFont.widthOfTextAtSize(qtyStr, TABLE_BODY_FONT);

    page.drawText(qtyStr, {
      x: COL_XS.qty + (COL_WIDTHS.qty - qtyWidth) / 2,
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });

    // -------------------------------------------------------
    // Price column — right aligned
    // -------------------------------------------------------

    const priceStr = formatAmount(item.unitPrice);

    const priceWidth = fonts.serifFont.widthOfTextAtSize(
      priceStr,
      TABLE_BODY_FONT,
    );

    page.drawText(priceStr, {
      x: COL_XS.price + COL_WIDTHS.price - priceWidth - mm(3),
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });

    // -------------------------------------------------------
    // Total column — right aligned
    // -------------------------------------------------------

    const totalStr = formatAmount(calcItemTotal(item));

    const totalWidth = fonts.serifFont.widthOfTextAtSize(
      totalStr,
      TABLE_BODY_FONT,
    );

    page.drawText(totalStr, {
      x: COL_XS.total + COL_WIDTHS.total - totalWidth - mm(3),
      y: cellY,
      size: TABLE_BODY_FONT,
      font: fonts.serifFont,
      color: DARK,
    });

    // Advance by the actual height of the row just drawn.
    state.y = rowY;
    drawnCount++;
  }

  return drawnCount;
}

import type { PDFPage } from "pdf-lib";
import type { PdfContext, PageState } from "../types";
import {
  mm,
  PT,
  PAD_SIDE,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  CONTENT_WIDTH,
  HEADER_HEIGHT,
  HEADER_LEFT_W,
  HEADER_RIGHT_W,
  HEADER_RIGHT_X,
  BRAND_BLUE,
  HEADER_BORDER,
  WHITE,
  DARK,
  DETAILS_DARK,
} from "../layout";
import { formatDate } from "../../../../lib/documentUtils";

export function drawPageBackground(page: PDFPage, ctx: PdfContext): void {
  if (ctx.images.background) {
    page.drawImage(ctx.images.background, {
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
    });
  }
}

export function drawHeader(state: PageState, ctx: PdfContext): void {
  const { page, y } = state;
  const { fonts, images, quotation, business } = ctx;
  const headerTop = y;
  const headerBottom = headerTop - HEADER_HEIGHT;

  if (images.headerBg) {
    page.drawImage(images.headerBg, {
      x: PAD_SIDE,
      y: headerBottom,
      width: CONTENT_WIDTH,
      height: HEADER_HEIGHT,
    });
  }
  page.drawLine({
    start: { x: PAD_SIDE, y: headerBottom },
    end: { x: PAGE_WIDTH - PAD_SIDE, y: headerBottom },
    thickness: mm(1),
    color: HEADER_BORDER,
  });

  const logoMarginLeft = mm(24);
  const logoH = mm(12);
  if (images.logo) {
    const imgRatio = images.logo.width / images.logo.height;
    const logoW = logoH * imgRatio;
    page.drawImage(images.logo, {
      x: PAD_SIDE + logoMarginLeft,
      y: headerTop - logoH,
      width: logoW,
      height: logoH,
    });
  }

  const brandPadBottom = mm(3);
  const bizNameSize = 16 * PT;
  const bizNameLineH = bizNameSize * 1.6;
  const bizNameY = headerTop - logoH - 10 - bizNameLineH;
  page.drawText(business.businessName, {
    x: PAD_SIDE,
    y: bizNameY,
    size: bizNameSize,
    font: fonts.boldFont,
    color: BRAND_BLUE,
  });

  const detailSize = 9 * PT;
  const detailLineH = detailSize * 1.4;
  const detailsBottom = headerBottom + brandPadBottom;
  const detailsY = detailsBottom + detailLineH * 3;
  const drawDetailLine = (label: string, value: string, dy: number) => {
    const labelW = fonts.boldFont.widthOfTextAtSize(label, detailSize);
    page.drawText(label, {
      x: PAD_SIDE,
      y: dy,
      size: detailSize,
      font: fonts.boldFont,
      color: DETAILS_DARK,
    });
    page.drawText(value, {
      x: PAD_SIDE + labelW + mm(1),
      y: dy,
      size: detailSize,
      font: fonts.serifFont,
      color: DETAILS_DARK,
    });
  };
  page.drawText(business.address, {
    x: PAD_SIDE,
    y: detailsY,
    size: detailSize,
    font: fonts.serifFont,
    color: DETAILS_DARK,
  });
  drawDetailLine("Tel:", business.phone, detailsY - detailLineH);
  drawDetailLine("Email:", business.email, detailsY - detailLineH * 2);
  drawDetailLine("Website:", business.siteUrl, detailsY - detailLineH * 3);

  const titleH = mm(11);
  const titleW = mm(62);
  const titleX = HEADER_RIGHT_X + HEADER_RIGHT_W - titleW;
  const titleY = headerTop - titleH;
  const titleText = "QUOTATION";
  const titleTextW = fonts.boldFont.widthOfTextAtSize(titleText, 14 * PT);
  page.drawText(titleText, {
    x: titleX + (titleW - titleTextW) / 2,
    y: titleY + (titleH - 14 * PT) / 2,
    size: 14 * PT,
    font: fonts.boldFont,
    color: WHITE,
  });

  let barcodeBottomY = titleY - mm(3);
  if (images.barcode) {
    const bw = mm(54);
    const bh = mm(8);
    page.drawImage(images.barcode, {
      x: HEADER_RIGHT_X + HEADER_RIGHT_W - bw - mm(8),
      y: barcodeBottomY - bh,
      width: bw,
      height: bh,
    });
    barcodeBottomY = barcodeBottomY - bh;
  }

  const codeSize = 12 * PT;
  const codeY = barcodeBottomY - 5 - codeSize;
  const codeText = quotation.quotationCode || "";
  page.drawText(codeText, {
    x:
      HEADER_RIGHT_X +
      HEADER_RIGHT_W -
      fonts.boldFont.widthOfTextAtSize(codeText, codeSize) -
      mm(12),
    y: codeY,
    size: codeSize,
    font: fonts.boldFont,
    color: BRAND_BLUE,
  });

  const dateSize = 11 * PT;
  const dateY = codeY - 5 - dateSize;
  const dateLabel = "Date:";
  const dateValue = formatDate(quotation.createdAt);
  const dateLabelW = fonts.boldFont.widthOfTextAtSize(dateLabel, dateSize);
  const dateTotalW =
    dateLabelW + mm(1) + fonts.font.widthOfTextAtSize(dateValue, dateSize);
  page.drawText(dateLabel, {
    x: HEADER_RIGHT_X + HEADER_RIGHT_W - dateTotalW - mm(12),
    y: dateY,
    size: dateSize,
    font: fonts.boldFont,
    color: BRAND_BLUE,
  });
  page.drawText(dateValue, {
    x: HEADER_RIGHT_X + HEADER_RIGHT_W - dateTotalW - mm(12) + dateLabelW + mm(1),
    y: dateY,
    size: dateSize,
    font: fonts.font,
    color: DARK,
  });

  state.y = headerBottom;
}

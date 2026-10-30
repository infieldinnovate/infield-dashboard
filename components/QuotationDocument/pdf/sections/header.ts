import type { PDFImage, PDFPage } from "pdf-lib";
import {
  clip,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
} from "pdf-lib";

import type { PdfContext, PageState } from "../types";
import {
  mm,
  PT,
  PAD_SIDE,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  CONTENT_WIDTH,
  HEADER_HEIGHT,
  BRAND_BLUE,
  HEADER_BORDER,
  WHITE,
  DARK,
  DETAILS_DARK,
} from "../layout";
import { formatDate } from "../../../../lib/documentUtils";

function baselineFromLineBoxTop(fontSize: number, lineHeight: number): number {
  const leading = Math.max(0, lineHeight - fontSize);

  return leading / 2 + fontSize * 0.8;
}

function baselineFromLineBoxBottom(
  fontSize: number,
  lineHeight: number,
): number {
  const leading = Math.max(0, lineHeight - fontSize);

  return leading / 2 + fontSize * 0.2;
}

function drawImageCover(
  page: PDFPage,
  image: PDFImage,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (image.width <= 0 || image.height <= 0 || width <= 0 || height <= 0) {
    return;
  }

  const scale = Math.max(width / image.width, height / image.height);

  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;

  const imageX = x + (width - scaledWidth) / 2;
  const imageY = y + (height - scaledHeight) / 2;

  page.pushOperators(
    pushGraphicsState(),
    rectangle(x, y, width, height),
    clip(),
    endPath(),
  );

  page.drawImage(image, {
    x: imageX,
    y: imageY,
    width: scaledWidth,
    height: scaledHeight,
  });

  page.pushOperators(popGraphicsState());
}

export function drawPageBackground(page: PDFPage, ctx: PdfContext): void {
  if (!ctx.images.background) {
    return;
  }

  page.drawImage(ctx.images.background, {
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  });
}

export function drawHeader(state: PageState, ctx: PdfContext): void {
  const { page, y: headerTop } = state;
  const { fonts, images, quotation, business } = ctx;

  const headerHeight = HEADER_HEIGHT;
  const headerBottom = headerTop - headerHeight;

  const headerBorderWidth = mm(1);
  const headerContentHeight = Math.max(0, headerHeight - headerBorderWidth);

  const headerContentBottom = headerBottom + headerBorderWidth;

  const gridGap = mm(6);
  const availableGridWidth = CONTENT_WIDTH - gridGap;

  const leftColumnWidth = availableGridWidth * (1.2 / 2);
  const rightColumnWidth = availableGridWidth * (0.8 / 2);

  const rightColumnX = PAD_SIDE + leftColumnWidth + gridGap;

  const rightColumnRight = rightColumnX + rightColumnWidth;

  if (images.headerBg) {
    drawImageCover(
      page,
      images.headerBg,
      PAD_SIDE,
      headerBottom,
      CONTENT_WIDTH,
      headerHeight,
    );
  }

  page.drawLine({
    start: {
      x: PAD_SIDE,
      y: headerBottom + headerBorderWidth / 2,
    },
    end: {
      x: PAGE_WIDTH - PAD_SIDE,
      y: headerBottom + headerBorderWidth / 2,
    },
    thickness: headerBorderWidth,
    color: HEADER_BORDER,
  });

  const logoHeight = mm(12);
  const logoMarginLeft = mm(24);

  if (images.logo) {
    const logoAspectRatio = images.logo.width / images.logo.height;

    const logoWidth = logoHeight * logoAspectRatio;

    page.drawImage(images.logo, {
      x: PAD_SIDE + logoMarginLeft,
      y: headerTop - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  }

  const businessNameSize = 16 * PT;
  const businessNameLineHeight = businessNameSize * 1.6;

  const detailSize = 9 * PT;
  const detailLineHeight = detailSize * 1.4;
  const detailLineCount = 4;

  const detailsBlockHeight = detailLineHeight * detailLineCount;

  const brandVerticalOffset = mm(1);
  const brandPaddingBottom = mm(4);

  const brandAvailableHeight = headerContentHeight - brandPaddingBottom;

  const brandFreeSpace =
    brandAvailableHeight -
    logoHeight -
    businessNameLineHeight -
    detailsBlockHeight;

  const brandGap = Math.max(0, brandFreeSpace / 2);

  const businessNameLineBoxTop =
    headerTop - logoHeight - brandGap - brandVerticalOffset;

  const businessNameY =
    businessNameLineBoxTop -
    baselineFromLineBoxTop(businessNameSize, businessNameLineHeight);

  page.drawText(business.businessName, {
    x: PAD_SIDE,
    y: businessNameY,
    size: businessNameSize,
    font: fonts.boldFont,
    color: BRAND_BLUE,
  });

  const detailsLineBoxBottom = headerContentBottom + brandPaddingBottom;

  const detailBaselineFromBottom = baselineFromLineBoxBottom(
    detailSize,
    detailLineHeight,
  );

  const detailsFirstLineY =
    detailsLineBoxBottom +
    detailBaselineFromBottom +
    detailLineHeight * (detailLineCount - 1);

  const drawDetailLine = (
    label: string,
    value: string,
    baselineY: number,
  ): void => {
    const labelWidth = fonts.boldFont.widthOfTextAtSize(label, detailSize);

    page.drawText(label, {
      x: PAD_SIDE,
      y: baselineY,
      size: detailSize,
      font: fonts.boldFont,
      color: DETAILS_DARK,
    });

    page.drawText(value, {
      x: PAD_SIDE + labelWidth + mm(1),
      y: baselineY,
      size: detailSize,
      font: fonts.serifFont,
      color: DETAILS_DARK,
    });
  };

  page.drawText(business.address, {
    x: PAD_SIDE,
    y: detailsFirstLineY,
    size: detailSize,
    font: fonts.serifFont,
    color: DETAILS_DARK,
  });

  drawDetailLine("Tel:", business.phone, detailsFirstLineY - detailLineHeight);

  drawDetailLine(
    "Email:",
    business.email,
    detailsFirstLineY - detailLineHeight * 2,
  );

  drawDetailLine(
    "Website:",
    business.siteUrl,
    detailsFirstLineY - detailLineHeight * 3,
  );

  const titleWidth = mm(62);
  const titleHeight = mm(11);

  const titleX = rightColumnRight - titleWidth;

  const titleBoxBottom = headerTop - titleHeight;

  const titleText = "QUOTATION";
  const titleSize = 14 * PT;
  const titleLineHeight = titleSize * 1.2;

  const titleCharacterSpacing = titleSize * 0.03;

  const titleTextWidth =
    fonts.boldFont.widthOfTextAtSize(titleText, titleSize) +
    Math.max(0, titleText.length - 1) * titleCharacterSpacing;

  const titleTextX = titleX + (titleWidth - titleTextWidth) / 2;

  const titleTextY =
    titleBoxBottom +
    (titleHeight - titleLineHeight) / 2 +
    baselineFromLineBoxBottom(titleSize, titleLineHeight);

  page.drawText(titleText, {
    x: titleTextX,
    y: titleTextY,
    size: titleSize,
    font: fonts.boldFont,
    color: WHITE,
  });

  const titleBlockPaddingBottom = mm(5);

  const barcodeWidth = mm(54);
  const barcodeHeight = mm(8);
  const barcodeMarginTop = mm(3);
  const barcodeMarginRight = mm(8);

  const codeSize = 12 * PT;
  const codeLineHeight = codeSize * 1.2;
  const codeText = quotation.quotationCode;

  const dateSize = 11 * PT;
  const dateLineHeight = dateSize * 1.2;
  const dateLabel = "Date:";
  const dateValue = formatDate(quotation.createdAt);

  const rightAvailableHeight = headerContentHeight - titleBlockPaddingBottom;

  const barcodeOuterHeight = images.barcode
    ? barcodeMarginTop + barcodeHeight
    : 0;

  const rightItemsHeight =
    titleHeight + barcodeOuterHeight + codeLineHeight + dateLineHeight;

  const rightGapCount = images.barcode ? 3 : 2;

  const rightFreeSpace = rightAvailableHeight - rightItemsHeight;

  const rightGap = Math.max(0, rightFreeSpace / rightGapCount);

  let codeLineBoxTop: number;

  if (images.barcode) {
    const barcodeImageTop = titleBoxBottom - rightGap - barcodeMarginTop;

    const barcodeImageBottom = barcodeImageTop - barcodeHeight;

    page.drawImage(images.barcode, {
      x: rightColumnRight - barcodeWidth - barcodeMarginRight,
      y: barcodeImageBottom,
      width: barcodeWidth,
      height: barcodeHeight,
    });

    codeLineBoxTop = barcodeImageBottom - rightGap;
  } else {
    codeLineBoxTop = titleBoxBottom - rightGap;
  }

  const codeLineBoxBottom = codeLineBoxTop - codeLineHeight;

  const codeY =
    codeLineBoxBottom + baselineFromLineBoxBottom(codeSize, codeLineHeight);

  const codeTextWidth = fonts.boldFont.widthOfTextAtSize(codeText, codeSize);

  page.drawText(codeText, {
    x: rightColumnRight - mm(12) - codeTextWidth,
    y: codeY,
    size: codeSize,
    font: fonts.boldFont,
    color: BRAND_BLUE,
  });

  const dateLineBoxTop = codeLineBoxBottom - rightGap;

  const dateLineBoxBottom = dateLineBoxTop - dateLineHeight;

  const dateY =
    dateLineBoxBottom + baselineFromLineBoxBottom(dateSize, dateLineHeight);

  const dateLabelWidth = fonts.boldFont.widthOfTextAtSize(dateLabel, dateSize);

  const dateValueWidth = fonts.font.widthOfTextAtSize(dateValue, dateSize);

  const dateTextWidth = dateLabelWidth + mm(1) + dateValueWidth;

  const dateX = rightColumnRight - mm(12) - dateTextWidth;

  page.drawText(dateLabel, {
    x: dateX,
    y: dateY,
    size: dateSize,
    font: fonts.boldFont,
    color: BRAND_BLUE,
  });

  page.drawText(dateValue, {
    x: dateX + dateLabelWidth + mm(1),
    y: dateY,
    size: dateSize,
    font: fonts.font,
    color: DARK,
  });

  state.y = headerBottom;
}

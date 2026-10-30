// components\QuotationDocument\pdf\sections\footer.ts

import {
  rgb,
  pushGraphicsState,
  popGraphicsState,
  rectangle,
  clip,
  endPath,
} from "pdf-lib";
import type { PDFPage } from "pdf-lib";
import type { PdfContext } from "../types";
import {
  mm,
  PT,
  PX,
  PAD_SIDE,
  PAGE_WIDTH,
  CONTENT_WIDTH,
  FOOTER_HEIGHT,
  WHITE,
  BLACK,
  CONTACT_BLUE,
} from "../layout";

const FOOTER_TEXT = rgb(17 / 255, 17 / 255, 17 / 255);

export function drawFooter(page: PDFPage, ctx: PdfContext): void {
  const { fonts, images, quotation, business } = ctx;

  // =========================================================
  // 1. FOOTER BACKGROUND
  // =========================================================

  if (images.footerBg) {
    const bg = images.footerBg;

    const scale = Math.max(CONTENT_WIDTH / bg.width, FOOTER_HEIGHT / bg.height);

    const bgWidth = bg.width * scale;
    const bgHeight = bg.height * scale;

    const bgX = PAD_SIDE + (CONTENT_WIDTH - bgWidth) / 2;
    const bgY = (FOOTER_HEIGHT - bgHeight) / 2;

    page.pushOperators(
      pushGraphicsState(),
      rectangle(PAD_SIDE, 0, CONTENT_WIDTH, FOOTER_HEIGHT),
      clip(),
      endPath(),
    );

    page.drawImage(bg, {
      x: bgX,
      y: bgY,
      width: bgWidth,
      height: bgHeight,
    });

    page.pushOperators(popGraphicsState());
  }

  // =========================================================
  // 2. CONTACT & THANK-YOU CONTAINER
  // =========================================================

  const contactContainerHeight = mm(28) + mm(3);
  const contactContainerTopInset = (FOOTER_HEIGHT - contactContainerHeight) / 2;

  const contactPaddingTop = mm(3);
  const contactFontSize = 10 * PT;
  const phoneFontSize = 9 * PT;

  const contactLineHeight = 12 * PT;
  const contactBaselineFromTop = 8 * PT;

  const contactY =
    FOOTER_HEIGHT -
    contactContainerTopInset -
    contactPaddingTop -
    contactBaselineFromTop -
    mm(2);

  // ---------------------------------------------------------
  // 2A. Contact label
  // ---------------------------------------------------------

  const contactLabel = "CONTACT US:";

  page.drawText(contactLabel, {
    x: PAD_SIDE,
    y: contactY,
    size: contactFontSize,
    font: fonts.boldFont,
    color: CONTACT_BLUE,
  });

  // ---------------------------------------------------------
  // 2B. Phone number
  // ---------------------------------------------------------

  const contactLabelWidth = fonts.boldFont.widthOfTextAtSize(
    contactLabel,
    contactFontSize,
  );

  page.drawText(business.phone, {
    x: PAD_SIDE + contactLabelWidth + mm(5),
    y: contactY,
    size: phoneFontSize,
    font: fonts.font,
    color: BLACK,
  });

  // ---------------------------------------------------------
  // 2C. Thank-you message
  // ---------------------------------------------------------

  const contactThankGap = mm(6);
  const thankFontSize = 7 * PT;
  const thankLineHeight = 12 * PX;

  const thankBaselineFromTop =
    (thankLineHeight - thankFontSize) / 2 + thankFontSize * 0.8;

  const contactBaselineToLineBoxBottom =
    contactLineHeight - contactBaselineFromTop;

  const thankFirstY =
    contactY -
    contactBaselineToLineBoxBottom -
    contactThankGap -
    thankBaselineFromTop;

  const thankLines = [
    "Thank you for choosing Infield Innovations.",
    "We deliver exceptional results with unmatched expertise and dedication.",
  ];

  thankLines.forEach((line, index) => {
    page.drawText(line, {
      x: PAD_SIDE,
      y: thankFirstY - index * thankLineHeight,
      size: thankFontSize,
      font: fonts.serifItalic,
      color: FOOTER_TEXT,
    });
  });

  // =========================================================
  // 3. QUOTATION CREATOR
  // =========================================================

  const creatorWidth = mm(54);
  const creatorRightMargin = mm(16);
  const creatorBottomMargin = mm(12);
  const creatorFontSize = 11 * PT;

  const creatorX = PAGE_WIDTH - PAD_SIDE - creatorRightMargin - creatorWidth;

  const creatorText = `By ${quotation.createdBy || ""}`;

  const creatorTextWidth = fonts.serifItalic.widthOfTextAtSize(
    creatorText,
    creatorFontSize,
  );

  const creatorY =
    FOOTER_HEIGHT / 2 + creatorBottomMargin / 2 - creatorFontSize * 0.25;

  page.drawText(creatorText, {
    x: creatorX + (creatorWidth - creatorTextWidth) / 2,
    y: creatorY,
    size: creatorFontSize,
    font: fonts.serifItalic,
    color: WHITE,
  });
}

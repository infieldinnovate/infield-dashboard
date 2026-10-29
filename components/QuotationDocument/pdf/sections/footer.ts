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
  DETAILS_DARK,
  CONTACT_BLUE,
} from "../layout";

export function drawFooter(page: PDFPage, ctx: PdfContext): void {
  const { fonts, images, quotation, business } = ctx;

  if (images.footerBg) {
    page.drawImage(images.footerBg, {
      x: PAD_SIDE,
      y: 0,
      width: CONTENT_WIDTH,
      height: FOOTER_HEIGHT,
    });
  }

  const ctPadTop = mm(3);
  const ctGap = mm(6);
  const contactY = FOOTER_HEIGHT - ctPadTop - 10 * PT;
  page.drawText("CONTACT US:", {
    x: PAD_SIDE,
    y: contactY,
    size: 10 * PT,
    font: fonts.boldFont,
    color: CONTACT_BLUE,
  });
  const contactLabelW = fonts.boldFont.widthOfTextAtSize(
    "CONTACT US:",
    10 * PT,
  );
  page.drawText(business.phone, {
    x: PAD_SIDE + contactLabelW + mm(5),
    y: contactY,
    size: 9 * PT,
    font: fonts.font,
    color: DETAILS_DARK,
  });

  const thankLineH = 12 * PX;
  const thankY = contactY - ctGap - 7 * PT;
  const thankLines = [
    "Thank you for choosing Infield Innovations.",
    "We deliver exceptional results with unmatched expertise and dedication.",
  ];
  for (let i = 0; i < thankLines.length; i++) {
    page.drawText(thankLines[i], {
      x: PAD_SIDE,
      y: thankY - i * thankLineH,
      size: 7 * PT,
      font: fonts.serifItalic,
      color: DETAILS_DARK,
    });
  }

  const cbW = mm(54);
  const cbX = PAGE_WIDTH - PAD_SIDE - mm(16) - cbW;
  const cbY = FOOTER_HEIGHT - mm(12) - 11 * PT;
  const cbLabel = `By ${quotation.createdBy || ""}`;
  page.drawText(cbLabel, {
    x:
      cbX +
      (cbW - fonts.serifBoldItalic.widthOfTextAtSize(cbLabel, 11 * PT)) / 2,
    y: cbY,
    size: 11 * PT,
    font: fonts.serifBoldItalic,
    color: WHITE,
  });
}

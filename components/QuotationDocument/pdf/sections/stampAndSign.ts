// components\QuotationDocument\pdf\sections\stampAndSign.ts

import { degrees, rgb } from "pdf-lib";
import type { PdfContext, PageState } from "../types";
import {
  mm,
  PT,
  PX,
  PAD_SIDE,
  PAGE_WIDTH,
  STAMP_SIGN_HEIGHT,
  STAMP_SIGN_PAD,
  SIGN_LABEL_W,
  SIGN_LABEL_H,
  SIGN_IMG_W,
  SIGN_IMG_H,
  BLACK,
  WHITE,
  STAMP_RED,
} from "../layout";
import { formatStampDate } from "../../../../lib/documentUtils";

const SECTION_TEXT = rgb(17 / 255, 17 / 255, 17 / 255);

/**
 * Convert a point in the stamp's unrotated, center-based coordinate system
 * into PDF page coordinates.
 *
 * PDF page coordinates increase upwards.
 */
function rotateLocalPoint(
  cx: number,
  cy: number,
  localX: number,
  localY: number,
  radians: number,
): { x: number; y: number } {
  const cosR = Math.cos(radians);
  const sinR = Math.sin(radians);

  return {
    x: cx + localX * cosR - localY * sinR,
    y: cy + localX * sinR + localY * cosR,
  };
}

export function drawStampAndSign(state: PageState, ctx: PdfContext): void {
  const { page } = state;
  const { fonts, images, quotation } = ctx;

  const sectionTop = state.y;
  const sectionBottom = sectionTop - STAMP_SIGN_HEIGHT;
  const sectionCenterY = sectionTop - STAMP_SIGN_HEIGHT / 2;

  // =========================================================
  // 1. SECTION GEOMETRY
  // CSS: height: 35mm; padding: 0 17mm;
  //      display: flex; justify-content: space-between;
  //      align-items: center; overflow: hidden.
  // =========================================================

  const innerLeft = PAD_SIDE + STAMP_SIGN_PAD;
  const innerRight = PAGE_WIDTH - PAD_SIDE - STAMP_SIGN_PAD;
  const innerW = innerRight - innerLeft;

  // =========================================================
  // 2. DIGITAL SIGNATURE LABEL
  // CSS: width: 40mm; height: 27mm;
  //      Times New Roman; bold italic;
  //      vertically centered; double right border.
  // =========================================================

  const labelX = innerLeft;
  const labelCenterY = sectionCenterY;
  const labelFont = 11 * PT;

  const labelBottom = labelCenterY - SIGN_LABEL_H / 2;
  const labelTop = labelCenterY + SIGN_LABEL_H / 2;
  const labelRightX = labelX + SIGN_LABEL_W;

  // HTML collapses leading/trailing whitespace in normal white-space mode.
  const labelText = "Digitally Signed:";

  // PDF drawText uses a baseline. This offset approximates visual centering
  // of the Times-style glyphs inside the CSS flex-aligned label.
  page.drawText(labelText, {
    x: labelX,
    y: labelCenterY - labelFont * 0.25,
    size: labelFont,
    font: fonts.serifBoldItalic,
    color: SECTION_TEXT,
  });

  // Outer border: 1 CSS pixel.
  // Center the PDF stroke within the CSS border's occupied area.
  const thinBorderW = 1 * PX;
  const thinBorderX = labelRightX - thinBorderW / 2;

  page.drawLine({
    start: {
      x: thinBorderX,
      y: labelBottom + thinBorderW / 2,
    },
    end: {
      x: thinBorderX,
      y: labelTop - thinBorderW / 2,
    },
    thickness: thinBorderW,
    color: BLACK,
  });

  // Inner border: CSS ::after { right: 3px; border-right: 3px solid }.
  // Its center lies 3px + half the stroke width from the right edge.
  const thickBorderW = 3 * PX;
  const thickBorderX = labelRightX - 3 * PX - thickBorderW / 2;

  page.drawLine({
    start: {
      x: thickBorderX,
      y: labelBottom + thickBorderW / 2,
    },
    end: {
      x: thickBorderX,
      y: labelTop - thickBorderW / 2,
    },
    thickness: thickBorderW,
    color: BLACK,
  });

  // =========================================================
  // 3. SIGNATURE IMAGE
  // CSS: width: 50mm; height: 20mm;
  //      object-fit: contain.
  // =========================================================

  const sigX = innerRight - SIGN_IMG_W;
  const sigY = sectionCenterY - SIGN_IMG_H / 2;

  if (images.signature) {
    const imageRatio = images.signature.width / images.signature.height;
    const containerRatio = SIGN_IMG_W / SIGN_IMG_H;

    let drawW: number;
    let drawH: number;

    if (imageRatio > containerRatio) {
      drawW = SIGN_IMG_W;
      drawH = SIGN_IMG_W / imageRatio;
    } else {
      drawH = SIGN_IMG_H;
      drawW = SIGN_IMG_H * imageRatio;
    }

    page.drawImage(images.signature, {
      x: sigX + (SIGN_IMG_W - drawW) / 2,
      y: sigY + (SIGN_IMG_H - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  // =========================================================
  // 4. DIGITAL STAMP
  // CSS: width: 30mm; height: 25mm;
  //      transform: rotate(-35deg).
  //
  // Flexbox distributes the three items evenly, so the stamp
  // center is calculated from the remaining space.
  // =========================================================

  const stampW = mm(30);
  const stampH = mm(25);

  const stampAreaW = innerW - SIGN_LABEL_W - SIGN_IMG_W;
  const stampCx = innerLeft + SIGN_LABEL_W + stampAreaW / 2;
  const stampCy = sectionCenterY;

  const stampRotation = 35;
  const stampRadians = (stampRotation * Math.PI) / 180;

  if (images.stamp) {
    // pdf-lib rotates the image around its drawing origin.
    // Transform the unrotated bottom-left corner so the image
    // remains centered on the intended stamp center.
    const imageOrigin = rotateLocalPoint(
      stampCx,
      stampCy,
      -stampW / 2,
      -stampH / 2,
      stampRadians,
    );

    page.drawImage(images.stamp, {
      x: imageOrigin.x,
      y: imageOrigin.y,
      width: stampW,
      height: stampH,
      rotate: degrees(stampRotation),
    });

    // CSS: .qt-stamp-date { bottom: 6mm; font-size: 5.2pt; }
    const dateSize = 5.2 * PT;
    const dateText = formatStampDate(quotation.createdAt);
    const dateWidth = fonts.font.widthOfTextAtSize(dateText, dateSize);

    // Place the text baseline above the 6mm bottom inset.
    // The small font adjustment approximates the CSS line-box baseline.
    const dateLocalY = -stampH / 2 + mm(6) + dateSize * 0.2;

    const dateOrigin = rotateLocalPoint(
      stampCx,
      stampCy,
      -dateWidth / 2,
      dateLocalY,
      stampRadians,
    );

    page.drawText(dateText, {
      x: dateOrigin.x,
      y: dateOrigin.y,
      size: dateSize,
      font: fonts.font,
      color: BLACK,
      rotate: degrees(stampRotation),
    });
  } else {
    // =======================================================
    // 5. FALLBACK STAMP
    // Kept for cases where no stamp image is available.
    // The CSS excerpt does not define this fallback artwork.
    // =======================================================

    const stampRadius = 44;

    page.drawCircle({
      x: stampCx,
      y: stampCy,
      size: stampRadius,
      borderWidth: 2.5,
      borderColor: STAMP_RED,
      color: WHITE,
    });

    // Treat every text baseline as a local point within the stamp,
    // then rotate it using the same angle as the CSS stamp container.
    const drawStampText = (
      text: string,
      localY: number,
      size: number,
      font: typeof fonts.font,
    ): void => {
      const textWidth = font.widthOfTextAtSize(text, size);

      const origin = rotateLocalPoint(
        stampCx,
        stampCy,
        -textWidth / 2,
        localY,
        stampRadians,
      );

      page.drawText(text, {
        x: origin.x,
        y: origin.y,
        size,
        font,
        color: STAMP_RED,
        rotate: degrees(stampRotation),
      });
    };

    drawStampText("INFIELD", 16, 11, fonts.boldFont);
    drawStampText("* * * *", 4, 7, fonts.font);
    drawStampText("+254 702 393 677", -6, 7, fonts.font);
    drawStampText(formatStampDate(quotation.createdAt), -15, 6, fonts.font);
    drawStampText("DIGITAL STAMP", -27, 6, fonts.boldFont);
  }

  // Preserve the section's expected ending position.
  state.y = sectionBottom;
}

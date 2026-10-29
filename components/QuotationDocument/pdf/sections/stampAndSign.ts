import { degrees } from "pdf-lib";
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

export function drawStampAndSign(state: PageState, ctx: PdfContext): void {
  const { page, y } = state;
  const { fonts, images, quotation } = ctx;
  const sectionTop = y;
  const sectionBottom = sectionTop - STAMP_SIGN_HEIGHT;
  const sectionCenterY = sectionTop - STAMP_SIGN_HEIGHT / 2;

  const innerLeft = PAD_SIDE + STAMP_SIGN_PAD;
  const innerRight = PAGE_WIDTH - PAD_SIDE - STAMP_SIGN_PAD;
  const innerW = innerRight - innerLeft;

  // Label
  const labelText = " Digitally Signed: ";
  const labelFont = 11 * PT;
  const labelX = innerLeft;
  const labelTop = sectionCenterY + SIGN_LABEL_H / 2;
  const labelBottom = sectionCenterY - SIGN_LABEL_H / 2;

  page.drawText(labelText, {
    x: labelX,
    y: sectionCenterY - labelFont / 2,
    size: labelFont,
    font: fonts.serifBoldItalic,
    color: BLACK,
  });

  const labelRightX = labelX + SIGN_LABEL_W;
  page.drawLine({
    start: { x: labelRightX, y: labelBottom },
    end: { x: labelRightX, y: labelTop },
    thickness: 1 * PX,
    color: BLACK,
  });
  page.drawLine({
    start: { x: labelRightX - 3 * PX, y: labelBottom },
    end: { x: labelRightX - 3 * PX, y: labelTop },
    thickness: 3 * PX,
    color: BLACK,
  });

  // Signature image (right)
  const sigX = innerRight - SIGN_IMG_W;
  const sigY = sectionCenterY - SIGN_IMG_H / 2;
  if (images.signature) {
    const imgRatio = images.signature.width / images.signature.height;
    let drawW = SIGN_IMG_W;
    let drawH = SIGN_IMG_H;
    if (drawW / drawH > imgRatio) {
      drawW = SIGN_IMG_H * imgRatio;
    } else {
      drawH = SIGN_IMG_W / imgRatio;
    }
    page.drawImage(images.signature, {
      x: sigX + (SIGN_IMG_W - drawW) / 2,
      y: sigY + (SIGN_IMG_H - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  // Stamp (center)
  const stampW = mm(30);
  const stampH = mm(25);
  const stampAreaW = innerW - SIGN_LABEL_W - SIGN_IMG_W;
  const stampCx = innerLeft + SIGN_LABEL_W + stampAreaW / 2;
  const stampCy = sectionCenterY;

  if (images.stamp) {
    const stampRot = -35;
    const stampRad = (stampRot * Math.PI) / 180;
    const cosR = Math.cos(stampRad);
    const sinR = Math.sin(stampRad);
    const imgX = stampCx - (stampW / 2) * cosR + (stampH / 2) * sinR;
    const imgY = stampCy - (stampW / 2) * sinR - (stampH / 2) * cosR;
    page.drawImage(images.stamp, {
      x: imgX,
      y: imgY,
      width: stampW,
      height: stampH,
      rotate: degrees(stampRot),
    });
    const stampDateSize = 5.2 * PT;
    const stampDateText = formatStampDate(quotation.createdAt);
    const stampDateW = fonts.font.widthOfTextAtSize(stampDateText, stampDateSize);
    const stampDateHalfW = stampDateW / 2;
    const stampDateDy = -stampH / 2 + mm(6);
    const stampDateTx =
      stampCx - stampDateHalfW * cosR + stampDateDy * sinR;
    const stampDateTy =
      stampCy + stampDateDy - stampDateHalfW * sinR - stampDateDy * cosR;
    page.drawText(stampDateText, {
      x: stampDateTx,
      y: stampDateTy,
      size: stampDateSize,
      font: fonts.font,
      color: BLACK,
      rotate: degrees(stampRot),
    });
  } else {
    const stampR = 44;
    page.drawCircle({
      x: stampCx,
      y: stampCy,
      size: stampR,
      borderWidth: 2.5,
      borderColor: STAMP_RED,
      color: WHITE,
    });
    const stampRot = -8;
    const stampRad = (stampRot * Math.PI) / 180;
    const stampCos = Math.cos(stampRad);
    const stampSin = Math.sin(stampRad);
    const drawStampText = (
      text: string,
      dy: number,
      size: number,
      f: typeof fonts.font,
      color: typeof STAMP_RED,
    ) => {
      const w = f.widthOfTextAtSize(text, size);
      const halfW = w / 2;
      const halfH = size / 4;
      const tx = stampCx - halfW * stampCos + halfH * stampSin;
      const ty = stampCy + dy - halfW * stampSin - halfH * stampCos;
      page.drawText(text, {
        x: tx,
        y: ty,
        size,
        font: f,
        color,
        rotate: degrees(stampRot),
      });
    };
    drawStampText("INFIELD", 16, 11, fonts.boldFont, STAMP_RED);
    drawStampText("* * * *", 4, 7, fonts.font, STAMP_RED);
    drawStampText("+254 702 393 677", -6, 7, fonts.font, STAMP_RED);
    drawStampText(
      formatStampDate(quotation.createdAt),
      -15,
      6,
      fonts.font,
      STAMP_RED,
    );
    drawStampText("DIGITAL STAMP", -27, 6, fonts.boldFont, STAMP_RED);
  }

  state.y = sectionBottom;
}

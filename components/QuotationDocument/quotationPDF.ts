import {
  PDFDocument,
  PDFFont,
  PDFPage,
  degrees,
  rgb,
  StandardFonts,
} from "pdf-lib";
import type { Quotation, QuotationItem } from "../../types";
import {
  calcItemTotal,
  calcQuotationTotals,
  downloadPDF,
  fetchImageBytes,
  formatCurrency,
  formatDate,
  formatStampDate,
  generateBarcode,
  generateBarcodePng,
  getSettings,
} from "../../lib/documentUtils";
import {
  ITEMS_PER_MIDDLE_PAGE,
  ITEMS_PER_PAGE,
  formatAmount,
} from "./documentHelpers";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const BRAND_GREEN = rgb(0.086, 0.282, 0.388);
const TABLE_GREEN = rgb(0.063, 0.294, 0.408);
const FOR_LABEL_BG = rgb(0.741, 0.741, 0.741);
const FOR_CONTENT_BG = rgb(0.831, 0.831, 0.831);
const GRAND_TOTAL_BG = rgb(0.953, 0.969, 0.965);
const EVEN_ROW_BG = rgb(0.941, 0.961, 0.953);
const STAMP_RED = rgb(0.753, 0.224, 0.169);
const DARK = rgb(0.067, 0.067, 0.067);
const DETAILS_DARK = rgb(0.082, 0.082, 0.082);
const CLIENT_DETAIL = rgb(0.267, 0.267, 0.267);
const WHITE = rgb(1, 1, 1);
const ACCENT_LINE = rgb(0.718, 0.718, 0.718);
const ROW_BORDER = rgb(0.863, 0.898, 0.91);
const TOTALS_BORDER = rgb(0.824, 0.824, 0.824);
const COMPACT_GREEN = rgb(0.071, 0.396, 0.259);
const COMPACT_TITLE = rgb(0.4, 0.4, 0.4);
const COMPACT_CODE = rgb(0.6, 0.6, 0.6);
const COMPACT_BORDER = rgb(0.898, 0.898, 0.898);

export async function generateQuotationPDF(
  quotation: Quotation,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const serifFont: PDFFont = await doc.embedFont(StandardFonts.TimesRoman);
  const serifItalic: PDFFont = await doc.embedFont(
    StandardFonts.TimesRomanItalic,
  );

  const settings = getSettings();
  const { businessName, address, phone, email, website, logo } =
    settings.business;
  const siteUrl = website || "www.infield.co.ke";
  const barcodeValue = generateBarcode(
    quotation.userId,
    quotation.quotationCode,
  );
  const signatureSrc =
    quotation.createdBySignature || settings.business.signature;

  const logoBytes = await fetchImageBytes(logo);
  let logoImg = null;
  if (logoBytes) {
    try {
      logoImg = await doc.embedPng(logoBytes);
    } catch {
      try {
        logoImg = await doc.embedJpg(logoBytes);
      } catch {
        /* ignore */
      }
    }
  }

  const barcodeBytes = await generateBarcodePng(barcodeValue);
  let barcodeImg = null;
  if (barcodeBytes) {
    try {
      barcodeImg = await doc.embedPng(barcodeBytes);
    } catch {
      /* ignore */
    }
  }

  const backgroundBytes = await fetchImageBytes("/backgrounds/qt-bg.jpg");
  let backgroundImg = null;
  if (backgroundBytes) {
    try {
      backgroundImg = await doc.embedJpg(backgroundBytes);
    } catch {
      /* ignore */
    }
  }

  const sigBytes = await fetchImageBytes(signatureSrc);
  let sigImg = null;
  if (sigBytes) {
    try {
      sigImg = await doc.embedPng(sigBytes);
    } catch {
      try {
        sigImg = await doc.embedJpg(sigBytes);
      } catch {
        /* ignore */
      }
    }
  }

  const HEADER_GAP = 28;
  const headerLeftW = (CONTENT_WIDTH - HEADER_GAP) * 0.6;
  const headerRightW = (CONTENT_WIDTH - HEADER_GAP) * 0.4;
  const headerRightX = MARGIN + headerLeftW + HEADER_GAP;

  const BF_GAP = 28;
  const billToW = (CONTENT_WIDTH - BF_GAP) / 2.55;
  const forW = ((CONTENT_WIDTH - BF_GAP) * 1.55) / 2.55;
  const forX = MARGIN + billToW + BF_GAP;

  const colWidths: Record<string, number> = {
    no: CONTENT_WIDTH * 0.08,
    unit: CONTENT_WIDTH * 0.09,
    qty: CONTENT_WIDTH * 0.15,
    price: CONTENT_WIDTH * 0.12,
    total: CONTENT_WIDTH * 0.16,
  };
  colWidths.desc =
    CONTENT_WIDTH -
    colWidths.no -
    colWidths.unit -
    colWidths.qty -
    colWidths.price -
    colWidths.total;
  const colXs: Record<string, number> = {
    no: MARGIN,
    desc: MARGIN + colWidths.no,
    unit: MARGIN + colWidths.no + colWidths.desc,
    qty: MARGIN + colWidths.no + colWidths.desc + colWidths.unit,
    price:
      MARGIN + colWidths.no + colWidths.desc + colWidths.unit + colWidths.qty,
    total:
      MARGIN +
      colWidths.no +
      colWidths.desc +
      colWidths.unit +
      colWidths.qty +
      colWidths.price,
  };

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawPageBackground = (p: PDFPage) => {
    if (backgroundImg) {
      p.drawImage(backgroundImg, {
        x: 0,
        y: 0,
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });
    }
  };
  drawPageBackground(page);

  const addPage = (): PDFPage => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawPageBackground(page);
    y = PAGE_HEIGHT - MARGIN;
    page.drawText(businessName, {
      x: MARGIN,
      y,
      size: 14,
      font: boldFont,
      color: COMPACT_GREEN,
    });
    const compactTitle = "QUOTATION";
    page.drawText(compactTitle, {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(compactTitle, 12),
      y,
      size: 12,
      font,
      color: COMPACT_TITLE,
    });
    const compactCode = quotation.quotationCode || "";
    page.drawText(compactCode, {
      x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(compactCode, 10),
      y: y - 14,
      size: 10,
      font,
      color: COMPACT_CODE,
    });
    y -= 26;
    page.drawLine({
      start: { x: MARGIN, y: y + 8 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 8 },
      thickness: 1,
      color: COMPACT_BORDER,
    });
    y -= 16;
    return page;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 60) addPage();
  };

  const headerTop = PAGE_HEIGHT - MARGIN;

  let logoH = 0;
  if (logoImg) {
    const targetW = 174;
    const targetH = 52;
    const imgRatio = logoImg.width / logoImg.height;
    const targetRatio = targetW / targetH;
    if (imgRatio > targetRatio) {
      logoH = targetW / imgRatio;
      page.drawImage(logoImg, {
        x: MARGIN,
        y: headerTop - logoH,
        width: targetW,
        height: logoH,
      });
    } else {
      const w = targetH * imgRatio;
      logoH = targetH;
      page.drawImage(logoImg, {
        x: MARGIN,
        y: headerTop - logoH,
        width: w,
        height: logoH,
      });
    }
  }

  const bizNameY = headerTop - logoH - 14 - 17;
  page.drawText(businessName, {
    x: MARGIN,
    y: bizNameY,
    size: 21,
    font: boldFont,
    color: BRAND_GREEN,
  });

  const detailsY = bizNameY - 21 - 5;
  const detailLineH = 15;
  page.drawText(address, {
    x: MARGIN,
    y: detailsY,
    size: 12,
    font: serifFont,
    color: DETAILS_DARK,
  });
  page.drawText(`Tel: ${phone}`, {
    x: MARGIN,
    y: detailsY - detailLineH,
    size: 12,
    font: serifFont,
    color: DETAILS_DARK,
  });
  page.drawText(`Email: ${email}`, {
    x: MARGIN,
    y: detailsY - detailLineH * 2,
    size: 12,
    font: serifFont,
    color: DETAILS_DARK,
  });
  page.drawText(`Website: ${siteUrl}`, {
    x: MARGIN,
    y: detailsY - detailLineH * 3,
    size: 12,
    font: serifFont,
    color: DETAILS_DARK,
  });

  const titleY = headerTop - 17;
  page.drawText("QUOTATION", {
    x:
      headerRightX +
      headerRightW -
      boldFont.widthOfTextAtSize("QUOTATION", 21),
    y: titleY,
    size: 21,
    font: boldFont,
    color: BRAND_GREEN,
  });

  let barcodeBottomY = titleY - 19;
  if (barcodeImg) {
    const bw = Math.min(205, headerRightW);
    const bh = (barcodeImg.height / barcodeImg.width) * bw;
    page.drawImage(barcodeImg, {
      x: headerRightX + headerRightW - bw,
      y: barcodeBottomY - bh,
      width: bw,
      height: bh,
    });
    barcodeBottomY = barcodeBottomY - bh;
  }

  const codeY = barcodeBottomY - 9 - 12;
  const codeText = quotation.quotationCode || "";
  page.drawText(codeText, {
    x:
      headerRightX +
      headerRightW -
      boldFont.widthOfTextAtSize(codeText, 15),
    y: codeY,
    size: 15,
    font: boldFont,
    color: BRAND_GREEN,
  });

  const dateY = codeY - 15 - 7 - 11;
  const dateLabel = "Date:";
  const dateValue = formatDate(quotation.createdAt);
  const dateLabelW = boldFont.widthOfTextAtSize(dateLabel, 14);
  const dateValueW = font.widthOfTextAtSize(dateValue, 14);
  const dateTotalW = dateLabelW + 4 + dateValueW;
  page.drawText(dateLabel, {
    x: headerRightX + headerRightW - dateTotalW,
    y: dateY,
    size: 14,
    font: boldFont,
    color: BRAND_GREEN,
  });
  page.drawText(dateValue, {
    x: headerRightX + headerRightW - dateTotalW + dateLabelW + 4,
    y: dateY,
    size: 14,
    font,
    color: DARK,
  });

  const leftColBottom = detailsY - detailLineH * 3;
  const rightColBottom = dateY - 14;
  const accentY = Math.min(leftColBottom, rightColBottom) - 17;
  page.drawLine({
    start: { x: MARGIN, y: accentY },
    end: { x: PAGE_WIDTH - MARGIN, y: accentY },
    thickness: 1,
    color: ACCENT_LINE,
  });

  const bfTop = accentY - 45;
  const bfHeight = 51;
  const bfY = bfTop - bfHeight;

  page.drawText("BILL TO:", {
    x: MARGIN,
    y: bfTop - 14,
    size: 16,
    font,
    color: DARK,
  });
  page.drawText(quotation.customerName, {
    x: MARGIN,
    y: bfTop - 30,
    size: 12,
    font: boldFont,
    color: DARK,
  });
  let clientY = bfTop - 42;
  if (quotation.customerAddress) {
    page.drawText(quotation.customerAddress, {
      x: MARGIN,
      y: clientY,
      size: 10,
      font,
      color: CLIENT_DETAIL,
    });
    clientY -= 12;
  }
  page.drawText(quotation.customerContact, {
    x: MARGIN,
    y: clientY,
    size: 10,
    font,
    color: CLIENT_DETAIL,
  });

  page.drawRectangle({
    x: forX,
    y: bfY,
    width: forW,
    height: bfHeight,
    color: FOR_CONTENT_BG,
  });
  page.drawRectangle({
    x: forX,
    y: bfY,
    width: 74,
    height: bfHeight,
    color: FOR_LABEL_BG,
  });
  page.drawText("FOR:", {
    x: forX + 14,
    y: bfTop - 21,
    size: 16,
    font,
    color: DARK,
  });
  let forText = quotation.quoteFor || "";
  const maxForW = forW - 74 - 32;
  if (font.widthOfTextAtSize(forText, 14) > maxForW) {
    while (
      font.widthOfTextAtSize(forText + "...", 14) > maxForW &&
      forText.length > 0
    )
      forText = forText.slice(0, -1);
    forText += "...";
  }
  page.drawText(forText, {
    x: forX + 74 + 16,
    y: bfTop - 21,
    size: 14,
    font,
    color: DARK,
  });

  y = bfY - 45;

  const drawTableHeader = () => {
    const thH = 28;
    const thY = y - thH;
    page.drawRectangle({
      x: MARGIN,
      y: thY,
      width: CONTENT_WIDTH,
      height: thH,
      color: TABLE_GREEN,
    });
    const headers = [
      { text: "No.", x: colXs.no, w: colWidths.no, align: "center" as const },
      {
        text: "Description",
        x: colXs.desc,
        w: colWidths.desc,
        align: "left" as const,
      },
      {
        text: "Size",
        x: colXs.unit,
        w: colWidths.unit,
        align: "center" as const,
      },
      { text: "Qty", x: colXs.qty, w: colWidths.qty, align: "center" as const },
      {
        text: "Price",
        x: colXs.price,
        w: colWidths.price,
        align: "right" as const,
      },
      {
        text: "Total",
        x: colXs.total,
        w: colWidths.total,
        align: "right" as const,
      },
    ];
    for (const h of headers) {
      const tw = boldFont.widthOfTextAtSize(h.text, 14);
      let tx: number;
      if (h.align === "center") tx = h.x + (h.w - tw) / 2;
      else if (h.align === "right") tx = h.x + h.w - tw - 8;
      else tx = h.x + 8;
      page.drawText(h.text, {
        x: tx,
        y: thY + 9,
        size: 14,
        font: boldFont,
        color: WHITE,
      });
    }
    y = thY;
  };

  const drawItems = (items: QuotationItem[], startIndex: number) => {
    drawTableHeader();
    y -= 2;
    const rowH = 22;
    for (let i = 0; i < items.length; i++) {
      ensureSpace(rowH + 4);
      const item = items[i];
      const rowY = y - rowH;
      if ((startIndex + i + 1) % 2 === 0) {
        page.drawRectangle({
          x: MARGIN,
          y: rowY,
          width: CONTENT_WIDTH,
          height: rowH,
          color: EVEN_ROW_BG,
        });
      }
      page.drawLine({
        start: { x: MARGIN, y: rowY },
        end: { x: PAGE_WIDTH - MARGIN, y: rowY },
        thickness: 0.5,
        color: ROW_BORDER,
      });
      const cellY = rowY + 7;
      const noStr = String(startIndex + i + 1);
      page.drawText(noStr, {
        x:
          colXs.no +
          (colWidths.no - serifFont.widthOfTextAtSize(noStr, 12)) / 2,
        y: cellY,
        size: 12,
        font: serifFont,
        color: DARK,
      });
      let descText = item.productName;
      const maxDescW = colWidths.desc - 16;
      if (serifFont.widthOfTextAtSize(descText, 12) > maxDescW) {
        while (
          serifFont.widthOfTextAtSize(descText + "...", 12) > maxDescW &&
          descText.length > 0
        )
          descText = descText.slice(0, -1);
        descText += "...";
      }
      page.drawText(descText, {
        x: colXs.desc + 8,
        y: cellY,
        size: 12,
        font: serifFont,
        color: DARK,
      });
      const unitStr = item.unit || "-";
      page.drawText(unitStr, {
        x:
          colXs.unit +
          (colWidths.unit - serifFont.widthOfTextAtSize(unitStr, 12)) / 2,
        y: cellY,
        size: 12,
        font: serifFont,
        color: DARK,
      });
      const qtyStr = String(item.quantity);
      page.drawText(qtyStr, {
        x:
          colXs.qty +
          (colWidths.qty - serifFont.widthOfTextAtSize(qtyStr, 12)) / 2,
        y: cellY,
        size: 12,
        font: serifFont,
        color: DARK,
      });
      const priceStr = formatAmount(item.unitPrice);
      page.drawText(priceStr, {
        x:
          colXs.price +
          colWidths.price -
          serifFont.widthOfTextAtSize(priceStr, 12) -
          8,
        y: cellY,
        size: 12,
        font: serifFont,
        color: DARK,
      });
      const totalStr = formatAmount(calcItemTotal(item));
      page.drawText(totalStr, {
        x:
          colXs.total +
          colWidths.total -
          serifFont.widthOfTextAtSize(totalStr, 12) -
          8,
        y: cellY,
        size: 12,
        font: serifFont,
        color: DARK,
      });
      y = rowY;
    }
  };

  const firstPageItems = quotation.items.slice(0, ITEMS_PER_PAGE);
  drawItems(firstPageItems, 0);
  const remainingItems = quotation.items.slice(ITEMS_PER_PAGE);
  for (let i = 0; i < remainingItems.length; i += ITEMS_PER_MIDDLE_PAGE) {
    addPage();
    drawItems(
      remainingItems.slice(i, i + ITEMS_PER_MIDDLE_PAGE),
      i + ITEMS_PER_PAGE,
    );
  }

  y -= 29;
  const totalsW = CONTENT_WIDTH * 0.41;
  const totalsX = PAGE_WIDTH - MARGIN - totalsW;

  const drawTotalsRow = (label: string, value: string) => {
    const rowH = 28;
    const rowY = y - rowH;
    page.drawText(label, {
      x: totalsX + 18,
      y: rowY + 9,
      size: 13,
      font: serifFont,
      color: DARK,
    });
    const vw = serifFont.widthOfTextAtSize(value, 13);
    page.drawText(value, {
      x: totalsX + totalsW - vw - 14,
      y: rowY + 9,
      size: 13,
      font: serifFont,
      color: DARK,
    });
    page.drawLine({
      start: { x: totalsX, y: rowY },
      end: { x: totalsX + totalsW, y: rowY },
      thickness: 2,
      color: TOTALS_BORDER,
    });
    y = rowY;
  };

  const { subtotal, tax, total } = calcQuotationTotals(
    quotation.items,
    quotation.taxRate,
  );
  drawTotalsRow("Sub-Total", formatCurrency(subtotal));
  drawTotalsRow(`Tax (${quotation.taxRate}%)`, formatCurrency(tax));

  y -= 4;
  const gtH = 34;
  const gtY = y - gtH;
  page.drawRectangle({
    x: totalsX,
    y: gtY,
    width: totalsW,
    height: gtH,
    color: GRAND_TOTAL_BG,
  });
  page.drawText("Grand Total", {
    x: totalsX + 18,
    y: gtY + 11,
    size: 15,
    font: boldFont,
    color: DARK,
  });
  const gtValStr = formatCurrency(total);
  page.drawText(gtValStr, {
    x: totalsX + totalsW - serifFont.widthOfTextAtSize(gtValStr, 15) - 14,
    y: gtY + 11,
    size: 15,
    font: serifFont,
    color: DARK,
  });
  y = gtY;

  ensureSpace(130);
  y -= 63;

  const termsX = MARGIN + CONTENT_WIDTH * 0.13;
  page.drawText("Terms & Conditions", {
    x: termsX,
    y,
    size: 15,
    font: serifItalic,
    color: DARK,
  });
  y -= 24;

  const fbCol1W = (CONTENT_WIDTH * 1.25) / 3.35;
  const fbCol2W = CONTENT_WIDTH / 3.35;
  const fbCol3W = (CONTENT_WIDTH * 1.1) / 3.35;
  const fbCol1X = MARGIN;
  const fbCol2X = MARGIN + fbCol1W;
  const fbCol3X = fbCol2X + fbCol2W;

  const fbTop = y;

  page.drawText("CONTACT US:", {
    x: fbCol1X,
    y: fbTop,
    size: 11,
    font: boldFont,
    color: DARK,
  });
  page.drawText(phone, {
    x: fbCol1X + 26 + boldFont.widthOfTextAtSize("CONTACT US:", 11),
    y: fbTop,
    size: 11,
    font,
    color: DARK,
  });

  page.drawText("Thank you for choosing Infield Innovations!", {
    x: fbCol1X,
    y: fbTop - 40,
    size: 11,
    font: serifItalic,
    color: DARK,
  });

  const stampCx = fbCol2X + fbCol2W / 2;
  const stampCy = fbTop - 44;
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
    f: PDFFont,
    color: ReturnType<typeof rgb>,
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
  drawStampText("INFIELD", 16, 11, boldFont, STAMP_RED);
  drawStampText("* * * *", 4, 7, font, STAMP_RED);
  drawStampText("+254 702 393 677", -6, 7, font, STAMP_RED);
  drawStampText(formatStampDate(quotation.createdAt), -15, 6, font, STAMP_RED);
  const lineHalfLen = 20;
  const lineDy = -20;
  page.drawLine({
    start: {
      x: stampCx - lineHalfLen * stampCos + lineDy * stampSin,
      y: stampCy + lineDy - lineHalfLen * stampSin - lineDy * stampCos,
    },
    end: {
      x: stampCx + lineHalfLen * stampCos + lineDy * stampSin,
      y: stampCy + lineDy + lineHalfLen * stampSin - lineDy * stampCos,
    },
    thickness: 0.5,
    color: STAMP_RED,
  });
  drawStampText("DIGITAL STAMP", -27, 6, boldFont, STAMP_RED);

  const sigCenterX = fbCol3X + fbCol3W / 2;
  if (sigImg) {
    const sigMaxW = 140;
    const sigMaxH = 50;
    let sigW = sigMaxW;
    let sigH = (sigImg.height / sigImg.width) * sigW;
    if (sigH > sigMaxH) {
      sigH = sigMaxH;
      sigW = sigMaxH * (sigImg.width / sigImg.height);
    }
    page.drawImage(sigImg, {
      x: sigCenterX - sigW / 2,
      y: fbTop - sigH,
      width: sigW,
      height: sigH,
    });
  }
  const sigLabel = quotation.createdBy || "";
  if (sigLabel) {
    page.drawText(sigLabel, {
      x: sigCenterX - boldFont.widthOfTextAtSize(sigLabel, 12) / 2,
      y: fbTop - 58,
      size: 12,
      font: boldFont,
      color: DARK,
    });
  }

  return doc.save();
}

export async function downloadQuotationPDF(
  quotation: Quotation,
): Promise<void> {
  const bytes = await generateQuotationPDF(quotation);
  const filename = `Quotation_${quotation.quotationCode || quotation.id.toUpperCase()}.pdf`;
  downloadPDF(bytes, filename);
}

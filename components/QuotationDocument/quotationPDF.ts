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

const MM = 2.834646;
const PT = 1.0;

const PAD_TOP = 12 * MM;
const PAD_SIDE = 15 * MM;
const CONTENT_WIDTH = PAGE_WIDTH - PAD_SIDE * 2;

const HEADER_HEIGHT = 43 * MM;
const HEADER_GAP = 23;
const HEADER_BORDER = rgb(0.369, 0.369, 0.369);

const BRAND_BLUE = rgb(0.086, 0.282, 0.396);
const TABLE_HEADER_BG = rgb(0.063, 0.294, 0.408);
const TABLE_HEADER_BORDER = rgb(1, 1, 1);
const ROW_BORDER = rgb(0.843, 0.898, 0.922);
const EVEN_ROW_BG = rgb(0.941, 0.961, 0.953);
const FOR_LABEL_BG = rgb(0.741, 0.741, 0.741);
const FOR_CONTENT_BG = rgb(0.831, 0.831, 0.831);
const GRAND_TOTAL_BG = rgb(0.835, 0.922, 0.925);
const TOTALS_BORDER = rgb(0.737, 0.737, 0.737);
const STAMP_RED = rgb(0.753, 0.224, 0.169);
const WHITE = rgb(1, 1, 1);
const DARK = rgb(0.063, 0.094, 0.125);
const DETAILS_DARK = rgb(0.082, 0.082, 0.082);
const CONTACT_BLUE = rgb(0.0, 0.585, 1.0);
const COMPACT_BORDER = rgb(0.816, 0.816, 0.816);
const COMPACT_CODE = rgb(0.333, 0.333, 0.333);

function mm(v: number): number {
  return v * MM;
}

export async function generateQuotationPDF(
  quotation: Quotation,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const serifFont: PDFFont = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold: PDFFont = await doc.embedFont(StandardFonts.TimesRomanBold);
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

  const bgBytes = await fetchImageBytes("/backgrounds/plain.jpg");
  let bgImg = null;
  if (bgBytes) {
    try {
      bgImg = await doc.embedJpg(bgBytes);
    } catch {
      /* ignore */
    }
  }

  const headerBgBytes = await fetchImageBytes("/backgrounds/qt-header.png");
  let headerBgImg = null;
  if (headerBgBytes) {
    try {
      headerBgImg = await doc.embedPng(headerBgBytes);
    } catch {
      try {
        headerBgImg = await doc.embedJpg(headerBgBytes);
      } catch {
        /* ignore */
      }
    }
  }

  const footerBgBytes = await fetchImageBytes("/backgrounds/qt-footer.png");
  let footerBgImg = null;
  if (footerBgBytes) {
    try {
      footerBgImg = await doc.embedPng(footerBgBytes);
    } catch {
      try {
        footerBgImg = await doc.embedJpg(footerBgBytes);
      } catch {
        /* ignore */
      }
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

  const headerLeftW = (CONTENT_WIDTH - HEADER_GAP) * (1.2 / 2.0);
  const headerRightW = (CONTENT_WIDTH - HEADER_GAP) * (0.8 / 2.0);
  const headerRightX = PAD_SIDE + headerLeftW + HEADER_GAP;

  const BF_GAP = 20;
  const bfLeftW = (CONTENT_WIDTH - BF_GAP) * (1.0 / 2.8);
  const bfRightW = (CONTENT_WIDTH - BF_GAP) * (1.8 / 2.8);
  const bfRightX = PAD_SIDE + bfLeftW + BF_GAP;
  const BF_HEIGHT = mm(35);
  const FOR_HEIGHT = mm(19);
  const FOR_LABEL_W = mm(74 / MM);

  const colWidths: Record<string, number> = {
    no: CONTENT_WIDTH * 0.06,
    unit: CONTENT_WIDTH * 0.12,
    qty: CONTENT_WIDTH * 0.10,
    price: CONTENT_WIDTH * 0.13,
    total: CONTENT_WIDTH * 0.17,
  };
  colWidths.desc =
    CONTENT_WIDTH -
    colWidths.no -
    colWidths.unit -
    colWidths.qty -
    colWidths.price -
    colWidths.total;
  const colXs: Record<string, number> = {
    no: PAD_SIDE,
    desc: PAD_SIDE + colWidths.no,
    unit: PAD_SIDE + colWidths.no + colWidths.desc,
    qty: PAD_SIDE + colWidths.no + colWidths.desc + colWidths.unit,
    price:
      PAD_SIDE + colWidths.no + colWidths.desc + colWidths.unit + colWidths.qty,
    total:
      PAD_SIDE +
      colWidths.no +
      colWidths.desc +
      colWidths.unit +
      colWidths.qty +
      colWidths.price,
  };

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - PAD_TOP;

  const drawPageBackground = (p: PDFPage) => {
    if (bgImg) {
      p.drawImage(bgImg, {
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
    y = PAGE_HEIGHT - PAD_TOP;
    page.drawText(businessName, {
      x: PAD_SIDE,
      y,
      size: 14,
      font: boldFont,
      color: BRAND_BLUE,
    });
    const compactTitle = "QUOTATION";
    page.drawText(compactTitle, {
      x: PAGE_WIDTH - PAD_SIDE - boldFont.widthOfTextAtSize(compactTitle, 12),
      y,
      size: 12,
      font: boldFont,
      color: BRAND_BLUE,
    });
    const compactCode = quotation.quotationCode || "";
    page.drawText(compactCode, {
      x: PAGE_WIDTH - PAD_SIDE - font.widthOfTextAtSize(compactCode, 10),
      y: y - 14,
      size: 10,
      font,
      color: COMPACT_CODE,
    });
    y -= 26;
    page.drawLine({
      start: { x: PAD_SIDE, y: y + 8 },
      end: { x: PAGE_WIDTH - PAD_SIDE, y: y + 8 },
      thickness: 1,
      color: COMPACT_BORDER,
    });
    y -= 16;
    return page;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < PAD_TOP + 60) addPage();
  };

  // ─── Header (43mm, background image, 1.2fr/0.8fr grid) ───
  const headerTop = y;
  const headerBottom = headerTop - HEADER_HEIGHT;

  if (headerBgImg) {
    page.drawImage(headerBgImg, {
      x: PAD_SIDE,
      y: headerBottom,
      width: CONTENT_WIDTH,
      height: HEADER_HEIGHT,
    });
  }
  page.drawLine({
    start: { x: PAD_SIDE, y: headerBottom },
    end: { x: PAGE_WIDTH - PAD_SIDE, y: headerBottom },
    thickness: 1,
    color: HEADER_BORDER,
  });

  // Left column: brand
  const logoMarginLeft = 90;
  const logoH = mm(12);
  if (logoImg) {
    const imgRatio = logoImg.width / logoImg.height;
    const logoW = logoH * imgRatio;
    page.drawImage(logoImg, {
      x: PAD_SIDE + logoMarginLeft,
      y: headerTop - logoH,
      width: logoW,
      height: logoH,
    });
  }

  const bizNameY = headerTop - logoH - 10 - 22 * 1.6;
  page.drawText(businessName, {
    x: PAD_SIDE,
    y: bizNameY,
    size: 22,
    font: boldFont,
    color: BRAND_BLUE,
  });

  const detailsY = bizNameY - 12 * 1.3 - 2;
  const detailLineH = 12 * 1.3;
  const drawDetailLine = (
    label: string,
    value: string,
    dy: number,
  ) => {
    const labelW = boldFont.widthOfTextAtSize(label, 12);
    page.drawText(label, {
      x: PAD_SIDE,
      y: dy,
      size: 12,
      font: boldFont,
      color: DETAILS_DARK,
    });
    page.drawText(value, {
      x: PAD_SIDE + labelW + 5,
      y: dy,
      size: 12,
      font: serifFont,
      color: DETAILS_DARK,
    });
  };
  page.drawText(address, {
    x: PAD_SIDE,
    y: detailsY,
    size: 12,
    font: serifFont,
    color: DETAILS_DARK,
  });
  drawDetailLine("Tel:", phone, detailsY - detailLineH);
  drawDetailLine("Email:", email, detailsY - detailLineH * 2);
  drawDetailLine("Website:", siteUrl, detailsY - detailLineH * 3);

  // Right column: title block (align-items: flex-end)
  const titleH = mm(11);
  const titleW = mm(62);
  const titleX = headerRightX + headerRightW - titleW;
  const titleY = headerTop - titleH;
  // h1: white text, 14pt, bold, centered in 62mm x 11mm block
  const titleText = "QUOTATION";
  const titleTextW = boldFont.widthOfTextAtSize(titleText, 14 * PT);
  page.drawText(titleText, {
    x: titleX + (titleW - titleTextW) / 2,
    y: titleY + (titleH - 14 * PT) / 2,
    size: 14 * PT,
    font: boldFont,
    color: WHITE,
  });

  let barcodeBottomY = titleY - 15;
  if (barcodeImg) {
    const bw = Math.min(205, headerRightW - 30);
    const bh = 31;
    page.drawImage(barcodeImg, {
      x: headerRightX + headerRightW - bw - 30,
      y: barcodeBottomY - bh,
      width: bw,
      height: bh,
    });
    barcodeBottomY = barcodeBottomY - bh;
  }

  const codeY = barcodeBottomY - 5 - 16;
  const codeText = quotation.quotationCode || "";
  page.drawText(codeText, {
    x: headerRightX + headerRightW - boldFont.widthOfTextAtSize(codeText, 16) - 45,
    y: codeY,
    size: 16,
    font: boldFont,
    color: BRAND_BLUE,
  });

  const dateY = codeY - 5 - 14;
  const dateLabel = "Date:";
  const dateValue = formatDate(quotation.createdAt);
  const dateLabelW = boldFont.widthOfTextAtSize(dateLabel, 14);
  const dateValueW = font.widthOfTextAtSize(dateValue, 14);
  const dateTotalW = dateLabelW + 5 + dateValueW;
  page.drawText(dateLabel, {
    x: headerRightX + headerRightW - dateTotalW - 45,
    y: dateY,
    size: 14,
    font: boldFont,
    color: BRAND_BLUE,
  });
  page.drawText(dateValue, {
    x: headerRightX + headerRightW - dateTotalW - 45 + dateLabelW + 5,
    y: dateY,
    size: 14,
    font,
    color: DARK,
  });

  y = headerBottom;

  // ─── Bill To & For (35mm height, 1fr/1.8fr grid, 20px gap) ───
  const bfTop = y;
  const bfBottom = bfTop - BF_HEIGHT;
  const bfCenterY = bfTop - BF_HEIGHT / 2;

  // Bill To (left column)
  page.drawText("BILL TO:", {
    x: PAD_SIDE,
    y: bfCenterY + 6,
    size: 16,
    font: font,
    color: rgb(0.071, 0.071, 0.071),
  });
  page.drawText(quotation.customerName, {
    x: PAD_SIDE,
    y: bfCenterY - 8,
    size: 10 * PT,
    font: boldFont,
    color: DARK,
  });
  let clientY = bfCenterY - 20;
  if (quotation.customerAddress) {
    page.drawText(quotation.customerAddress, {
      x: PAD_SIDE,
      y: clientY,
      size: 10 * PT,
      font: serifFont,
      color: DARK,
    });
    clientY -= 12;
  }
  page.drawText(quotation.customerContact, {
    x: PAD_SIDE,
    y: clientY,
    size: 10 * PT,
    font: serifFont,
    color: DARK,
  });

  // For section (19mm height, 74px label + content, bg #d4d4d4, label bg #bdbdbd)
  const forTop = bfCenterY + FOR_HEIGHT / 2;
  const forBottom = forTop - FOR_HEIGHT;
  page.drawRectangle({
    x: bfRightX,
    y: forBottom,
    width: bfRightW,
    height: FOR_HEIGHT,
    color: FOR_CONTENT_BG,
  });
  page.drawRectangle({
    x: bfRightX,
    y: forBottom,
    width: FOR_LABEL_W,
    height: FOR_HEIGHT,
    color: FOR_LABEL_BG,
  });
  page.drawText("FOR:", {
    x: bfRightX + 14,
    y: forBottom + (FOR_HEIGHT - 16) / 2,
    size: 16,
    font: font,
    color: DARK,
  });
  let forText = quotation.quoteFor || "";
  const maxForW = bfRightW - FOR_LABEL_W - 32;
  if (serifFont.widthOfTextAtSize(forText, 10 * PT) > maxForW) {
    while (
      serifFont.widthOfTextAtSize(forText + "...", 10 * PT) > maxForW &&
      forText.length > 0
    )
      forText = forText.slice(0, -1);
    forText += "...";
  }
  page.drawText(forText, {
    x: bfRightX + FOR_LABEL_W + 16,
    y: forBottom + (FOR_HEIGHT - 10 * PT) / 2,
    size: 10 * PT,
    font: serifFont,
    color: DARK,
  });

  y = bfBottom;

  // ─── Items table ───
  const drawTableHeader = () => {
    const thH = 30;
    const thY = y - thH;
    page.drawRectangle({
      x: PAD_SIDE,
      y: thY,
      width: CONTENT_WIDTH,
      height: thH,
      color: TABLE_HEADER_BG,
    });
    const headers = [
      { text: "No.", x: colXs.no, w: colWidths.no, align: "center" as const },
      {
        text: "Description",
        x: colXs.desc,
        w: colWidths.desc,
        align: "center" as const,
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
        align: "center" as const,
      },
      {
        text: "Total",
        x: colXs.total,
        w: colWidths.total,
        align: "center" as const,
      },
    ];
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (i < headers.length - 1) {
        const sepX = h.x + h.w;
        page.drawLine({
          start: { x: sepX, y: thY },
          end: { x: sepX, y: thY + thH },
          thickness: 2,
          color: TABLE_HEADER_BORDER,
        });
      }
      const tw = boldFont.widthOfTextAtSize(h.text, 14);
      const tx = h.x + (h.w - tw) / 2;
      page.drawText(h.text, {
        x: tx,
        y: thY + (thH - 14) / 2,
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
          x: PAD_SIDE,
          y: rowY,
          width: CONTENT_WIDTH,
          height: rowH,
          color: EVEN_ROW_BG,
        });
      }
      page.drawLine({
        start: { x: PAD_SIDE, y: rowY },
        end: { x: PAGE_WIDTH - PAD_SIDE, y: rowY },
        thickness: 0.5,
        color: ROW_BORDER,
      });
      const cellY = rowY + (rowH - 11 * PT) / 2;
      const noStr = String(startIndex + i + 1);
      page.drawText(noStr, {
        x:
          colXs.no +
          (colWidths.no - serifFont.widthOfTextAtSize(noStr, 11 * PT)) / 2,
        y: cellY,
        size: 11 * PT,
        font: serifFont,
        color: DARK,
      });
      let descText = item.productName;
      const maxDescW = colWidths.desc - 10 - 4;
      if (serifFont.widthOfTextAtSize(descText, 11 * PT) > maxDescW) {
        while (
          serifFont.widthOfTextAtSize(descText + "...", 11 * PT) > maxDescW &&
          descText.length > 0
        )
          descText = descText.slice(0, -1);
        descText += "...";
      }
      page.drawText(descText, {
        x: colXs.desc + 10,
        y: cellY,
        size: 11 * PT,
        font: serifFont,
        color: DARK,
      });
      const unitStr = item.size || "-";
      page.drawText(unitStr, {
        x:
          colXs.unit +
          (colWidths.unit - serifFont.widthOfTextAtSize(unitStr, 11 * PT)) / 2,
        y: cellY,
        size: 11 * PT,
        font: serifFont,
        color: DARK,
      });
      const qtyStr = `${item.quantity} ${item.unit || ""}`;
      page.drawText(qtyStr, {
        x:
          colXs.qty +
          (colWidths.qty - serifFont.widthOfTextAtSize(qtyStr, 11 * PT)) / 2,
        y: cellY,
        size: 11 * PT,
        font: serifFont,
        color: DARK,
      });
      const priceStr = formatAmount(item.unitPrice);
      page.drawText(priceStr, {
        x:
          colXs.price +
          colWidths.price -
          serifFont.widthOfTextAtSize(priceStr, 11 * PT) -
          10,
        y: cellY,
        size: 11 * PT,
        font: serifFont,
        color: DARK,
      });
      const totalStr = formatAmount(calcItemTotal(item));
      page.drawText(totalStr, {
        x:
          colXs.total +
          colWidths.total -
          serifFont.widthOfTextAtSize(totalStr, 11 * PT) -
          10,
        y: cellY,
        size: 11 * PT,
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

  // ─── Totals (margin-top 15px, margin-left 60%) ───
  y -= 15;
  const totalsW = CONTENT_WIDTH * 0.4;
  const totalsX = PAD_SIDE + CONTENT_WIDTH * 0.6;
  const totalsPadH = 7;
  const totalsPadV = 7;

  const drawTotalsRow = (label: string, value: string, isGrandTotal: boolean) => {
    const fontSize = isGrandTotal ? 15 : 13;
    const pt = isGrandTotal ? 10 : totalsPadV;
    const pb = isGrandTotal ? 10 : totalsPadV;
    const rowH = isGrandTotal ? 0 : 28;
    const labelFont = isGrandTotal ? boldFont : serifFont;
    const valueFont = isGrandTotal ? serifFont : serifFont;

    if (isGrandTotal) {
      page.drawRectangle({
        x: totalsX,
        y: y - pt - fontSize - pb,
        width: totalsW,
        height: pt + fontSize + pb,
        color: GRAND_TOTAL_BG,
      });
    }

    const textY = y - pt - fontSize;
    page.drawText(label, {
      x: totalsX + 12,
      y: textY,
      size: fontSize,
      font: labelFont,
      color: DARK,
    });
    const vw = valueFont.widthOfTextAtSize(value, fontSize);
    page.drawText(value, {
      x: totalsX + totalsW - vw - 12,
      y: textY,
      size: fontSize,
      font: valueFont,
      color: DARK,
    });

    if (!isGrandTotal) {
      page.drawLine({
        start: { x: totalsX, y: y - pt - fontSize - pb },
        end: { x: totalsX + totalsW, y: y - pt - fontSize - pb },
        thickness: 1,
        color: TOTALS_BORDER,
      });
    }

    y = y - pt - fontSize - pb;
  };

  const { subtotal, tax, total } = calcQuotationTotals(
    quotation.items,
    quotation.taxRate,
  );
  drawTotalsRow("Sub-Total", formatCurrency(subtotal), false);
  drawTotalsRow(`Tax (${quotation.taxRate}%)`, formatCurrency(tax), false);
  drawTotalsRow("Grand Total", formatCurrency(total), true);

  // ─── Footer (margin-top 20px, height 52mm, background image) ───
  const footerMarginTop = 20;
  const footerHeight = mm(52);
  ensureSpace(footerHeight + footerMarginTop);
  y -= footerMarginTop;
  const footerTop = y;
  const footerBottom = footerTop - footerHeight;

  if (footerBgImg) {
    page.drawImage(footerBgImg, {
      x: PAD_SIDE,
      y: footerBottom,
      width: CONTENT_WIDTH,
      height: footerHeight,
    });
  }

  // row1: flex row, space-between, align flex-end
  // Notes (80mm wide, 23mm tall) | Stamp | Signature (50mm wide, 23mm tall)
  const row1Height = mm(23);
  const notesW = mm(80);
  const sigMaxW = mm(50);
  const sigH = row1Height;
  const row1Bottom = footerTop - row1Height;

  // Notes
  const notesX = PAD_SIDE;
  page.drawText("Notes:", {
    x: notesX + notesW / 2 - boldFont.widthOfTextAtSize("Notes:", 11 * PT) / 2,
    y: footerTop - 4 - 11 * PT,
    size: 11 * PT,
    font: boldFont,
    color: DARK,
  });
  if (quotation.notes) {
    let notesText = quotation.notes;
    const maxNotesW = notesW - 8;
    if (serifItalic.widthOfTextAtSize(notesText, 9 * PT) > maxNotesW) {
      while (
        serifItalic.widthOfTextAtSize(notesText + "...", 9 * PT) > maxNotesW &&
        notesText.length > 0
      )
        notesText = notesText.slice(0, -1);
      notesText += "...";
    }
    page.drawText(notesText, {
      x: notesX,
      y: footerTop - 4 - 11 * PT - 4 - 9 * PT,
      size: 9 * PT,
      font: serifItalic,
      color: DARK,
    });
  }

  // Signature (right side of row1, margin-right 50px)
  const sigX = PAD_SIDE + CONTENT_WIDTH - 50 - sigMaxW;
  if (sigImg) {
    const imgRatio = sigImg.width / sigImg.height;
    let drawW = sigMaxW;
    let drawH = sigH;
    if (drawW / drawH > imgRatio) {
      drawW = sigH * imgRatio;
    } else {
      drawH = sigMaxW / imgRatio;
    }
    page.drawImage(sigImg, {
      x: sigX + (sigMaxW - drawW) / 2,
      y: row1Bottom + (sigH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  // Stamp (centered between notes and signature)
  const stampCx = notesX + notesW + 40 + mm(15);
  const stampCy = row1Bottom + row1Height / 2;
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

  // row2: flex row, space-between, align center, height 28mm
  const row2Height = mm(28);
  const row2Bottom = footerBottom;
  const row2CenterY = row2Bottom + row2Height / 2;

  // Left: contact + thank you (90mm wide, flex column, align flex-start, justify flex-end, gap 25px)
  const ctW = mm(90);
  const ctX = PAD_SIDE;
  // Contact at bottom area
  const contactY = row2Bottom + 10;
  page.drawText("CONTACT US:", {
    x: ctX,
    y: contactY,
    size: 10 * PT,
    font: boldFont,
    color: CONTACT_BLUE,
  });
  const contactLabelW = boldFont.widthOfTextAtSize("CONTACT US:", 10 * PT);
  page.drawText(phone, {
    x: ctX + contactLabelW + 5,
    y: contactY,
    size: 10 * PT,
    font: font,
    color: DARK,
  });
  // Thank you (above contact, gap 25px)
  const thankY = contactY + 25 + 7.5 * PT;
  const thankLines = [
    "Thank you for choosing Infield Innovations.",
    "We deliver exceptional results with unmatched expertise and dedication.",
  ];
  for (let i = 0; i < thankLines.length; i++) {
    page.drawText(thankLines[i], {
      x: ctX,
      y: thankY + (thankLines.length - 1 - i) * (7.5 * PT * 1.2),
      size: 7.5 * PT,
      font: serifItalic,
      color: DARK,
    });
  }

  // Right: created by (54mm wide, white text, centered, border-bottom white)
  const cbW = mm(54);
  const cbX = PAD_SIDE + CONTENT_WIDTH - 60 - cbW;
  const cbY = row2CenterY - 12 * PT / 2;
  const cbLabel = quotation.createdBy || "";
  if (cbLabel) {
    page.drawText(cbLabel, {
      x: cbX + (cbW - boldFont.widthOfTextAtSize(cbLabel, 12 * PT)) / 2,
      y: cbY,
      size: 12 * PT,
      font: serifBold,
      color: WHITE,
    });
  }
  page.drawLine({
    start: { x: cbX, y: cbY - 4 },
    end: { x: cbX + cbW, y: cbY - 4 },
    thickness: 2,
    color: WHITE,
  });

  return doc.save();
}

export async function downloadQuotationPDF(
  quotation: Quotation,
): Promise<void> {
  const bytes = await generateQuotationPDF(quotation);
  const filename = `Quotation_${quotation.quotationCode || quotation.id.toUpperCase()}.pdf`;
  downloadPDF(bytes, filename);
}

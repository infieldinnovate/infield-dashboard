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
const PX = 0.75;

const PAD_TOP = 10 * MM;
const PAD_SIDE = 15 * MM;
const PAD_BOTTOM = 35 * MM;
const CONTENT_WIDTH = PAGE_WIDTH - PAD_SIDE * 2;
const CONTENT_BOTTOM = PAD_BOTTOM;

const HEADER_HEIGHT = 45 * MM;
const HEADER_GAP = 6 * MM;

const BF_HEIGHT = 35 * MM;
const BF_GAP = 5 * MM;
const FOR_HEIGHT = 19 * MM;
const FOR_LABEL_W = 20 * MM;

const TABLE_HEADER_HEIGHT = 8 * MM;
const TABLE_ROW_HEIGHT = 29 * PX;
const TABLE_BODY_FONT = 15 * PX;

const TOTALS_NOTES_HEIGHT = 40 * MM;
const STAMP_SIGN_HEIGHT = 35 * MM;
const FOOTER_HEIGHT = 35 * MM;

const NOTES_W = 80 * MM;
const TOTALS_W = 75 * MM;

const STAMP_SIGN_PAD = 17 * MM;
const SIGN_LABEL_W = 40 * MM;
const SIGN_LABEL_H = 27 * MM;
const SIGN_IMG_W = 50 * MM;
const SIGN_IMG_H = 20 * MM;

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
const HEADER_BORDER = rgb(0.369, 0.369, 0.369);
const WHITE = rgb(1, 1, 1);
const DARK = rgb(0.063, 0.094, 0.125);
const DETAILS_DARK = rgb(0.082, 0.082, 0.082);
const BLACK = rgb(0, 0, 0);
const CONTACT_BLUE = rgb(0.0, 0.585, 1.0);
const BILLTO_LABEL = rgb(0.071, 0.071, 0.071);

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
  const serifBoldItalic: PDFFont = await doc.embedFont(
    StandardFonts.TimesRomanBoldItalic,
  );

  const settings = getSettings();
  const { businessName, address, phone, email, website, logo, stamp } =
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

  const stampBytes = await fetchImageBytes(stamp);
  let stampImg = null;
  if (stampBytes) {
    try {
      stampImg = await doc.embedPng(stampBytes);
    } catch {
      try {
        stampImg = await doc.embedJpg(stampBytes);
      } catch {
        /* ignore */
      }
    }
  }

  const headerLeftW = (CONTENT_WIDTH - HEADER_GAP) * (1.2 / 2.0);
  const headerRightW = (CONTENT_WIDTH - HEADER_GAP) * (0.8 / 2.0);
  const headerRightX = PAD_SIDE + headerLeftW + HEADER_GAP;

  const bfLeftW = (CONTENT_WIDTH - BF_GAP) * (1.0 / 2.8);
  const bfRightW = (CONTENT_WIDTH - BF_GAP) * (1.8 / 2.8);
  const bfRightX = PAD_SIDE + bfLeftW + BF_GAP;

  const colWidths: Record<string, number> = {
    no: CONTENT_WIDTH * 0.06,
    unit: CONTENT_WIDTH * 0.12,
    qty: CONTENT_WIDTH * 0.1,
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

  const drawFooter = (p: PDFPage) => {
    if (footerBgImg) {
      p.drawImage(footerBgImg, {
        x: PAD_SIDE,
        y: 0,
        width: CONTENT_WIDTH,
        height: FOOTER_HEIGHT,
      });
    }

    const contactY = FOOTER_HEIGHT - mm(3) - 10 * PT;
    p.drawText("CONTACT US:", {
      x: PAD_SIDE,
      y: contactY,
      size: 10 * PT,
      font: boldFont,
      color: CONTACT_BLUE,
    });
    const contactLabelW = boldFont.widthOfTextAtSize("CONTACT US:", 10 * PT);
    p.drawText(phone, {
      x: PAD_SIDE + contactLabelW + mm(5),
      y: contactY,
      size: 9 * PT,
      font: font,
      color: DETAILS_DARK,
    });

    const thankY = contactY - mm(6) - 7 * PT;
    const thankLines = [
      "Thank you for choosing Infield Innovations.",
      "We deliver exceptional results with unmatched expertise and dedication.",
    ];
    for (let i = 0; i < thankLines.length; i++) {
      p.drawText(thankLines[i], {
        x: PAD_SIDE,
        y: thankY - i * (7 * PT * 1.2),
        size: 7 * PT,
        font: serifItalic,
        color: DETAILS_DARK,
      });
    }

    const cbW = mm(54);
    const cbX = PAGE_WIDTH - PAD_SIDE - mm(16) - cbW;
    const cbY = FOOTER_HEIGHT / 2 + mm(6) - (11 * PT) / 2;
    const cbLabel = `By ${quotation.createdBy || ""}`;
    p.drawText(cbLabel, {
      x: cbX + (cbW - serifBoldItalic.widthOfTextAtSize(cbLabel, 11 * PT)) / 2,
      y: cbY,
      size: 11 * PT,
      font: serifBoldItalic,
      color: WHITE,
    });
  };

  const drawBrandedHeader = () => {
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
      thickness: mm(1),
      color: HEADER_BORDER,
    });

    const logoMarginLeft = mm(24);
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

    const bizNameSize = 16 * PT;
    const bizNameY = headerTop - logoH - 10 - bizNameSize * 1.6;
    page.drawText(businessName, {
      x: PAD_SIDE,
      y: bizNameY,
      size: bizNameSize,
      font: boldFont,
      color: BRAND_BLUE,
    });

    const detailSize = 9 * PT;
    const detailLineH = detailSize * 1.4;
    const detailsY = bizNameY - detailSize * 1.3 - 2;
    const drawDetailLine = (label: string, value: string, dy: number) => {
      const labelW = boldFont.widthOfTextAtSize(label, detailSize);
      page.drawText(label, {
        x: PAD_SIDE,
        y: dy,
        size: detailSize,
        font: boldFont,
        color: DETAILS_DARK,
      });
      page.drawText(value, {
        x: PAD_SIDE + labelW + mm(1),
        y: dy,
        size: detailSize,
        font: serifFont,
        color: DETAILS_DARK,
      });
    };
    page.drawText(address, {
      x: PAD_SIDE,
      y: detailsY,
      size: detailSize,
      font: serifFont,
      color: DETAILS_DARK,
    });
    drawDetailLine("Tel:", phone, detailsY - detailLineH);
    drawDetailLine("Email:", email, detailsY - detailLineH * 2);
    drawDetailLine("Website:", siteUrl, detailsY - detailLineH * 3);

    const titleH = mm(11);
    const titleW = mm(62);
    const titleX = headerRightX + headerRightW - titleW;
    const titleY = headerTop - titleH;
    const titleText = "QUOTATION";
    const titleTextW = boldFont.widthOfTextAtSize(titleText, 14 * PT);
    page.drawText(titleText, {
      x: titleX + (titleW - titleTextW) / 2,
      y: titleY + (titleH - 14 * PT) / 2,
      size: 14 * PT,
      font: boldFont,
      color: WHITE,
    });

    let barcodeBottomY = titleY - mm(3);
    if (barcodeImg) {
      const bw = mm(54);
      const bh = mm(8);
      page.drawImage(barcodeImg, {
        x: headerRightX + headerRightW - bw - mm(8),
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
        headerRightX +
        headerRightW -
        boldFont.widthOfTextAtSize(codeText, codeSize) -
        mm(12),
      y: codeY,
      size: codeSize,
      font: boldFont,
      color: BRAND_BLUE,
    });

    const dateSize = 11 * PT;
    const dateY = codeY - 5 - dateSize;
    const dateLabel = "Date:";
    const dateValue = formatDate(quotation.createdAt);
    const dateLabelW = boldFont.widthOfTextAtSize(dateLabel, dateSize);
    const dateTotalW = dateLabelW + mm(1) + font.widthOfTextAtSize(dateValue, dateSize);
    page.drawText(dateLabel, {
      x: headerRightX + headerRightW - dateTotalW - mm(12),
      y: dateY,
      size: dateSize,
      font: boldFont,
      color: BRAND_BLUE,
    });
    page.drawText(dateValue, {
      x: headerRightX + headerRightW - dateTotalW - mm(12) + dateLabelW + mm(1),
      y: dateY,
      size: dateSize,
      font,
      color: DARK,
    });

    y = headerBottom;
  };

  const addPage = (): PDFPage => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawPageBackground(page);
    drawFooter(page);
    y = PAGE_HEIGHT - PAD_TOP;
    drawBrandedHeader();
    return page;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < CONTENT_BOTTOM + 10) addPage();
  };

  drawPageBackground(page);
  drawFooter(page);

  // ─── Header (45mm) ───
  drawBrandedHeader();

  // ─── Bill To & For (35mm, 1fr/1.8fr, 5mm gap) ───
  const bfTop = y;
  const bfBottom = bfTop - BF_HEIGHT;
  const bfCenterY = bfTop - BF_HEIGHT / 2;

  page.drawText("BILL TO:", {
    x: PAD_SIDE,
    y: bfCenterY + 6,
    size: 12 * PT,
    font: boldFont,
    color: BILLTO_LABEL,
  });
  page.drawText(quotation.customerName, {
    x: PAD_SIDE,
    y: bfCenterY - 8,
    size: 11 * PT,
    font: boldFont,
    color: DARK,
  });
  let clientY = bfCenterY - 20;
  if (quotation.customerAddress) {
    page.drawText(quotation.customerAddress, {
      x: PAD_SIDE,
      y: clientY,
      size: 11 * PT,
      font: serifFont,
      color: DARK,
    });
    clientY -= 13;
  }
  page.drawText(quotation.customerContact, {
    x: PAD_SIDE,
    y: clientY,
    size: 11 * PT,
    font: serifFont,
    color: DARK,
  });

  // FOR section (19mm, 20mm label)
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
    x: bfRightX + mm(4),
    y: forBottom + (FOR_HEIGHT - 11 * PT) / 2,
    size: 11 * PT,
    font: boldFont,
    color: DARK,
  });
  let forText = quotation.quoteFor || "";
  const maxForW = bfRightW - FOR_LABEL_W - mm(8);
  if (serifFont.widthOfTextAtSize(forText, 10 * PT) > maxForW) {
    while (
      serifFont.widthOfTextAtSize(forText + "...", 10 * PT) > maxForW &&
      forText.length > 0
    )
      forText = forText.slice(0, -1);
    forText += "...";
  }
  page.drawText(forText, {
    x: bfRightX + FOR_LABEL_W + mm(4),
    y: forBottom + (FOR_HEIGHT - 10 * PT) / 2,
    size: 10 * PT,
    font: serifFont,
    color: DARK,
  });

  y = bfBottom;

  // ─── Items table ───
  const drawTableHeader = () => {
    const thH = TABLE_HEADER_HEIGHT;
    const thY = y - thH;
    page.drawRectangle({
      x: PAD_SIDE,
      y: thY,
      width: CONTENT_WIDTH,
      height: thH,
      color: TABLE_HEADER_BG,
    });
    const headers = [
      { text: "No.", x: colXs.no, w: colWidths.no },
      { text: "Description", x: colXs.desc, w: colWidths.desc },
      { text: "Size", x: colXs.unit, w: colWidths.unit },
      { text: "Qty", x: colXs.qty, w: colWidths.qty },
      { text: "Price", x: colXs.price, w: colWidths.price },
      { text: "Total", x: colXs.total, w: colWidths.total },
    ];
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (i < headers.length - 1) {
        const sepX = h.x + h.w;
        page.drawLine({
          start: { x: sepX, y: thY },
          end: { x: sepX, y: thY + thH },
          thickness: mm(1),
          color: TABLE_HEADER_BORDER,
        });
      }
      const tw = boldFont.widthOfTextAtSize(h.text, 12 * PT);
      const tx = h.x + (h.w - tw) / 2;
      page.drawText(h.text, {
        x: tx,
        y: thY + (thH - 12 * PT) / 2,
        size: 12 * PT,
        font: boldFont,
        color: WHITE,
      });
    }
    y = thY;
  };

  const drawItems = (items: QuotationItem[], startIndex: number) => {
    drawTableHeader();
    y -= 2;
    for (let i = 0; i < items.length; i++) {
      ensureSpace(TABLE_ROW_HEIGHT + 4);
      const item = items[i];
      const rowY = y - TABLE_ROW_HEIGHT;
      if ((startIndex + i + 1) % 2 === 0) {
        page.drawRectangle({
          x: PAD_SIDE,
          y: rowY,
          width: CONTENT_WIDTH,
          height: TABLE_ROW_HEIGHT,
          color: EVEN_ROW_BG,
        });
      }
      page.drawLine({
        start: { x: PAD_SIDE, y: rowY },
        end: { x: PAGE_WIDTH - PAD_SIDE, y: rowY },
        thickness: 3 * PX,
        color: ROW_BORDER,
      });
      const cellY = rowY + (TABLE_ROW_HEIGHT - TABLE_BODY_FONT) / 2;
      const noStr = String(startIndex + i + 1);
      page.drawText(noStr, {
        x:
          colXs.no +
          (colWidths.no - serifFont.widthOfTextAtSize(noStr, TABLE_BODY_FONT)) / 2,
        y: cellY,
        size: TABLE_BODY_FONT,
        font: serifFont,
        color: DARK,
      });
      let descText = item.productName;
      const maxDescW = colWidths.desc - mm(3) - 4;
      if (serifFont.widthOfTextAtSize(descText, TABLE_BODY_FONT) > maxDescW) {
        while (
          serifFont.widthOfTextAtSize(descText + "...", TABLE_BODY_FONT) >
            maxDescW &&
          descText.length > 0
        )
          descText = descText.slice(0, -1);
        descText += "...";
      }
      page.drawText(descText, {
        x: colXs.desc + mm(3),
        y: cellY,
        size: TABLE_BODY_FONT,
        font: serifFont,
        color: DARK,
      });
      const unitStr = item.size || "-";
      page.drawText(unitStr, {
        x:
          colXs.unit +
          (colWidths.unit - serifFont.widthOfTextAtSize(unitStr, TABLE_BODY_FONT)) / 2,
        y: cellY,
        size: TABLE_BODY_FONT,
        font: serifFont,
        color: DARK,
      });
      const qtyStr = `${item.quantity} ${item.unit || ""}`;
      page.drawText(qtyStr, {
        x:
          colXs.qty +
          (colWidths.qty - serifFont.widthOfTextAtSize(qtyStr, TABLE_BODY_FONT)) / 2,
        y: cellY,
        size: TABLE_BODY_FONT,
        font: serifFont,
        color: DARK,
      });
      const priceStr = formatAmount(item.unitPrice);
      page.drawText(priceStr, {
        x:
          colXs.price +
          colWidths.price -
          serifFont.widthOfTextAtSize(priceStr, TABLE_BODY_FONT) -
          mm(3),
        y: cellY,
        size: TABLE_BODY_FONT,
        font: serifFont,
        color: DARK,
      });
      const totalStr = formatAmount(calcItemTotal(item));
      page.drawText(totalStr, {
        x:
          colXs.total +
          colWidths.total -
          serifFont.widthOfTextAtSize(totalStr, TABLE_BODY_FONT) -
          mm(3),
        y: cellY,
        size: TABLE_BODY_FONT,
        font: serifFont,
        color: DARK,
      });
      y = rowY;
    }
  };

  // ─── Totals & Notes (40mm, side-by-side) ───
  const drawTotalsNotes = () => {
    const sectionTop = y;
    const sectionBottom = sectionTop - TOTALS_NOTES_HEIGHT;
    const sectionCenterY = sectionTop - TOTALS_NOTES_HEIGHT / 2;

    // Notes (left, 80mm)
    const notesX = PAD_SIDE;
    page.drawText("Notes:", {
      x: notesX,
      y: sectionTop - mm(4) - 11 * PT,
      size: 11 * PT,
      font: boldFont,
      color: DARK,
    });
    if (quotation.notes) {
      let notesText = quotation.notes;
      const maxNotesW = NOTES_W - 8;
      if (serifItalic.widthOfTextAtSize(notesText, 9 * PT) > maxNotesW) {
        while (
          serifItalic.widthOfTextAtSize(notesText + "...", 9 * PT) >
            maxNotesW &&
          notesText.length > 0
        )
          notesText = notesText.slice(0, -1);
        notesText += "...";
      }
      page.drawText(notesText, {
        x: notesX,
        y: sectionTop - mm(4) - 11 * PT - mm(1) - 9 * PT,
        size: 9 * PT,
        font: serifItalic,
        color: DARK,
      });
    }

    // Totals table (right, 75mm)
    const totalsX = PAD_SIDE + CONTENT_WIDTH - TOTALS_W;
    const totalsFont = 11 * PT;
    const grandTotalFont = 12 * PT;
    const rowH = mm(7);
    const padH = mm(4);
    const padV = mm(2);
    const borderThick = mm(1);

    const { subtotal, tax, total } = calcQuotationTotals(
      quotation.items,
      quotation.taxRate,
    );

    const drawTotalsRow = (
      label: string,
      value: string,
      isGrandTotal: boolean,
    ) => {
      const fontSize = isGrandTotal ? grandTotalFont : totalsFont;
      const pt_ = isGrandTotal ? mm(3) : padV;
      const pb = isGrandTotal ? mm(3) : padV;
      const rowTotal = isGrandTotal ? pt_ + fontSize + pb : rowH;
      const textY = y - pt_ - fontSize;

      if (isGrandTotal) {
        page.drawRectangle({
          x: totalsX,
          y: y - rowTotal,
          width: TOTALS_W,
          height: rowTotal,
          color: GRAND_TOTAL_BG,
        });
      }

      page.drawText(label, {
        x: totalsX + mm(3),
        y: textY,
        size: fontSize,
        font: isGrandTotal ? boldFont : serifFont,
        color: DARK,
      });
      const valueFont = serifFont;
      const vw = valueFont.widthOfTextAtSize(value, fontSize);
      page.drawText(value, {
        x: totalsX + TOTALS_W - vw - mm(3),
        y: textY,
        size: fontSize,
        font: valueFont,
        color: DARK,
      });

      if (!isGrandTotal) {
        page.drawLine({
          start: { x: totalsX, y: y - rowTotal },
          end: { x: totalsX + TOTALS_W, y: y - rowTotal },
          thickness: borderThick,
          color: TOTALS_BORDER,
        });
      }

      y = y - rowTotal;
    };

    // Center the totals block vertically in the section
    const totalsBlockHeight =
      rowH * 2 + mm(3) + grandTotalFont + mm(3);
    y = sectionCenterY + totalsBlockHeight / 2;

    drawTotalsRow("Sub-Total", formatCurrency(subtotal), false);
    drawTotalsRow(`Tax (${quotation.taxRate}%)`, formatCurrency(tax), false);
    drawTotalsRow("Grand Total", formatCurrency(total), true);

    y = sectionBottom;
  };

  // ─── Stamp & Sign (35mm, label + stamp + signature) ───
  const drawStampSign = () => {
    const sectionTop = y;
    const sectionBottom = sectionTop - STAMP_SIGN_HEIGHT;
    const sectionCenterY = sectionTop - STAMP_SIGN_HEIGHT / 2;

    const innerLeft = PAD_SIDE + STAMP_SIGN_PAD;
    const innerRight = PAGE_WIDTH - PAD_SIDE - STAMP_SIGN_PAD;
    const innerW = innerRight - innerLeft;

    // Label: "Digitally Signed:" (40mm, left)
    const labelText = "Digitally Signed:";
    const labelFont = 11 * PT;
    const labelX = innerLeft;
    const labelTop = sectionCenterY + SIGN_LABEL_H / 2;
    const labelBottom = sectionCenterY - SIGN_LABEL_H / 2;

    page.drawText(labelText, {
      x: labelX,
      y: sectionCenterY - labelFont / 2,
      size: labelFont,
      font: serifBoldItalic,
      color: BLACK,
    });

    // Double border on right side of label
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

    // Signature image (50mm, right)
    const sigX = innerRight - SIGN_IMG_W;
    const sigY = sectionCenterY - SIGN_IMG_H / 2;
    if (sigImg) {
      const imgRatio = sigImg.width / sigImg.height;
      let drawW = SIGN_IMG_W;
      let drawH = SIGN_IMG_H;
      if (drawW / drawH > imgRatio) {
        drawW = SIGN_IMG_H * imgRatio;
      } else {
        drawH = SIGN_IMG_W / imgRatio;
      }
      page.drawImage(sigImg, {
        x: sigX + (SIGN_IMG_W - drawW) / 2,
        y: sigY + (SIGN_IMG_H - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }

    // Stamp (center, 30mm x 25mm)
    const stampW = mm(30);
    const stampH = mm(25);
    const stampAreaW = innerW - SIGN_LABEL_W - SIGN_IMG_W;
    const stampCx = innerLeft + SIGN_LABEL_W + stampAreaW / 2;
    const stampCy = sectionCenterY;

    if (stampImg) {
      const stampRot = -35;
      const stampRad = (stampRot * Math.PI) / 180;
      const cosR = Math.cos(stampRad);
      const sinR = Math.sin(stampRad);
      const imgX = stampCx - (stampW / 2) * cosR + (stampH / 2) * sinR;
      const imgY = stampCy - (stampW / 2) * sinR - (stampH / 2) * cosR;
      page.drawImage(stampImg, {
        x: imgX,
        y: imgY,
        width: stampW,
        height: stampH,
        rotate: degrees(stampRot),
      });
    } else {
      // Fallback: manual circle stamp
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
      drawStampText(
        formatStampDate(quotation.createdAt),
        -15,
        6,
        font,
        STAMP_RED,
      );
      drawStampText("DIGITAL STAMP", -27, 6, boldFont, STAMP_RED);
    }

    y = sectionBottom;
  };

  // ─── Draw items with pagination ───
  const firstPageItems = quotation.items.slice(0, ITEMS_PER_PAGE);
  drawItems(firstPageItems, 0);
  const remainingItems = quotation.items.slice(ITEMS_PER_PAGE);

  for (let i = 0; i < remainingItems.length; i += ITEMS_PER_MIDDLE_PAGE) {
    addPage();
    const isLastMiddlePage = i + ITEMS_PER_MIDDLE_PAGE >= remainingItems.length;
    drawItems(
      remainingItems.slice(i, i + ITEMS_PER_MIDDLE_PAGE),
      i + ITEMS_PER_PAGE,
    );
    if (!isLastMiddlePage) {
      // continue to next page
    }
  }

  // ─── Totals & Notes (40mm, side-by-side) ───
  drawTotalsNotes();

  // ─── Stamp & Sign (35mm) ───
  drawStampSign();

  return doc.save();
}

export async function downloadQuotationPDF(
  quotation: Quotation,
): Promise<void> {
  const bytes = await generateQuotationPDF(quotation);
  const filename = `Quotation_${quotation.quotationCode || quotation.id.toUpperCase()}.pdf`;
  downloadPDF(bytes, filename);
}

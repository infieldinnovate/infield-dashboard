"use client";

import JsBarcode from "jsbarcode";
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
  statusLabels,
} from "../../lib/documentUtils";
import A4Layout from "./A4Layout";
import ActionBar from "./ActionBar";
import StatusBadge from "./StatusBadge";
import {
  ITEMS_PER_MIDDLE_PAGE,
  ITEMS_PER_PAGE,
  paginateItems,
  formatAmount,
} from "./documentHelpers";
import type { QuotationDocumentActions, QuotationDocumentProps } from "./types";
import styles from "./QuotationDocument.module.scss";

export type { QuotationDocumentActions } from "./types";

/* === Main Component === */
export default function QuotationDocument({
  quotation,
  actions,
}: QuotationDocumentProps) {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewToolbar}>
        <div className={styles.previewStatus}>
          <StatusBadge status={quotation.status} />
        </div>
        <ActionBar
          actions={actions}
          onPrint={() => printQuotation(quotation)}
          onDownload={() => downloadQuotationPDF(quotation)}
        />
      </div>
      <div className={styles.previewBody}>
        <A4Layout quotation={quotation} />
      </div>
    </div>
  );
}

/* === Print === */
const printStyles = `
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4 portrait;margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;background:#fff}
.qt-page{width:210mm;min-height:297mm;padding:15mm;position:relative;page-break-after:always;background:#fff url('/backgrounds/qt-bg.jpg') center/cover no-repeat}
.qt-page:last-child{page-break-after:auto}
.qt-header{margin-bottom:20px;overflow:hidden}
.qt-header-top{display:grid;grid-template-columns:1.15fr 1fr 1fr;align-items:stretch;min-height:132px;padding:18px 28px 22px;gap:24px}
.qt-brand{display:flex;flex-direction:column;gap:12px}
.qt-logo{display:inline-flex;align-items:flex-end;gap:2px;width:fit-content;color:#168ac0;font-size:25px;font-style:italic;font-weight:800;letter-spacing:-0.08em;line-height:0.9;position:relative;padding:0 8px 9px 4px}
.qt-logo::after{content:'';position:absolute;left:0;right:0;bottom:0;height:7px;border-top:3px solid #168ac0;border-radius:50%;transform:skewX(-20deg)}
.qt-logo-mark{color:#168ac0;font-size:24px;font-weight:800}
.qt-logo-name{font-size:25px;font-weight:800;color:#168ac0}
.qt-logo-drop{width:8px;height:14px;border:2px solid #168ac0;border-radius:70% 30% 70% 30%;transform:rotate(35deg);align-self:flex-end;margin:0 0 1px 3px}
.qt-business-name{display:flex;flex-direction:column;font-size:23px;line-height:1;letter-spacing:0.02em}
.qt-business-name strong{font-weight:800;color:#126542}
.qt-business-name span{font-weight:400;color:#111}
.qt-brand-rule{height:18px;width:58%;background:#707070;margin-top:auto}
.qt-title-block{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.qt-title-block h1{font-size:30px;font-weight:800;letter-spacing:0.06em;color:#126542;margin:0;line-height:1}
.qt-code-text{font-size:14px;font-weight:800;color:#126542;letter-spacing:0.1em}.qt-barcode-text{font-size:10px;font-weight:600;color:#555;letter-spacing:0.06em}.qt-barcode-img{height:34px;width:auto;display:block}
.qt-contact{display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;border-left:4px solid #111;padding:8px 0 8px 20px;position:relative}
.qt-contact::before{content:'';position:absolute;top:-18px;right:-28px;width:130px;height:24px;background:#c9c9c9}
.qt-contact-row{display:grid;grid-template-columns:18px 1fr;align-items:baseline;gap:8px;width:100%;padding-bottom:4px;border-bottom:1px solid #c9c9c9;font-size:11px;color:#111}
.qt-contact-row strong{color:#126542;font-weight:800;font-size:14px}
.qt-contact address{font-size:11px;font-style:normal;color:#111;margin-top:8px;line-height:1.35}
.qt-accent-bar{height:8px;background:#35b875;display:flex}
.qt-accent-bar span{width:7%;background:#c9c9c9}
.qt-billto-for{display:grid;grid-template-columns:1fr 1fr;margin:20px 0;gap:0}
.qt-billto{background:#e2e2e2;padding:14px 20px}
.qt-billto-label{display:block;font-size:12px;font-weight:800;color:#126542;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px}
.qt-client-name{font-size:14px;font-weight:700;color:#111;margin:0 0 2px}
.qt-client-address{font-size:11px;color:#444;margin:0 0 2px}
.qt-client-contact{font-size:11px;color:#444;margin:0}
.qt-for-section{background:#86ad9c;padding:14px 20px;display:flex;flex-direction:column}
.qt-for-label{display:block;font-size:12px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px}
.qt-for-text{font-size:13px;color:#fff;line-height:1.35}
.qt-date-bar{display:flex;gap:0;margin-bottom:20px;border-left:4px solid #126542;background:#f5f7fa;padding:12px 18px}
.qt-date-item{flex:1;display:flex;flex-direction:column;gap:2px}
.qt-date-item+.qt-date-item{padding-left:20px;border-left:1px solid #d0dce6}
.qt-date-label{font-size:9px;font-weight:700;color:#777;text-transform:uppercase;letter-spacing:0.06em}
.qt-date-value{font-size:12px;font-weight:600;color:#111}
.qt-items-table{width:100%;border-collapse:collapse;table-layout:fixed;margin:20px 0 0;color:#111;font-size:12px}
.qt-items-table th,.qt-items-table td{padding:8px 12px;border-bottom:1px solid #dce5e8;text-align:left;vertical-align:middle}
.qt-items-table thead th{height:34px;background:#36b976;color:#fff;font-size:15px;font-weight:800;border-right:2px solid #fff}
.qt-items-table thead th:nth-child(3),.qt-items-table thead th:nth-child(4){background:#888b8b}
.qt-items-table thead th:last-child{border-right:0}
.qt-items-table tbody td{height:34px;font-family:Georgia,'Times New Roman',serif;font-size:13px}.qt-items-table tbody tr:nth-child(even) td{background:#f0f6f3}
.qt-no-col{width:8%;text-align:center}
.qt-unit-col{width:9%;text-align:center}
.qt-qty-col{width:15%;text-align:center}
.qt-price-col{width:12%;text-align:right}
.qt-total-col{width:16%;text-align:right}
.qt-totals{width:52%;margin:48px 0 24px auto;color:#111;font-family:Georgia,'Times New Roman',serif;font-size:13px}
.qt-totals-row{display:grid;grid-template-columns:1fr 0.7fr;min-height:32px;align-items:center;border-bottom:2px solid #d2d2d2}
.qt-totals-row span{padding-left:18px}
.qt-totals-row strong{text-align:right;padding-right:14px;font-weight:400}
.qt-totals-row em{margin-left:24px;font-style:italic}
.qt-grand-total{display:grid;grid-template-columns:1.15fr 1fr;min-height:42px;align-items:center;background:#b4ead6;font-size:16px}
.qt-grand-total strong{height:100%;display:flex;align-items:center;padding-left:18px;background:#36b976;color:#fff;font-size:17px}
.qt-grand-total span{text-align:right;padding-right:14px;font-weight:800}
.qt-footer{margin-top:28px;color:#111}
.qt-footer-notes{display:flex;flex-direction:column;gap:6px;min-height:82px;padding-top:44px;font-size:14px}
.qt-footer-notes strong{font-size:16px;font-weight:800}
.qt-footer-notes span{color:#333;line-height:1.45}
.qt-footer-bottom{display:grid;grid-template-columns:1fr 120px 1fr;align-items:end;gap:20px;min-height:126px}
.qt-footer-thank{align-self:end;padding-bottom:16px;color:#126542;font-size:16px;font-weight:800;text-transform:uppercase}
.qt-footer-stamp{justify-self:center;align-self:center}
.qt-authorised-sig{display:flex;flex-direction:column;align-items:center;gap:8px;padding-bottom:12px}
.qt-authorised-sig strong{font-size:14px;font-weight:800}
.qt-footer-contact{margin-top:12px;padding-top:8px;border-top:1px solid #e0e6ed;font-size:11px;color:#555}
.qt-compact-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid #e5e5e5}
.qt-compact-company{font-size:14px;font-weight:700;color:#126542}
.qt-compact-info{text-align:right}
.qt-compact-title{font-size:12px;color:#666}
.qt-compact-number{font-size:10px;color:#999;display:block}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.qt-page{padding:14mm 15mm 12mm}.qt-header-top{grid-template-columns:1.2fr .8fr;min-height:132px;padding:0;gap:28px;align-items:start}.qt-brand{gap:0;align-items:flex-start}.qt-logo-img{width:174px;height:52px;object-fit:contain;object-position:left center;margin:0 0 14px}.qt-business-name{display:block;color:#164865;font-size:21px;font-weight:800;line-height:1.1}.qt-business-details{margin-top:5px;color:#151515;font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.35}.qt-business-details p{margin:0}.qt-title-block{align-items:flex-end;text-align:right;justify-content:flex-start;gap:0}.qt-title-block h1{margin:2px 0 19px;color:#164865;font-size:21px}.qt-barcode-img{width:205px;height:38px}.qt-code-text{margin-top:9px;color:#164865;font-size:15px}.qt-date-text{margin-top:7px;color:#164865;font-size:14px}.qt-date-text span{color:#111;margin-left:4px}.qt-accent-bar{height:1px;margin-top:17px;background:#b7b7b7}.qt-accent-bar span{display:none}.qt-billto-for{grid-template-columns:1fr 1.55fr;gap:28px;align-items:center;margin:0 0 45px}.qt-billto{padding:2px 0;background:#fff}.qt-billto-label{color:#111;font-size:16px;font-weight:500}.qt-for-section{display:grid;grid-template-columns:74px 1fr;min-height:51px;padding:0;background:#d4d4d4}.qt-for-label{display:flex;align-items:center;padding:0 14px;background:#bdbdbd;color:#111;font-size:16px;font-weight:500}.qt-for-text{display:flex;align-items:center;padding:0 16px;color:#111;font-size:14px}.qt-date-bar{display:none}.qt-items-table{margin:0}.qt-items-table th{height:32px;background:#104b68;font-size:14px}.qt-items-table tbody td{height:26px;padding:6px 10px;font-size:12px}.qt-totals{width:41%;margin:29px 0 0 auto}.qt-grand-total{min-height:37px;background:#f3f7f6;font-size:15px}.qt-grand-total strong{padding-left:3px;background:transparent;color:#111;font-size:15px}.qt-grand-total span{font-weight:400}.qt-footer{margin-top:63px}.qt-footer-notes{min-height:86px;padding:0 0 0 13%;font-size:15px;font-style:italic}.qt-footer-notes strong{font-size:15px}.qt-footer-notes span{display:none}.qt-footer-bottom{grid-template-columns:1.25fr 1fr 1.1fr;min-height:125px}.qt-footer-thank{grid-column:1;grid-row:2;color:#111;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;text-transform:none}.qt-footer-stamp{grid-column:2;grid-row:1 / 3}.qt-authorised-sig{grid-column:3;grid-row:1 / 3;padding-top:12px}.qt-footer-contact{grid-column:1;grid-row:1;margin:0 0 10px;padding:0;border:0;color:#111;font-weight:600}.qt-footer-contact span{margin-left:26px}
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateBarcodeDataUrl(value: string): string {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, value, {
      format: "CODE128",
      displayValue: false,
      height: 34,
      width: 1.35,
      margin: 0,
      background: "#ffffff",
      lineColor: "#111111",
    });
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
}

function buildQuotationHTML(quotation: Quotation): string {
  const settings = getSettings();
  const { businessName, address, phone, email, website, logo } =
    settings.business;
  const siteUrl = website || "www.infield.co.ke";
  const pages = paginateItems(quotation.items);
  const signatureSrc =
    quotation.createdBySignature || settings.business.signature;
  const barcodeValue = generateBarcode(
    quotation.userId,
    quotation.quotationCode,
  );
  const barcodeDataUrl = generateBarcodeDataUrl(barcodeValue);
  const barcodeImg = barcodeDataUrl
    ? `<img src="${barcodeDataUrl}" alt="Barcode" class="qt-barcode-img" />`
    : "";

  const buildItemsTable = (items: QuotationItem[]): string => {
    return `<table class="qt-items-table"><thead><tr>
      <th class="qt-no-col">No.</th><th>Description</th><th class="qt-unit-col">Size</th>
      <th class="qt-qty-col">Qty</th><th class="qt-price-col">Price</th><th class="qt-total-col">Total</th>
    </tr></thead><tbody>${items
      .map((item, i) => {
        return `<tr>
        <td class="qt-no-col">${i + 1}</td>
        <td>${escapeHtml(item.productName)}</td>
        <td class="qt-unit-col">${escapeHtml(item.unit || "-")}</td>
        <td class="qt-qty-col">${item.quantity}</td>
        <td class="qt-price-col">${formatAmount(item.unitPrice)}</td>
        <td class="qt-total-col">${formatAmount(calcItemTotal(item))}</td>
      </tr>`;
      })
      .join("")}</tbody></table>`;
  };

  const { subtotal, tax, total } = calcQuotationTotals(
    quotation.items,
    quotation.taxRate,
  );
  const buildTotals = () => `<div class="qt-totals">
    <div class="qt-totals-row"><span>Sub-Total</span><strong>${formatCurrency(subtotal)}</strong></div>
    <div class="qt-totals-row"><span>Tax <em>(${quotation.taxRate}%)</em></span><strong>${formatCurrency(tax)}</strong></div>
    <div class="qt-grand-total"><strong>Grand Total</strong><span>${formatCurrency(total)}</span></div>
  </div>`;

  const stampHTML = `<div class="qt-footer-stamp"><div style="width:88px;height:88px;border:2.5px solid #c0392b;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#c0392b;font-family:Georgia,serif;transform:rotate(-8deg);opacity:0.85">
    <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
      <span style="font-size:11px;font-weight:800;text-transform:uppercase">Infield</span>
      <span style="font-size:7px;letter-spacing:1px">* * * *</span>
      <span style="font-size:7px;font-weight:600">+254 702 393 677</span>
      <span style="font-size:6px;font-weight:600">${escapeHtml(formatDate(quotation.createdAt))}</span>
    </div>
    <span style="font-size:6px;font-weight:700;text-transform:uppercase;border-top:1px solid #c0392b;padding-top:1px;margin-top:2px">DIGITAL STAMP</span>
  </div></div>`;

  const sigHTML = signatureSrc
    ? `<img src="${escapeHtml(signatureSrc)}" alt="Signature" style="max-width:140px;max-height:50px;object-fit:contain" />`
    : "";

  const buildFooter = () => `<footer class="qt-footer">
    <div class="qt-footer-notes"><strong>Terms &amp; Conditions</strong>${quotation.notes ? `<span>${escapeHtml(quotation.notes)}</span>` : ""}</div>
    <div class="qt-footer-bottom">
      <div class="qt-footer-thank">Thank you for choosing Infield Innovations!</div>
      ${stampHTML}
      <div class="qt-authorised-sig">${sigHTML}<strong>${escapeHtml(quotation.createdBy || "")}</strong></div>
    </div>
    <div class="qt-footer-contact">CONTACT US: <span>${escapeHtml(phone)}</span></div>
  </footer>`;

  const headerFull = `<header class="qt-header"><div class="qt-header-top">
    <div class="qt-brand"><img class="qt-logo-img" src="${escapeHtml(logo)}" alt="${escapeHtml(businessName)} logo" />
      <div class="qt-business-name">${escapeHtml(businessName)}</div>
      <div class="qt-business-details"><p>${escapeHtml(address)}</p><p><strong>Tel:</strong> ${escapeHtml(phone)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Website:</strong> ${escapeHtml(siteUrl)}</p></div>
    </div>
    <div class="qt-title-block"><h1>QUOTATION</h1>${barcodeImg}<span class="qt-code-text">${escapeHtml(quotation.quotationCode || "")}</span><span class="qt-date-text"><strong>Date:</strong><span>${escapeHtml(formatDate(quotation.createdAt))}</span></span></div>
  </div><div class="qt-accent-bar"><span></span></div></header>`;

  const billToFor = `<div class="qt-billto-for">
    <div class="qt-billto">
      <span class="qt-billto-label">BILL TO:</span>
      <p class="qt-client-name">${escapeHtml(quotation.customerName)}</p>
      ${quotation.customerAddress ? `<p class="qt-client-address">${escapeHtml(quotation.customerAddress)}</p>` : ""}
      <p class="qt-client-contact">${escapeHtml(quotation.customerContact)}</p>
    </div>
    <div class="qt-for-section">
      <span class="qt-for-label">FOR:</span>
      <span class="qt-for-text">${escapeHtml(quotation.quoteFor)}</span>
    </div>
  </div>`;

  const dateBar = `<div class="qt-date-bar">
    <div class="qt-date-item"><span class="qt-date-label">Date</span><span class="qt-date-value">${formatDate(quotation.createdAt)}</span></div>
    <div class="qt-date-item"><span class="qt-date-label">Status</span><span class="qt-date-value">${statusLabels[quotation.status] || quotation.status}</span></div>
  </div>`;

  const headerCompact = `<div class="qt-compact-header"><div class="qt-compact-company">${escapeHtml(businessName)}</div><div class="qt-compact-info"><span class="qt-compact-title">QUOTATION</span><span class="qt-compact-number">${escapeHtml(quotation.quotationCode || "")}</span></div></div>`;

  return pages
    .map((pageItems, i) => {
      const isFirst = i === 0;
      const isLast = i === pages.length - 1;
      if (isFirst)
        return `<div class="qt-page">${headerFull}${billToFor}${dateBar}${buildItemsTable(pageItems)}${isLast ? buildTotals() + buildFooter() : ""}</div>`;
      return `<div class="qt-page">${headerCompact}${buildItemsTable(pageItems)}${isLast ? buildTotals() + buildFooter() : ""}</div>`;
    })
    .join("");
}

export function printQuotation(quotation: Quotation): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(
    `<!DOCTYPE html><html><head><title>Quotation ${quotation.quotationCode || quotation.id}</title><style>${printStyles}</style></head><body>${buildQuotationHTML(quotation)}</body></html>`,
  );
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

/* === PDF === */
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const LOGO_BLUE = rgb(0.094, 0.541, 0.753);
const BRAND_GREEN = rgb(0.086, 0.282, 0.388);
const ACCENT_GREEN = rgb(0.208, 0.722, 0.463);
const ACCENT_GRAY = rgb(0.788, 0.788, 0.788);
const FOR_LABEL_BG = rgb(0.741, 0.741, 0.741);
const FOR_CONTENT_BG = rgb(0.831, 0.831, 0.831);
const TABLE_GREEN = rgb(0.063, 0.294, 0.408);
const TABLE_GRAY = rgb(0.533, 0.545, 0.545);
const GRAND_TOTAL_BG = rgb(0.953, 0.969, 0.965);
const BRAND_RULE = rgb(0.439, 0.439, 0.439);
const STAMP_RED = rgb(0.753, 0.224, 0.169);
const DARK = rgb(0.067, 0.067, 0.067);
const GRAY = rgb(0.5, 0.5, 0.5);
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93);
const WHITE = rgb(1, 1, 1);
const EVEN_ROW_BG = rgb(0.941, 0.961, 0.953);

export async function generateQuotationPDF(
  quotation: Quotation,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const serifFont: PDFFont = await doc.embedFont(StandardFonts.TimesRoman);

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

  const backgroundBytes = await fetchImageBytes('/backgrounds/qt-bg.jpg');
  let backgroundImg = null;
  if (backgroundBytes) {
    try {
      backgroundImg = await doc.embedJpg(backgroundBytes);
    } catch {
      /* ignore unavailable background */
    }
  }

  const sigBytes = await fetchImageBytes(signatureSrc);
  let sigImg = null;
  if (sigBytes) {
    try {
      sigImg = await doc.embedPng(sigBytes);
    } catch {
      /* try jpg */ try {
        sigImg = await doc.embedJpg(sigBytes);
      } catch {
        /* ignore */
      }
    }
  }

  const col1X = MARGIN;
  const col1W = 166;
  const col2X = col1X + col1W + 20;
  const col2W = 145;
  const col3X = col2X + col2W + 20;
  const col3W = PAGE_WIDTH - MARGIN - col3X;

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  const drawPageBackground = () => {
    if (backgroundImg) {
      page.drawImage(backgroundImg, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });
    }
  };
  drawPageBackground();

  const addPage = (): PDFPage => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawPageBackground();
    y = PAGE_HEIGHT - MARGIN;
    page.drawText(businessName, {
      x: MARGIN,
      y,
      size: 12,
      font: boldFont,
      color: BRAND_GREEN,
    });
    const info = `QUOTATION  ${quotation.quotationCode || quotation.id}`;
    page.drawText(info, {
      x: PAGE_WIDTH - MARGIN - boldFont.widthOfTextAtSize(info, 10),
      y,
      size: 10,
      font,
      color: GRAY,
    });
    y -= 16;
    page.drawLine({
      start: { x: MARGIN, y: y + 4 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 4 },
      thickness: 1,
      color: ACCENT_GREEN,
    });
    y -= 14;
    return page;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 60) addPage();
  };

  const drawWrappedTextAt = (
    text: string,
    x: number,
    maxWidth: number,
    size: number,
    f: PDFFont,
    color: ReturnType<typeof rgb>,
    startY: number,
  ): number => {
    const words = text.split(" ");
    let line = "";
    let cy = startY;
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(testLine, size) > maxWidth) {
        page.drawText(line, { x, y: cy, size, font: f, color });
        cy -= size + 4;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x, y: cy, size, font: f, color });
      cy -= size + 4;
    }
    return cy;
  };

  // Header
  const headerTop = PAGE_HEIGHT - MARGIN - 18;
  if (logoImg) {
    const logoW = 120;
    const logoH = Math.min((logoImg.height / logoImg.width) * logoW, 42);
    page.drawImage(logoImg, {
      x: col1X,
      y: headerTop - logoH + 4,
      width: logoW,
      height: logoH,
    });
  }
  const bizY = headerTop - 58;
  page.drawText(businessName, {
    x: col1X,
    y: bizY,
    size: 16,
    font: boldFont,
    color: BRAND_GREEN,
  });
  page.drawText(address, {
    x: col1X,
    y: bizY - 16,
    size: 8,
    font: serifFont,
    color: DARK,
  });
  page.drawText(`Tel: ${phone}`, {
    x: col1X,
    y: bizY - 28,
    size: 8,
    font: serifFont,
    color: DARK,
  });
  page.drawText(`Email: ${email}`, {
    x: col1X,
    y: bizY - 40,
    size: 8,
    font: serifFont,
    color: DARK,
  });
  page.drawText(`Website: ${siteUrl}`, {
    x: col1X,
    y: bizY - 52,
    size: 8,
    font: serifFont,
    color: DARK,
  });

  const titleText = "QUOTATION";
  page.drawText(titleText, {
    x: col2X + (col2W - boldFont.widthOfTextAtSize(titleText, 24)) / 2,
    y: headerTop - 6,
    size: 24,
    font: boldFont,
    color: BRAND_GREEN,
  });
  const codeText = quotation.quotationCode || "";
  page.drawText(codeText, {
    x: col2X + (col2W - boldFont.widthOfTextAtSize(codeText, 14)) / 2,
    y: headerTop - 28,
    size: 14,
    font: boldFont,
    color: BRAND_GREEN,
  });
  const barcodeText = barcodeValue;
  page.drawText(barcodeText, {
    x: col2X + (col2W - font.widthOfTextAtSize(barcodeText, 7)) / 2,
    y: headerTop - 44,
    size: 7,
    font: font,
    color: GRAY,
  });
  if (barcodeImg) {
    const bw = 100;
    const bh = (barcodeImg.height / barcodeImg.width) * bw;
    page.drawImage(barcodeImg, {
      x: col2X + (col2W - bw) / 2,
      y: headerTop - 44 - bh - 2,
      width: bw,
      height: bh,
    });
  }

  const contactTop = headerTop + 8;
  const contactH = 62;
  const contactBottom = contactTop - contactH;
  page.drawRectangle({
    x: col3X,
    y: contactBottom,
    width: 4,
    height: contactH + 8,
    color: DARK,
  });
  page.drawRectangle({
    x: col3X + col3W - 36,
    y: contactTop + 10,
    width: 36,
    height: 14,
    color: ACCENT_GRAY,
  });
  const cLabelX = col3X + 4 + 14;
  const cValX = cLabelX + 18;
  let cy = contactTop;
  page.drawText("T.", {
    x: cLabelX,
    y: cy,
    size: 11,
    font: boldFont,
    color: BRAND_GREEN,
  });
  page.drawText(phone, { x: cValX, y: cy, size: 9, font: font, color: DARK });
  page.drawLine({
    start: { x: cLabelX, y: cy - 4 },
    end: { x: col3X + col3W, y: cy - 4 },
    thickness: 0.5,
    color: ACCENT_GRAY,
  });
  cy -= 15;
  page.drawText("W.", {
    x: cLabelX,
    y: cy,
    size: 11,
    font: boldFont,
    color: BRAND_GREEN,
  });
  page.drawText(siteUrl, { x: cValX, y: cy, size: 9, font: font, color: DARK });
  page.drawLine({
    start: { x: cLabelX, y: cy - 4 },
    end: { x: col3X + col3W, y: cy - 4 },
    thickness: 0.5,
    color: ACCENT_GRAY,
  });
  cy -= 15;
  page.drawText("E.", {
    x: cLabelX,
    y: cy,
    size: 11,
    font: boldFont,
    color: BRAND_GREEN,
  });
  page.drawText(email, { x: cValX, y: cy, size: 9, font: font, color: DARK });
  page.drawLine({
    start: { x: cLabelX, y: cy - 4 },
    end: { x: col3X + col3W, y: cy - 4 },
    thickness: 0.5,
    color: ACCENT_GRAY,
  });
  cy -= 15;
  page.drawText(address, {
    x: cLabelX,
    y: cy,
    size: 9,
    font: font,
    color: DARK,
  });

  const headerBottomY = Math.min(bizY - 40, cy - 12);
  page.drawLine({
    start: { x: MARGIN, y: headerBottomY },
    end: { x: PAGE_WIDTH - MARGIN, y: headerBottomY },
    thickness: 3,
    color: LOGO_BLUE,
  });
  const accentY = headerBottomY - 10;
  page.drawRectangle({
    x: MARGIN,
    y: accentY - 8,
    width: CONTENT_WIDTH,
    height: 8,
    color: ACCENT_GREEN,
  });
  page.drawRectangle({
    x: MARGIN,
    y: accentY - 8,
    width: CONTENT_WIDTH * 0.07,
    height: 8,
    color: ACCENT_GRAY,
  });

  // Bill To + For
  const bfHeight = 50;
  const bfY = accentY - 18;
  const halfW = CONTENT_WIDTH / 2;
  page.drawRectangle({
    x: MARGIN,
    y: bfY - bfHeight,
    width: halfW,
    height: bfHeight,
    color: FOR_CONTENT_BG,
  });
  page.drawText("BILL TO:", {
    x: MARGIN + 14,
    y: bfY - 12,
    size: 11,
    font: boldFont,
    color: BRAND_GREEN,
  });
  page.drawText(quotation.customerName, {
    x: MARGIN + 14,
    y: bfY - 26,
    size: 12,
    font: boldFont,
    color: DARK,
  });
  let addrY = bfY - 38;
  if (quotation.customerAddress) {
    page.drawText(quotation.customerAddress, {
      x: MARGIN + 14,
      y: addrY,
      size: 9,
      font: font,
      color: GRAY,
    });
    addrY -= 12;
  }
  page.drawText(quotation.customerContact, {
    x: MARGIN + 14,
    y: addrY,
    size: 9,
    font: font,
    color: GRAY,
  });
  page.drawRectangle({
    x: MARGIN + halfW,
    y: bfY - bfHeight,
    width: halfW,
    height: bfHeight,
    color: FOR_CONTENT_BG,
  });
  page.drawRectangle({
    x: MARGIN + halfW,
    y: bfY - bfHeight,
    width: 74,
    height: bfHeight,
    color: FOR_LABEL_BG,
  });
  page.drawText("FOR:", {
    x: MARGIN + halfW + 14,
    y: bfY - 12,
    size: 11,
    font: font,
    color: DARK,
  });
  let forDisplay = quotation.quoteFor || "";
  const maxForW = halfW - 28;
  if (font.widthOfTextAtSize(forDisplay, 11) > maxForW) {
    while (
      font.widthOfTextAtSize(forDisplay + "...", 11) > maxForW &&
      forDisplay.length > 0
    )
      forDisplay = forDisplay.slice(0, -1);
    forDisplay += "...";
  }
  page.drawText(forDisplay, {
    x: MARGIN + halfW + 88,
    y: bfY - 28,
    size: 11,
    font: font,
    color: DARK,
  });

  y = bfY - bfHeight - 42;

  // Items table
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

  const drawTableHeader = () => {
    const thH = 24;
    const thY = y - thH;
    page.drawRectangle({
      x: MARGIN,
      y: thY,
      width: CONTENT_WIDTH,
      height: thH,
      color: TABLE_GREEN,
    });
    page.drawRectangle({
      x: colXs.unit,
      y: thY,
      width: colWidths.unit + colWidths.qty,
      height: thH,
      color: TABLE_GRAY,
    });
    const sepW = 1.5;
    [colXs.desc, colXs.unit, colXs.qty, colXs.price, colXs.total].forEach(
      (sx) =>
        page.drawRectangle({
          x: sx - sepW / 2,
          y: thY,
          width: sepW,
          height: thH,
          color: WHITE,
        }),
    );
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
      const tw = boldFont.widthOfTextAtSize(h.text, 13);
      let tx: number;
      if (h.align === "center") tx = h.x + (h.w - tw) / 2;
      else if (h.align === "right") tx = h.x + h.w - tw - 8;
      else tx = h.x + 8;
      page.drawText(h.text, {
        x: tx,
        y: thY + 8,
        size: 13,
        font: boldFont,
        color: WHITE,
      });
    }
    y = thY;
  };

  const drawItems = (items: QuotationItem[], startIndex: number) => {
    drawTableHeader();
    y -= 2;
    const rowH = 20;
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
        color: rgb(0.86, 0.9, 0.91),
      });
      const cellY = rowY + 7;
      const noStr = String(startIndex + i + 1);
      page.drawText(noStr, {
        x:
          colXs.no +
          (colWidths.no - serifFont.widthOfTextAtSize(noStr, 11)) / 2,
        y: cellY,
        size: 11,
        font: serifFont,
        color: DARK,
      });
      let descText = item.productName;
      const maxDescW = colWidths.desc - 16;
      if (serifFont.widthOfTextAtSize(descText, 11) > maxDescW) {
        while (
          serifFont.widthOfTextAtSize(descText + "...", 11) > maxDescW &&
          descText.length > 0
        )
          descText = descText.slice(0, -1);
        descText += "...";
      }
      page.drawText(descText, {
        x: colXs.desc + 8,
        y: cellY,
        size: 11,
        font: serifFont,
        color: DARK,
      });
      const unitStr = item.unit || "-";
      page.drawText(unitStr, {
        x:
          colXs.unit +
          (colWidths.unit - serifFont.widthOfTextAtSize(unitStr, 11)) / 2,
        y: cellY,
        size: 11,
        font: serifFont,
        color: DARK,
      });
      const qtyStr = String(item.quantity);
      page.drawText(qtyStr, {
        x:
          colXs.qty +
          (colWidths.qty - serifFont.widthOfTextAtSize(qtyStr, 11)) / 2,
        y: cellY,
        size: 11,
        font: serifFont,
        color: DARK,
      });
      const priceStr = formatAmount(item.unitPrice);
      page.drawText(priceStr, {
        x:
          colXs.price +
          colWidths.price -
          serifFont.widthOfTextAtSize(priceStr, 11) -
          8,
        y: cellY,
        size: 11,
        font: serifFont,
        color: DARK,
      });
      const totalStr = formatAmount(calcItemTotal(item));
      page.drawText(totalStr, {
        x:
          colXs.total +
          colWidths.total -
          serifFont.widthOfTextAtSize(totalStr, 11) -
          8,
        y: cellY,
        size: 11,
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

  // Totals — flow from current y position (works on any page)
  y -= 30;
  const totalsW = CONTENT_WIDTH * 0.52;
  const totalsX = PAGE_WIDTH - MARGIN - totalsW;
  const drawTotalsRow = (label: string, value: string) => {
    const rowH = 28;
    const rowY = y - rowH;
    page.drawText(label, {
      x: totalsX + 14,
      y: rowY + 8,
      size: 11,
      font: font,
      color: GRAY,
    });
    const vw = font.widthOfTextAtSize(value, 11);
    page.drawText(value, {
      x: totalsX + totalsW - vw - 14,
      y: rowY + 8,
      size: 11,
      font: font,
      color: DARK,
    });
    page.drawLine({
      start: { x: totalsX, y: rowY },
      end: { x: totalsX + totalsW, y: rowY },
      thickness: 1,
      color: rgb(0.82, 0.82, 0.82),
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
  const gtH = 32;
  const gtY = y - gtH;
  const gtLabelW = (totalsW * 1.15) / 2.15;
  const gtValW = totalsW - gtLabelW;
  page.drawRectangle({
    x: totalsX,
    y: gtY,
    width: gtLabelW,
    height: gtH,
    color: TABLE_GREEN,
  });
  page.drawText("Grand Total", {
    x: totalsX + 14,
    y: gtY + 9,
    size: 14,
    font: boldFont,
    color: WHITE,
  });
  page.drawRectangle({
    x: totalsX + gtLabelW,
    y: gtY,
    width: gtValW,
    height: gtH,
    color: GRAND_TOTAL_BG,
  });
  const gtValStr = formatCurrency(total);
  page.drawText(gtValStr, {
    x:
      totalsX +
      gtLabelW +
      gtValW -
      boldFont.widthOfTextAtSize(gtValStr, 14) -
      14,
    y: gtY + 9,
    size: 14,
    font: boldFont,
    color: DARK,
  });
  y = gtY;

  // Footer — flows right after totals on whatever page we're on
  ensureSpace(110);
  let fy = y - 20;
  page.drawText("Terms & Conditions:", {
    x: MARGIN + 70,
    y: fy,
    size: 12,
    font: boldFont,
    color: DARK,
  });
  fy -= 16;
  if (quotation.notes)
    fy = drawWrappedTextAt(
      quotation.notes,
      MARGIN,
      CONTENT_WIDTH,
      10,
      font,
      DARK,
      fy,
    );
  fy -= 20;
  const bottomY = Math.max(fy, MARGIN + 50);
  page.drawText("THANK YOU FOR CHOOSING INFIELD INNOVATIONS!", {
    x: MARGIN,
    y: bottomY,
    size: 11,
    font: boldFont,
    color: BRAND_GREEN,
  });
  // Stamp
  const stampCx = PAGE_WIDTH / 2;
  const stampCy = bottomY + 8;
  const stampR = 30;
  page.drawCircle({
    x: stampCx,
    y: stampCy,
    size: stampR,
    borderWidth: 2,
    borderColor: STAMP_RED,
    color: WHITE,
  });
  page.drawText("INFIELD", {
    x: stampCx - boldFont.widthOfTextAtSize("INFIELD", 8) / 2,
    y: stampCy + 10,
    size: 8,
    font: boldFont,
    color: STAMP_RED,
  });
  page.drawText("* * * *", {
    x: stampCx - font.widthOfTextAtSize("* * * *", 5) / 2,
    y: stampCy + 1,
    size: 5,
    font: font,
    color: STAMP_RED,
  });
  page.drawText("+254 702 393 677", {
    x: stampCx - font.widthOfTextAtSize("+254 702 393 677", 5) / 2,
    y: stampCy - 7,
    size: 5,
    font: font,
    color: STAMP_RED,
  });
  page.drawLine({
    start: { x: stampCx - 18, y: stampCy - 12 },
    end: { x: stampCx + 18, y: stampCy - 12 },
    thickness: 0.5,
    color: STAMP_RED,
  });
  const stampDate = formatStampDate(quotation.createdAt);
  page.drawText(stampDate, {
    x: stampCx - font.widthOfTextAtSize(stampDate, 4) / 2,
    y: stampCy - 25,
    size: 4,
    font,
    color: STAMP_RED,
  });
  page.drawText("DIGITAL STAMP", {
    x: stampCx - boldFont.widthOfTextAtSize("DIGITAL STAMP", 4) / 2,
    y: stampCy - 18,
    size: 4,
    font: boldFont,
    color: STAMP_RED,
  });
  // Signature
  const sigX = PAGE_WIDTH - MARGIN - 140;
  page.drawLine({
    start: { x: sigX, y: bottomY + 18 },
    end: { x: sigX + 140, y: bottomY + 18 },
    thickness: 1,
    color: DARK,
  });
  if (sigImg) {
    const sigW = 120;
    const sigH = (sigImg.height / sigImg.width) * sigW;
    page.drawImage(sigImg, {
      x: sigX + (140 - sigW) / 2,
      y: bottomY + 20,
      width: sigW,
      height: Math.min(sigH, 40),
    });
  }
  const sigLabel = quotation.createdBy || "Authorised Sign";
  page.drawText(sigLabel, {
    x: sigX + (140 - boldFont.widthOfTextAtSize(sigLabel, 10)) / 2,
    y: bottomY + 4,
    size: 10,
    font: boldFont,
    color: DARK,
  });
  // Contact us
  fy = bottomY - 16;
  page.drawLine({
    start: { x: MARGIN, y: fy },
    end: { x: PAGE_WIDTH - MARGIN, y: fy },
    thickness: 0.5,
    color: LIGHT_GRAY,
  });
  fy -= 14;
  page.drawText(`Contact us: ${phone}`, {
    x: MARGIN,
    y: fy,
    size: 9,
    font: font,
    color: GRAY,
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

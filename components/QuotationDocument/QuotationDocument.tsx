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
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  degrees,
  rgb,
  StandardFonts,
} from "pdf-lib";

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

  /* Layout constants matching HTML print layout */
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

  /* --- HEADER (2-column: brand left, title right) --- */
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
      headerRightX + headerRightW - boldFont.widthOfTextAtSize("QUOTATION", 21),
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
    x: headerRightX + headerRightW - boldFont.widthOfTextAtSize(codeText, 15),
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

  /* --- Accent bar (1px #b7b7b7) --- */
  const leftColBottom = detailsY - detailLineH * 3;
  const rightColBottom = dateY - 14;
  const accentY = Math.min(leftColBottom, rightColBottom) - 17;
  page.drawLine({
    start: { x: MARGIN, y: accentY },
    end: { x: PAGE_WIDTH - MARGIN, y: accentY },
    thickness: 1,
    color: ACCENT_LINE,
  });

  /* --- BILL TO + FOR (1fr 1.55fr) --- */
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

  /* --- ITEMS TABLE --- */
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

  /* --- TOTALS (41% width, right-aligned, Georgia serif) --- */
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

  /* --- FOOTER --- */
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

import JsBarcode from "jsbarcode";
import type { Quotation, QuotationItem } from "../../types";
import {
  calcItemTotal,
  calcQuotationTotals,
  formatCurrency,
  formatDate,
  formatStampDate,
  generateBarcode,
  getSettings,
} from "../../lib/documentUtils";
import { paginateItems, formatAmount, ITEMS_PER_PAGE, ITEMS_PER_MIDDLE_PAGE } from "./documentHelpers";

const printStyles = `
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4 portrait;margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#101820;background:#fff}
.qt-page{width:210mm;min-height:297mm;padding:12mm 15mm 0 15mm;background:#fff url("/backgrounds/plain.jpg") center/cover no-repeat;position:relative;page-break-after:always;color:#101820;display:flex;flex-direction:column;row-gap:20px}
.qt-page:last-child{page-break-after:auto}
.qt-header{height:43mm;display:grid;grid-template-columns:1.2fr 0.8fr;gap:23px;align-items:start;background:url("/backgrounds/qt-header.png") center/cover no-repeat;border-bottom:#5e5e5e solid 1px}
.qt-brand{display:flex;flex-direction:column;align-items:flex-start}
.qt-logo-img{margin-left:90px;height:12mm;width:auto}
.qt-business-name{margin-top:10px;color:#164865;font-size:22px;font-weight:800;line-height:1.6;font-family:Arial,Helvetica,sans-serif}
.qt-business-details{color:#151515;font-family:Georgia,"Times New Roman",serif;font-size:12px;line-height:1.3}
.qt-business-details strong{font-weight:800;margin-right:5px}
.qt-business-details p{margin:0}
.qt-title-block{display:flex;flex-direction:column;align-items:flex-end;gap:5px}
.qt-title-block h1{height:11mm;width:62mm;color:#ffffff;font-size:14pt;font-weight:800;letter-spacing:0.03em;display:flex;align-items:center;justify-content:center}
.qt-barcode-img{width:205px;height:31px;margin-top:15px;display:block;margin-right:30px}
.qt-code-text{color:#164865;font-size:16px;margin-right:45px;font-weight:800}
.qt-date-text{color:#164865;font-size:14px;margin-right:45px}
.qt-date-text span{color:#111;margin-left:5px}
.qt-billto-for{height:25mm;display:grid;grid-template-columns:1fr 1.8fr;gap:20px;align-items:center;background-color:yellow}
.qt-billto-label{color:#121212;font-size:16px;font-weight:600}
.qt-billto-content{width:fit-content;font-family:Georgia,"Times New Roman",serif;font-size:10pt}
.qt-billto-content p{margin:0 0 2px}
.qt-for-section{height:19mm;display:grid;grid-template-columns:74px 1fr;background:#d4d4d4}
.qt-for-label{display:flex;align-items:center;padding:0 14px;background:#bdbdbd;color:#111;font-size:16px;font-weight:600}
.qt-for-text{display:flex;align-items:center;padding:0 16px;color:#111;font-size:10pt;font-family:Georgia,"Times New Roman",serif}
.qt-items-table{width:100%;border-collapse:collapse;table-layout:fixed;color:#1d1d1d;font-size:12px;background-color:#0095ff}
.qt-items-table th,.qt-items-table td{padding:3px 0}
.qt-items-table thead th{height:30px;background:#104b68;color:#fff;border-right:2px solid #fff;font-size:14px;font-weight:bold;text-align:center!important;padding:0!important}
.qt-items-table thead th:last-child{border-right:0}
.qt-items-table tbody td{border-bottom:1px solid #d7e5eb;font-family:Georgia,"Times New Roman",serif;font-size:11pt}
.qt-items-table tbody tr.evenRow td{background:#f0f6f3}
.qt-no-col{width:6%;text-align:center!important}
.qt-product-col{padding-left:10px!important}
.qt-unit-col{width:12%;text-align:center!important}
.qt-qty-col{width:10%;text-align:center!important}
.qt-price-col{width:13%;text-align:right!important;padding-right:10px!important}
.qt-total-col{width:17%;text-align:right!important;padding-right:10px!important}
.qt-totals{width:75mm;height:fit-content;border-collapse:collapse;border-spacing:0;table-layout:fixed;color:#111;font-family:Georgia,"Times New Roman",serif;font-size:13px;margin-left:105mm;background-color:#674dda}
.qt-totals td{padding:7px 15px;border-bottom:1px solid #bcbcbc;vertical-align:middle}
.qt-totals td:first-child{width:35mm;padding-left:12px;text-align:left;background-color:yellow}
.qt-totals td:last-child{padding-right:12px;text-align:right;white-space:nowrap;font-weight:400}
.qt-totals em{font-style:normal}
.qt-totals-row td{height:28px}
.qt-grand-total{background:#d5ebec;font-size:15px}
.qt-grand-total td{padding-top:10px;padding-bottom:10px;border-bottom:none}
.qt-grand-total td:first-child{font-weight:800}
.qt-grand-total td:last-child{font-weight:400}
.qt-footer{height:35mm;color:#111;background:url("/backgrounds/qt-footer.png") center/cover no-repeat;position:absolute;left:15mm;right:15mm;bottom:0;background-color:red}
.qt-page-last .qt-footer{position:static;left:auto;right:auto;bottom:auto}
.qt-stamp-sign{width:100%;height:27mm;display:flex;flex-direction:row;justify-content:space-between;align-items:center;color:#111;background-color:#4dda4d}
.qt-footer-notes{height:23mm;width:80mm;font-family:Georgia,"Times New Roman",serif;font-style:italic;line-height:1.2}
.qt-footer-notes strong{display:block;font-weight:bold;font-size:11pt;text-align:left;padding-bottom:4px}
.qt-footer-notes span{font-size:9pt}
.qt-signature-image{display:flex;align-items:flex-end;justify-content:flex-start;max-width:50mm;height:23mm;object-fit:contain;margin-right:60px}
.qt-signature-image img{max-width:100%;max-height:100%;object-fit:contain}
.qt-stamp{width:30mm;height:24mm;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;transform:rotate(-35deg);background-image:url("/digital-stamp.png");background-size:cover;background-position:center;background-repeat:no-repeat;padding-bottom:22px}
.qt-stamp-date{color:#000;font-size:9px}
.qt-footer-contact{color:#0095ff;font-family:Arial,Helvetica,sans-serif;font-size:10pt;font-weight:bold}
.qt-footer-contact span{color:#000;font-weight:normal;margin-left:5px}
.qt-footer-thankyou{color:#111;font-family:Georgia,"Times New Roman",serif;font-size:7.5pt;font-style:italic;line-height:1.2}
.qt-created-by{width:54mm;margin-right:60px;color:#fff;font-size:11pt;font-style:italic;font-family:"Times New Roman",Times,serif;text-align:center;margin-bottom:45px}

@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.qt-page{page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}.qt-page:last-child{page-break-after:auto}}
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
      height: 31,
      width: 1.35,
      margin: 0,
      background: "transparent",
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

  const buildItemsTable = (items: QuotationItem[], startIndex: number): string => {
    return `<table class="qt-items-table"><thead><tr>
      <th class="qt-no-col">No.</th><th>Description</th><th class="qt-unit-col">Size</th>
      <th class="qt-qty-col">Qty</th><th class="qt-price-col">Price</th><th class="qt-total-col">Total</th>
    </tr></thead><tbody>${items
      .map((item, i) => {
        const rowClass = i % 2 === 1 ? ' class="evenRow"' : "";
        return `<tr${rowClass}>
        <td class="qt-no-col">${startIndex + i + 1}</td>
        <td class="qt-product-col">${escapeHtml(item.productName)}</td>
        <td class="qt-unit-col">${escapeHtml(item.size || "-")}</td>
        <td class="qt-qty-col">${item.quantity} ${escapeHtml(item.unit || "")}</td>
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
  const buildTotals = () => `<table class="qt-totals"><tbody>
    <tr class="qt-totals-row"><td>Sub-Total</td><td>${formatCurrency(subtotal)}</td></tr>
    <tr class="qt-totals-row"><td>Tax <em>(${quotation.taxRate}%)</em></td><td>${formatCurrency(tax)}</td></tr>
    <tr class="qt-grand-total"><td>Grand Total</td><td>${formatCurrency(total)}</td></tr>
  </tbody></table>`;

  const stampHTML = `<div class="qt-stamp"><span class="qt-stamp-date">${escapeHtml(formatStampDate(quotation.createdAt))}</span></div>`;

  const sigHTML = signatureSrc
    ? `<div class="qt-signature-image"><img src="${escapeHtml(signatureSrc)}" alt="Signature" /></div>`
    : `<div class="qt-signature-image"></div>`;

  const stampSignHTML = `<div class="qt-stamp-sign">
    <div class="qt-footer-notes"><strong>Notes:</strong>${quotation.notes ? `<span>${escapeHtml(quotation.notes)}</span>` : ""}</div>
    ${stampHTML}
    ${sigHTML}
  </div>`;

  const buildFooter = () => `<footer class="qt-footer">
    <div class="qt-contact-thankyou">
      <div class="qt-footer-contact"><b>CONTACT US:</b> <span>${escapeHtml(phone)}</span></div>
      <span class="qt-footer-thankyou">Thank you for choosing Infield Innovations.<br>We deliver exceptional results with unmatched expertise and dedication.</span>
    </div>
    <div class="qt-created-by">By ${escapeHtml(quotation.createdBy || "")}</div>
  </footer>`;

  const headerFull = `<header class="qt-header">
    <div class="qt-brand">
      <img class="qt-logo-img" src="${escapeHtml(logo)}" alt="${escapeHtml(businessName)} logo" />
      <div class="qt-business-name">${escapeHtml(businessName)}</div>
      <div class="qt-business-details"><p>${escapeHtml(address)}</p><p><strong>Tel:</strong> ${escapeHtml(phone)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Website:</strong> ${escapeHtml(siteUrl)}</p></div>
    </div>
    <div class="qt-title-block">
      <h1>QUOTATION</h1>
      ${barcodeImg}
      <span class="qt-code-text">${escapeHtml(quotation.quotationCode || "")}</span>
      <span class="qt-date-text"><strong>Date: </strong><span>${escapeHtml(formatDate(quotation.createdAt))}</span></span>
    </div>
  </header>`;

  const billToFor = `<div class="qt-billto-for">
    <div class="qt-billto">
      <strong class="qt-billto-label">BILL TO:</strong>
      <div class="qt-billto-content">
        <p><b>${escapeHtml(quotation.customerName)}</b></p>
        ${quotation.customerAddress ? `<p>${escapeHtml(quotation.customerAddress)}</p>` : ""}
        <p>${escapeHtml(quotation.customerContact)}</p>
      </div>
    </div>
    <div class="qt-for-section">
      <strong class="qt-for-label">FOR:</strong>
      <span class="qt-for-text">${escapeHtml(quotation.quoteFor)}</span>
    </div>
  </div>`;

  return pages
    .map((pageItems, i) => {
      const isFirst = i === 0;
      const isLast = i === pages.length - 1;
      const pageClass = isLast ? "qt-page qt-page-last" : "qt-page";
      const lastContent = buildTotals() + stampSignHTML + buildFooter();
      const nonLastContent = buildFooter();
      const startIndex = isFirst ? 0 : ITEMS_PER_PAGE + (i - 1) * ITEMS_PER_MIDDLE_PAGE;
      return `<div class="${pageClass}">${headerFull}${isFirst ? billToFor : ""}${buildItemsTable(pageItems, startIndex)}${isLast ? lastContent : nonLastContent}</div>`;
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

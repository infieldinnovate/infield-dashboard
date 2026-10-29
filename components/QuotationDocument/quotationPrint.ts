// components\QuotationDocument\quotationPrint.ts

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
import { formatAmount } from "./documentHelpers";

const PX_PER_MM = 96 / 25.4;

const PAGE_GEOMETRY = {
  pageWidth: 210 * PX_PER_MM,
  pageHeight: 297 * PX_PER_MM,

  pagePaddingTop: 10 * PX_PER_MM,
  pagePaddingBottom: 35 * PX_PER_MM,
  pagePaddingLeft: 15 * PX_PER_MM,
  pagePaddingRight: 15 * PX_PER_MM,

  headerHeight: 45 * PX_PER_MM,
  billToForHeight: 35 * PX_PER_MM,
  tableHeaderHeight: 8 * PX_PER_MM,
} as const;

// Content width after the page's left and right padding.
const CONTENT_WIDTH =
  PAGE_GEOMETRY.pageWidth -
  PAGE_GEOMETRY.pagePaddingLeft -
  PAGE_GEOMETRY.pagePaddingRight;

// Content height after reserving the top and footer areas.
const PRINTABLE_HEIGHT =
  PAGE_GEOMETRY.pageHeight -
  PAGE_GEOMETRY.pagePaddingTop -
  PAGE_GEOMETRY.pagePaddingBottom;

const printStyles = `

/* =========================================================
   1. GLOBAL RESET & PRINT PAGE SETUP
   ========================================================= */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
@page {
  size: A4 portrait;
  margin: 0;
}
body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #101820;
  background: #fff;
}

/* =========================================================
   2. PAGE CONTAINER & PAGINATION
   ========================================================= */

.qt-page {
  width: 210mm;
  height: 297mm;
  overflow: hidden;
  padding: 10mm 15mm 35mm 15mm;
  background: #fff url("/backgrounds/plain.jpg") center/cover no-repeat;
  position: relative;
  page-break-after: always;
  color: #101820;
  display: flex;
  flex-direction: column;
}
.qt-page:last-child {
  page-break-after: auto;
}

/* =========================================================
   3. DOCUMENT HEADER
   ========================================================= */

/* Header layout and decorative background. */

.qt-header {
  height: 45mm;
  flex: 0 0 45mm;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 6mm;
  align-items: start;
  background: url("/backgrounds/qt-header.png") center/cover no-repeat;
  border-bottom: #5e5e5e solid 1mm;
}

/* ---------------------------------------------------------
   3A. Business Branding & Contact Details
   --------------------------------------------------------- */

.qt-brand {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 3mm;
}
.qt-logo-img {
  margin-left: 24mm;
  height: 12mm;
  width: auto;
}
.qt-business-name {
  color: #164865;
  font-size: 16pt;
  font-weight: 800;
  line-height: 1.6;
  font-family: Arial, Helvetica, sans-serif;
}
.qt-business-details {
  color: #151515;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 9pt;
  line-height: 1.4;
}
.qt-business-details strong {
  font-weight: 800;
  margin-right: 1mm;
}
.qt-business-details p {
  margin: 0;
}

/* ---------------------------------------------------------
   3B. Quotation Identification & Metadata
   --------------------------------------------------------- */

.qt-title-block {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 5mm;
}
.qt-title-block h1 {
  height: 11mm;
  width: 62mm;
  color: #ffffff;
  font-size: 14pt;
  font-weight: 800;
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qt-barcode-img {
  width: 54mm;
  height: 8mm;
  margin-top: 3mm;
  display: block;
  margin-right: 8mm;
}
.qt-code-text {
  color: #164865;
  font-size: 12pt;
  margin-right: 12mm;
  font-weight: 800;
}
.qt-date-text {
  color: #164865;
  font-size: 11pt;
  margin-right: 12mm;
}
.qt-date-text span {
  color: #111;
  margin-left: 1mm;
}

/* =========================================================
   4. CUSTOMER DETAILS & QUOTATION PURPOSE
   ========================================================= */

/* Customer and quotation-purpose columns. */

.qt-billto-for {
  height: 35mm;
  flex: 0 0 35mm;
  display: grid;
  grid-template-columns: 1fr 1.8fr;
  gap: 5mm;
  align-items: center;
  padding: 5mm 0;
}
.qt-billto-label {
  color: #121212;
  font-size: 12pt;
  font-weight: 600;
}

/* Customer name, address, and contact information. */

.qt-billto-content {
  width: fit-content;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 11pt;
}
.qt-billto-content p {
  margin: 0 0 1mm;
}

/* FOR: quotation-purpose container and label. */

.qt-for-section {
  height: 19mm;
  display: grid;
  grid-template-columns: 20mm 1fr;
  background: #d4d4d4;
}
.qt-for-label {
  display: flex;
  align-items: center;
  padding: 0 4mm;
  background: #bdbdbd;
  color: #111;
  font-size: 11pt;
  font-weight: 600;
}
.qt-for-text {
  display: flex;
  align-items: center;
  padding: 0 4mm;
  color: #111;
  font-size: 10pt;
  font-family: Georgia, "Times New Roman", serif;
}

/* =========================================================
   5. QUOTATION ITEMS TABLE
   ========================================================= */

/* Table container: prevents item rows from overflowing its area. */

.qt-items-wrapper {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}
.qt-items-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  color: #1d1d1d;
  font-size: 10pt;
}
  
.qt-items-table tr {
  padding: 0;
  margin: 0;
}

/* ---------------------------------------------------------
   5A. Table Header Row
   --------------------------------------------------------- */

.qt-items-table thead th {
  height: 8mm;
  flex-shrink: 0;
  background: #104b68;
  color: #fff;
  border-right: 1mm solid #fff;
  font-size: 12pt;
  font-weight: bold;
  text-align: center !important;
  padding: 0;
  margin: 0;
}
.qt-items-table thead th:last-child {
  border-right: 0;
}

/* ---------------------------------------------------------
   5B. Table Body & Item Rows
   --------------------------------------------------------- */

.qt-items-table tbody td {
  border-bottom: 3px solid #d7e5eb;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 15px;
  line-height: 29px;
  padding: 0;
  margin: 0;
}

/* Alternating background for even-numbered item rows. */
.qt-items-table tbody tr.evenRow td {
  background: #f0f6f3;
}

/* ---------------------------------------------------------
   5C. Item Table Column Layout
   --------------------------------------------------------- */

.qt-no-col {
  width: 6%;
  text-align: center !important;
}
.qt-product-col {
  padding-left: 3mm !important;
}
.qt-unit-col {
  width: 12%;
  text-align: center !important;
}
.qt-qty-col {
  width: 10%;
  text-align: center !important;
}
.qt-price-col {
  width: 13%;
  text-align: right !important;
  padding-right: 3mm !important;
}
.qt-total-col {
  width: 17%;
  text-align: right !important;
  padding-right: 3mm !important;
}

/* =========================================================
   6. CLOSING SECTION: NOTES & FINANCIAL TOTALS
   ========================================================= */

/* Side-by-side layout for notes and the totals table. */
.qt-totals-notes-section {
  width: 100%;
  height: 40mm;
  flex: 0 0 40mm;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

/* ---------------------------------------------------------
   6A. Quotation Notes
   --------------------------------------------------------- */

.qt-notes {
  height: fit-content;
  max-height: 30mm;
  width: 80mm;
  font-family: Georgia, "Times New Roman", serif;
  font-style: italic;
  line-height: 1.2;
  overflow: hidden;
}
.qt-notes strong {
  display: block;
  font-weight: bold;
  font-size: 11pt;
  text-align: left;
  padding-bottom: 1mm;
}
.qt-notes span {
  font-size: 9pt;
}

/* ---------------------------------------------------------
   6B. Financial Totals
   --------------------------------------------------------- */

.qt-totals {
  width: 75mm;
  height: fit-content;
  flex-shrink: 0;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  color: #111;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 11pt;
}
.qt-totals td {
  padding: 2mm 4mm;
  border-bottom: 1mm solid #bcbcbc;
  vertical-align: middle;
}
.qt-totals td:first-child {
  width: 35mm;
  padding-left: 3mm;
  text-align: left;
}
.qt-totals td:last-child {
  padding-right: 3mm;
  text-align: right;
  white-space: nowrap;
  font-weight: 400;
}
.qt-totals em {
  font-style: normal;
}
.qt-totals-row td {
  height: 7mm;
}
.qt-grand-total {
  background: #d5ebec;
  font-size: 12pt;
}
.qt-grand-total td {
  padding-top: 3mm;
  padding-bottom: 3mm;
  border-bottom: none;
}
.qt-grand-total td:first-child {
  font-weight: 800;
}
.qt-grand-total td:last-child {
  font-weight: 400;
}

/* =========================================================
   7. DIGITAL SIGNATURE & STAMP
   ========================================================= */

/* Overall authorization section. */
.qt-stamp-sign {
  width: 100%;
  height: 35mm;
  flex: 0 0 35mm;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  color: #111;
  padding: 0 17mm;
  overflow: hidden;
}

/* ---------------------------------------------------------
   7A. Digital Signature Label
   --------------------------------------------------------- */

.qt-stamp-sign-label {
  width: 40mm;
  height: 27mm;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  font-family: "Times New Roman", Times, serif;
  font-style: italic;
  font-weight: bold;
  position: relative;
  box-sizing: border-box;
  border-right: 1px solid #000; /* Thin outer line */
}

.qt-stamp-sign-label::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  right: 3px;
  border-right: 3px solid #000; /* Thick inner line */
  pointer-events: none;
}

/* ---------------------------------------------------------
   7B. Signature Image
   --------------------------------------------------------- */

.qt-signature-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50mm;
  max-width: 50mm;
  height: 20mm;
  object-fit: contain;
}
.qt-signature-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* ---------------------------------------------------------
   7C. Digital Stamp & Stamp Date
   --------------------------------------------------------- */

.qt-stamp {
  width: 30mm;
  height: 25mm;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: rotate(-35deg);
}

.qt-stamp img {
  width: 30mm;
  height: 25mm;
}

.qt-stamp-date {
  position: absolute;
  bottom: 6mm;
  color: #000;
  font-size: 5.2pt;

}

/* =========================================================
   8. PAGE FOOTER
   ========================================================= */

.qt-footer {
  height: 35mm;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: url("/backgrounds/qt-footer.png") center / cover no-repeat;
  color: #111;
  position: absolute;
  left: 15mm;
  right: 15mm;
  bottom: 0;
}

/* ---------------------------------------------------------
   8A. Contact & Thank-You Container
   --------------------------------------------------------- */

.qt-contact-thankyou {
  height: 28mm;
  width: 90mm;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 7mm;
  padding-top: 3mm;
}

/* ---------------------------------------------------------
   8B. Contact Information
   --------------------------------------------------------- */

.qt-footer-contact {
  color: #0095ff;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10pt;
  font-weight: bold;
}

.qt-footer-contact span {
  color: #000;
  font-weight: normal;
  font-size: 9pt;
  margin-left: 5mm;
}

/* ---------------------------------------------------------
   8C. Thank-You Message
   --------------------------------------------------------- */

.qt-footer-thankyou {
  color: #111;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 8pt;
  font-style: italic;
  line-height: 1.2;
}

/* ---------------------------------------------------------
   8D. Quotation Creator
   --------------------------------------------------------- */

.qt-created-by {
  width: 54mm;
  margin-right: 16mm;
  color: #fff;
  font-size: 11pt;
  font-style: italic;
  font-family: "Times New Roman", Times, serif;
  text-align: center;
  margin-bottom: 12mm;
}

/* =========================================================
   9. PRINT-ONLY OVERRIDES
   ========================================================= */

@media print {
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .qt-page {
    page-break-after: always;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .qt-page:last-child {
    page-break-after: auto;
  }
}
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

function measureElementHeight(html: string, styles: string): number {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${CONTENT_WIDTH}px`;
  container.style.visibility = "hidden";
  container.style.pointerEvents = "none";
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  container.appendChild(styleEl);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  container.appendChild(wrapper);
  document.body.appendChild(container);
  const height = wrapper.getBoundingClientRect().height;
  document.body.removeChild(container);
  return height;
}

function measureTableHeaderHeight(styles: string): number {
  const tableHTML = `<table class="qt-items-table"><thead><tr>
    <th class="qt-no-col">No.</th><th>Description</th><th class="qt-unit-col">Size</th>
    <th class="qt-qty-col">Qty</th><th class="qt-price-col">Price</th><th class="qt-total-col">Total</th>
  </tr></thead></table>`;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${CONTENT_WIDTH}px`;
  container.style.visibility = "hidden";
  container.style.pointerEvents = "none";
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  container.appendChild(styleEl);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = tableHTML;
  container.appendChild(wrapper);
  document.body.appendChild(container);

  const headerRow = wrapper.querySelector<HTMLTableRowElement>(
    ".qt-items-table thead tr",
  );
  const height =
    headerRow?.getBoundingClientRect().height ??
    PAGE_GEOMETRY.tableHeaderHeight;
  document.body.removeChild(container);
  return height;
}

function measureItemRowHeights(
  items: QuotationItem[],
  startIndex: number,
  styles: string,
): number[] {
  if (items.length === 0) return [];
  const rowsHTML = items
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
    .join("");
  const tableHTML = `<table class="qt-items-table"><thead><tr>
    <th class="qt-no-col">No.</th><th>Description</th><th class="qt-unit-col">Size</th>
    <th class="qt-qty-col">Qty</th><th class="qt-price-col">Price</th><th class="qt-total-col">Total</th>
  </tr></thead><tbody>${rowsHTML}</tbody></table>`;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${CONTENT_WIDTH}px`;
  container.style.visibility = "hidden";
  container.style.pointerEvents = "none";
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  container.appendChild(styleEl);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = tableHTML;
  container.appendChild(wrapper);
  document.body.appendChild(container);
  const tbodyRows = wrapper.querySelectorAll<HTMLTableRowElement>(
    "table.qt-items-table tbody tr",
  );
  const heights = Array.from(
    tbodyRows,
    (tr) => tr.getBoundingClientRect().height,
  );
  document.body.removeChild(container);
  return heights;
}

function measureClosingSection(
  totalsHTML: string,
  stampSignHTML: string,
  styles: string,
): number {
  const sectionHTML = `<div style="display:flex;flex-direction:column;width:${CONTENT_WIDTH}px">${totalsHTML}${stampSignHTML}</div>`;
  return measureElementHeight(sectionHTML, styles);
}

function paginateItemsByHeight(
  items: QuotationItem[],
  closingSectionHeight: number,
): QuotationItem[][] {
  const rowHeights = measureItemRowHeights(items, 0, printStyles);
  const tableHeaderHeight = measureTableHeaderHeight(printStyles);

  const firstPageAvail =
    PRINTABLE_HEIGHT -
    PAGE_GEOMETRY.headerHeight -
    PAGE_GEOMETRY.billToForHeight -
    tableHeaderHeight;
  const middlePageAvail =
    PRINTABLE_HEIGHT - PAGE_GEOMETRY.headerHeight - tableHeaderHeight;
  const lastPageAvail =
    PRINTABLE_HEIGHT -
    PAGE_GEOMETRY.headerHeight -
    tableHeaderHeight -
    closingSectionHeight;
  const singlePageAvail = firstPageAvail - closingSectionHeight;
  const tolerance = 0.75; // Allow tiny fractional-pixel measurement differences.

  if (
    closingSectionHeight >
    PRINTABLE_HEIGHT -
      PAGE_GEOMETRY.headerHeight -
      tableHeaderHeight +
      tolerance
  ) {
    throw new Error(
      "The quotation totals and signature sections are too tall to fit on a page. Reduce their content or adjust the closing-section layout.",
    );
  }

  const tallestAllowedRow = Math.max(
    firstPageAvail,
    middlePageAvail,
    lastPageAvail,
  );
  const oversizedIndex = rowHeights.findIndex(
    (height) => height > tallestAllowedRow + tolerance,
  );
  if (oversizedIndex !== -1) {
    throw new Error(
      `Quotation item ${oversizedIndex + 1} is too tall to fit on a page. Shorten its description or reduce its rendered height before printing.`,
    );
  }

  type PackResult =
    | { ok: true; pages: QuotationItem[][] }
    | { ok: false; reason: "needs-more-pages" | "oversized-row" };

  // Try each possible final-page index from smallest to largest. Pages before
  // the final page get their full row capacity; only the final page reserves
  // space for totals and signatures. This also permits a closing-only final
  // page when doing so lets the preceding item page use its full capacity.
  const pack = (lastPageIndex: number): PackResult => {
    if (lastPageIndex === 0 && singlePageAvail < -tolerance) {
      return { ok: false, reason: "needs-more-pages" };
    }

    const pages: QuotationItem[][] = [];
    let current: QuotationItem[] = [];
    let used = 0;
    let pageIndex = 0;

    const capacityFor = (index: number): number => {
      if (index === 0) {
        return lastPageIndex === 0 ? singlePageAvail : firstPageAvail;
      }
      return index === lastPageIndex ? lastPageAvail : middlePageAvail;
    };

    const advancePage = (): void => {
      pages.push(current);
      current = [];
      used = 0;
      pageIndex = pages.length;
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const height = rowHeights[i];

      if (height > middlePageAvail + tolerance) {
        return { ok: false, reason: "oversized-row" };
      }

      let capacity = capacityFor(pageIndex);
      if (used + height > capacity + tolerance) {
        advancePage();
        if (pageIndex > lastPageIndex) {
          return { ok: false, reason: "needs-more-pages" };
        }
        capacity = capacityFor(pageIndex);

        // If a row cannot fit on an empty first/final page, move the empty
        // page forward. A final-page miss invalidates this candidate so the
        // next candidate can turn that page into a full-capacity middle page.
        while (height > capacity + tolerance && pageIndex < lastPageIndex) {
          advancePage();
          capacity = capacityFor(pageIndex);
        }

        if (height > capacity + tolerance) {
          return { ok: false, reason: "needs-more-pages" };
        }
      }

      current.push(item);
      used += height;
    }

    // Always materialize the candidate final page, even if it contains no
    // items, so the closing sections have a page of their own when required.
    pages.push(current);
    if (pages.length > lastPageIndex + 1) {
      return { ok: false, reason: "needs-more-pages" };
    }
    while (pages.length < lastPageIndex + 1) pages.push([]);
    return { ok: true, pages };
  };

  // In the worst case each item needs its own middle page, plus a blank first
  // page for an unusually tall first row and a final page for the closing
  // sections. Every row must fit on a full-capacity page or we fail visibly.
  const maxLastPageIndex = items.length + 1;
  for (
    let lastPageIndex = 0;
    lastPageIndex <= maxLastPageIndex;
    lastPageIndex++
  ) {
    const result = pack(lastPageIndex);
    if (result.ok === true) return result.pages;
    if (result.ok === false && result.reason === "oversized-row") {
      throw new Error(
        "At least one quotation item is taller than the available item area. Shorten its description or adjust the row layout before printing.",
      );
    }
  }

  throw new Error(
    "Unable to paginate this quotation without clipping content. Reduce unusually tall item descriptions or adjust the page layout.",
  );
}

async function buildQuotationHTML(quotation: Quotation): Promise<string> {
  const settings = getSettings();
  const { businessName, address, phone, email, website, logo } =
    settings.business;
  const siteUrl = website || "www.infield.co.ke";
  const signatureSrc =
    quotation.createdBySignature || settings.business.signature;
  const stampSrc = settings.business.stamp;
  const barcodeValue = generateBarcode(
    quotation.userId,
    quotation.quotationCode,
  );
  const barcodeDataUrl = generateBarcodeDataUrl(barcodeValue);
  const barcodeImg = barcodeDataUrl
    ? `<img src="${barcodeDataUrl}" alt="Barcode" class="qt-barcode-img" />`
    : "";

  const buildItemsTable = (
    items: QuotationItem[],
    startIndex: number,
  ): string => {
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
  const buildTotals = () => `<div class="qt-totals-notes-section">
    <div class="qt-notes"><strong>Notes:</strong>${quotation.notes ? `<span>${escapeHtml(quotation.notes)}</span>` : ""}</div>
    <table class="qt-totals"><tbody>
    <tr class="qt-totals-row"><td>Sub-Total</td><td>${formatCurrency(subtotal)}</td></tr>
    <tr class="qt-totals-row"><td>Tax <em>(${quotation.taxRate}%)</em></td><td>${formatCurrency(tax)}</td></tr>
    <tr class="qt-grand-total"><td>Grand Total</td><td>${formatCurrency(total)}</td></tr>
  </tbody></table></div>`;

  const stampHTML = stampSrc
    ? `<div class="qt-stamp">
    <img src="${escapeHtml(stampSrc)}" alt="Stamp" />
  <span class="qt-stamp-date">${escapeHtml(formatStampDate(quotation.createdAt))}</span>
    </div>`
    : `<div class="qt-stamp"></div>`;

  const signHTML = signatureSrc
    ? `<div class="qt-signature-image"><img src="${escapeHtml(signatureSrc)}" alt="Signature" /></div>`
    : `<div class="qt-signature-image"></div>`;

  const stampSignHTML = `<div class="qt-stamp-sign">
    <div class="qt-stamp-sign-label"> Digitally Signed: </div>
    ${stampHTML}
    ${signHTML}
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

  const totalsHTML = buildTotals();
  const footerHTML = buildFooter();
  const closingSectionHeight = measureClosingSection(
    totalsHTML,
    stampSignHTML,
    printStyles,
  );
  const pages = paginateItemsByHeight(quotation.items, closingSectionHeight);

  let runningStart = 0;
  return pages
    .map((pageItems, i) => {
      const isFirst = i === 0;
      const isLast = i === pages.length - 1;
      const pageClass = "qt-page";
      const lastContent = totalsHTML + stampSignHTML + footerHTML;
      const nonLastContent = footerHTML;
      const startIndex = runningStart;
      runningStart += pageItems.length;
      return `<div class="${pageClass}">${headerFull}${isFirst ? billToFor : ""}<div class="qt-items-wrapper">${buildItemsTable(pageItems, startIndex)}</div>${isLast ? lastContent : nonLastContent}</div>`;
    })
    .join("");
}

function validateRenderedQuotation(doc: Document): string[] {
  const problems: string[] = [];
  const tolerance = 1.25;
  const pages = Array.from(doc.querySelectorAll<HTMLElement>(".qt-page"));

  if (pages.length === 0) return ["No quotation pages were generated."];

  pages.forEach((page, index) => {
    const pageNumber = index + 1;
    const header = page.querySelector<HTMLElement>(".qt-header");
    const footer = page.querySelector<HTMLElement>(".qt-footer");
    const itemsWrapper = page.querySelector<HTMLElement>(".qt-items-wrapper");
    const itemsTable = page.querySelector<HTMLElement>(".qt-items-table");
    const billToFor = page.querySelector<HTMLElement>(".qt-billto-for");
    const totalsSection = page.querySelector<HTMLElement>(
      ".qt-totals-notes-section",
    );
    const signature = page.querySelector<HTMLElement>(".qt-stamp-sign");

    if (!header || !footer || !itemsWrapper || !itemsTable) {
      problems.push(
        `Page ${pageNumber} is missing a required header, footer, or items table.`,
      );
      return;
    }

    if (header.scrollHeight > header.clientHeight + tolerance) {
      problems.push(
        `Page ${pageNumber}: header content exceeds its allocated height.`,
      );
    }
    const brand = header.querySelector<HTMLElement>(".qt-brand");
    const titleBlock = header.querySelector<HTMLElement>(".qt-title-block");
    if (brand && brand.scrollHeight > brand.clientHeight + tolerance) {
      problems.push(
        `Page ${pageNumber}: business details overflow the header.`,
      );
    }
    if (
      titleBlock &&
      titleBlock.scrollHeight > titleBlock.clientHeight + tolerance
    ) {
      problems.push(
        `Page ${pageNumber}: quotation metadata overflows the header.`,
      );
    }
    if (
      billToFor &&
      billToFor.scrollHeight > billToFor.clientHeight + tolerance
    ) {
      problems.push(
        `Page ${pageNumber}: customer or quotation-purpose text exceeds its allocated height.`,
      );
    }

    const wrapperRect = itemsWrapper.getBoundingClientRect();
    const tableRect = itemsTable.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    const isLastPage = index === pages.length - 1;

    if (
      isLastPage !== Boolean(totalsSection) ||
      isLastPage !== Boolean(signature)
    ) {
      problems.push(
        `Page ${pageNumber}: totals and signature sections must appear together on the final page only.`,
      );
    }

    if (
      Math.abs(footerRect.height - 35 * PX_PER_MM) > tolerance ||
      Math.abs(footerRect.bottom - pageRect.bottom) > tolerance ||
      Math.abs(footerRect.top - (pageRect.bottom - 35 * PX_PER_MM)) > tolerance
    ) {
      problems.push(
        `Page ${pageNumber}: the footer is not aligned within its reserved 35 mm page area.`,
      );
    }
    if (tableRect.bottom > wrapperRect.bottom + tolerance) {
      problems.push(
        `Page ${pageNumber}: item rows exceed the available table area and would be clipped.`,
      );
    }
    if (wrapperRect.bottom > footerRect.top + tolerance) {
      problems.push(
        `Page ${pageNumber}: the items area overlaps the reserved footer region.`,
      );
    }

    if (
      totalsSection &&
      totalsSection.getBoundingClientRect().bottom > footerRect.top + tolerance
    ) {
      problems.push(
        `Page ${pageNumber}: the totals section overlaps the reserved footer region.`,
      );
    }

    const notes = page.querySelector<HTMLElement>(".qt-notes");
    if (notes && notes.scrollHeight > notes.clientHeight + tolerance) {
      problems.push(
        `Page ${pageNumber}: quotation notes exceed the space available in the closing section.`,
      );
    }

    if (
      signature &&
      signature.getBoundingClientRect().bottom > footerRect.top + tolerance
    ) {
      problems.push(
        `Page ${pageNumber}: the signature section overlaps the reserved footer region.`,
      );
    }
    // const stamp = page.querySelector<HTMLElement>(".qt-stamp");
    // if (
    //   stamp &&
    //   stamp.getBoundingClientRect().bottom > footerRect.top + tolerance
    // ) {
    //   problems.push(
    //     `Page ${pageNumber}: the rotated stamp extends into the footer region.`,
    //   );
    // }

    if (footerRect.bottom > pageRect.bottom + tolerance) {
      problems.push(
        `Page ${pageNumber}: the footer extends beyond the page boundary.`,
      );
    }
  });

  return [...new Set(problems)];
}

const READINESS_TIMEOUT_MS = 5000;

async function waitForReadyState(doc: Document): Promise<void> {
  if (doc.readyState === "complete") return;
  await Promise.race([
    new Promise<void>((resolve) => {
      const check = () => {
        if (doc.readyState === "complete") {
          doc.removeEventListener("readystatechange", check);
          resolve();
        }
      };
      doc.addEventListener("readystatechange", check);
      check();
    }),
    new Promise<void>((resolve) => setTimeout(resolve, READINESS_TIMEOUT_MS)),
  ]);
}

async function waitForFonts(doc: Document): Promise<void> {
  const fonts = (doc as unknown as { fonts?: { ready: Promise<unknown> } })
    .fonts;
  if (!fonts || !fonts.ready) return;
  await Promise.race([
    fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, READINESS_TIMEOUT_MS)),
  ]);
}

async function waitForImages(doc: Document): Promise<void> {
  const imgs = Array.from(doc.querySelectorAll<HTMLImageElement>("img"));
  if (imgs.length === 0) return;
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return Promise.race([
        new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
        new Promise<void>((resolve) =>
          setTimeout(resolve, READINESS_TIMEOUT_MS),
        ),
      ]);
    }),
  );
}

export async function printQuotation(quotation: Quotation): Promise<void> {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.alert(
      "The quotation window was blocked. Allow pop-ups and try printing again.",
    );
    return;
  }

  try {
    // Open a clean print document so the final quotation is isolated from app styles.
    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>Quotation ${escapeHtml(quotation.quotationCode || quotation.id)}</title><style>${printStyles}</style></head><body></body></html>`,
    );
    printWindow.document.close();

    await waitForReadyState(printWindow.document);
    await waitForFonts(printWindow.document);

    const bodyHTML = await buildQuotationHTML(quotation);

    printWindow.document.open();
    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>Quotation ${escapeHtml(quotation.quotationCode || quotation.id)}</title><style>${printStyles}</style></head><body>${bodyHTML}</body></html>`,
    );
    printWindow.document.close();

    await waitForReadyState(printWindow.document);
    await waitForFonts(printWindow.document);
    await waitForImages(printWindow.document);

    const layoutProblems = validateRenderedQuotation(printWindow.document);
    if (layoutProblems.length > 0) {
      console.error(
        "Quotation print layout validation failed:",
        layoutProblems,
      );
      printWindow.close();
      window.alert(
        "The quotation was not printed because some content would be clipped or overlap the footer:\n\n" +
          layoutProblems
            .slice(0, 6)
            .map((problem) => `• ${problem}`)
            .join("\n") +
          (layoutProblems.length > 6
            ? `\n• And ${layoutProblems.length - 6} more issue(s).`
            : ""),
      );
      return;
    }

    printWindow.focus();
    printWindow.print();
  } catch (error) {
    console.error("Unable to print quotation:", error);
    printWindow.close();
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while preparing the quotation.";
    window.alert(`Unable to print quotation: ${message}`);
  }
}

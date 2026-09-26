'use client';

import React from 'react';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { Quotation, QuotationItem } from '../../types';
import {
  formatCurrency,
  formatDate,
  getSettings,
  statusLabels,
  statusColors,
  downloadPDF,
} from '../../lib/documentUtils';
import styles from './QuotationDocument.module.scss';

export interface QuotationDocumentActions {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const ITEMS_PER_PAGE = 12;
const ITEMS_PER_MIDDLE_PAGE = 18;

function paginateItems(items: QuotationItem[]): QuotationItem[][] {
  const pages: QuotationItem[][] = [];
  if (items.length <= ITEMS_PER_PAGE) {
    pages.push(items);
  } else {
    pages.push(items.slice(0, ITEMS_PER_PAGE));
    const remaining = items.slice(ITEMS_PER_PAGE);
    for (let i = 0; i < remaining.length; i += ITEMS_PER_MIDDLE_PAGE) {
      pages.push(remaining.slice(i, i + ITEMS_PER_MIDDLE_PAGE));
    }
  }
  return pages;
}

/* === Items Table === */
function ItemsTable({ items }: { items: QuotationItem[] }) {
  return (
    <table className={styles.itemsTable}>
      <thead>
        <tr>
          <th>Item</th>
          <th className={styles.centerCol}>Qty</th>
          <th className={styles.numCol}>Unit Price</th>
          <th className={styles.numCol}>Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i}>
            <td><span className={styles.itemName}>{item.productName}</span></td>
            <td className={styles.centerCol}>{item.quantity}</td>
            <td className={styles.numCol}>{formatCurrency(item.unitPrice)}</td>
            <td className={styles.numCol}>{formatCurrency(item.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* === Totals === */
function Totals({ quotation }: { quotation: Quotation }) {
  const discountLabel = quotation.discountType === 'percentage'
    ? `${quotation.discount}%`
    : formatCurrency(quotation.discount);

  return (
    <div className={styles.totals}>
      <div className={styles.totalsRow}>
        <span className={styles.totalsLabel}>Subtotal</span>
        <span className={styles.totalsValue}>{formatCurrency(quotation.subtotal)}</span>
      </div>
      {quotation.discount > 0 && (
        <div className={styles.totalsRow}>
          <span className={styles.totalsLabel}>Discount</span>
          <span className={styles.totalsValue}>-{discountLabel}</span>
        </div>
      )}
      {quotation.tax > 0 && (
        <div className={styles.totalsRow}>
          <span className={styles.totalsLabel}>Tax ({quotation.taxRate}%)</span>
          <span className={styles.totalsValue}>{formatCurrency(quotation.tax)}</span>
        </div>
      )}
      <div className={styles.totalsGrand}>
        <span>Grand Total</span>
        <span>{formatCurrency(quotation.total)}</span>
      </div>
    </div>
  );
}

/* === Full Header === */
function FullHeader({ quotation }: { quotation: Quotation }) {
  const settings = getSettings();
  const { businessName, address, phone, email } = settings.business;

  return (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.companyBlock}>
          <h2 className={styles.companyName}>{businessName}</h2>
          <p className={styles.companyAddr}>{address}</p>
          <p className={styles.companyContact}>{phone} | {email}</p>
        </div>
        <div className={styles.docTitleBlock}>
          <h1 className={styles.docTitle}>QUOTATION</h1>
          <p className={styles.docNumber}>{quotation.id.toUpperCase()}</p>
          <p className={styles.docDate}>{formatDate(quotation.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

/* === Customer Info === */
function CustomerInfo({ quotation }: { quotation: Quotation }) {
  return (
    <div className={styles.customerInfo}>
      <p className={styles.customerLabel}>Bill To</p>
      <p className={styles.customerName}>{quotation.customerName}</p>
    </div>
  );
}

/* === Metadata Box === */
function MetadataBox({ quotation }: { quotation: Quotation }) {
  return (
    <div className={styles.metadataBox}>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Quotation #</span>
        <span className={styles.metaValue}>{quotation.id.toUpperCase()}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Date</span>
        <span className={styles.metaValue}>{formatDate(quotation.createdAt)}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Valid Until</span>
        <span className={styles.metaValue}>{formatDate(quotation.validUntil)}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Status</span>
        <span className={styles.metaValue}>{statusLabels[quotation.status] || quotation.status}</span>
      </div>
    </div>
  );
}

/* === Notes === */
function Notes({ quotation }: { quotation: Quotation }) {
  if (!quotation.notes) return null;
  return (
    <div className={styles.notesSection}>
      <p className={styles.notesLabel}>Notes</p>
      <p className={styles.notesText}>{quotation.notes}</p>
    </div>
  );
}

/* === Signature === */
function Signature() {
  return (
    <div className={styles.signatureSection}>
      <div className={styles.signatureBlock}>
        <div className={styles.signatureLine} />
        <p className={styles.signatureLabel}>Customer Signature</p>
      </div>
      <div className={styles.signatureBlock}>
        <div className={styles.signatureLine} />
        <p className={styles.signatureLabel}>Authorized Signature</p>
      </div>
    </div>
  );
}

/* === Footer === */
function Footer() {
  const settings = getSettings();
  const { businessName, phone, email } = settings.business;
  const footerText = settings.print.footerText || 'Thank you for your business!';

  return (
    <div className={styles.footer}>
      <div className={styles.footerContact}>
        {businessName} | {phone} | {email}
      </div>
      <div className={styles.footerText}>{footerText}</div>
    </div>
  );
}

/* === Compact Header === */
function CompactHeader({ quotation }: { quotation: Quotation }) {
  const settings = getSettings();
  return (
    <div className={styles.compactHeader}>
      <div className={styles.compactCompany}>{settings.business.businessName}</div>
      <div className={styles.compactDocInfo}>
        <span className={styles.compactTitle}>QUOTATION</span>
        <span className={styles.compactNumber}>{quotation.id.toUpperCase()}</span>
      </div>
    </div>
  );
}

/* === Status Badge === */
function StatusBadge({ status }: { status: Quotation['status'] }) {
  const label = statusLabels[status] || status;
  const color = statusColors[status] || '#6b7280';
  return (
    <span className={styles.statusBadge} style={{ backgroundColor: color }}>
      {label}
    </span>
  );
}

/* === A4 Layout === */
function A4Layout({ quotation }: { quotation: Quotation }) {
  const pages = paginateItems(quotation.items);

  return (
    <div className={styles.a4Container}>
      {pages.map((pageItems, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;

        return (
          <div key={pageIndex} className={styles.a4Page}>
            {isFirst ? (
              <>
                <FullHeader quotation={quotation} />
                <CustomerInfo quotation={quotation} />
                <MetadataBox quotation={quotation} />
                <ItemsTable items={pageItems} />
                {isLast && <Totals quotation={quotation} />}
                {isLast && <Notes quotation={quotation} />}
                {isLast && <Signature />}
                <Footer />
              </>
            ) : (
              <>
                <CompactHeader quotation={quotation} />
                <ItemsTable items={pageItems} />
                {isLast && <Totals quotation={quotation} />}
                {isLast && <Signature />}
                {isLast && <Footer />}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* === Action Bar === */
function ActionBar({ quotation, actions }: { quotation: Quotation; actions: QuotationDocumentActions }) {
  return (
    <div className={styles.actionBar}>
      <button className={styles.actionBtn} onClick={() => printQuotation(quotation)}>
        Print A4
      </button>
      <button className={styles.actionBtn} onClick={() => downloadQuotationPDF(quotation)}>
        Download PDF
      </button>
      <button className={styles.actionBtn} onClick={actions.onEdit}>
        Edit
      </button>
      <button className={styles.actionBtn} onClick={actions.onDuplicate}>
        Duplicate
      </button>
      <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={actions.onDelete}>
        Delete
      </button>
    </div>
  );
}

/* === Main Component === */
interface QuotationDocumentProps {
  quotation: Quotation;
  actions: QuotationDocumentActions;
}

export default function QuotationDocument({ quotation, actions }: QuotationDocumentProps) {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewToolbar}>
        <div className={styles.previewStatus}>
          <StatusBadge status={quotation.status} />
        </div>
        <ActionBar quotation={quotation} actions={actions} />
      </div>
      <div className={styles.previewBody}>
        <A4Layout quotation={quotation} />
      </div>
    </div>
  );
}

/* === Print Function === */
const printStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: A4 portrait; margin: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; }
.qt-page { width: 210mm; min-height: 297mm; padding: 15mm; position: relative; page-break-after: always; }
.qt-page:last-child { page-break-after: auto; }
.qt-header { margin-bottom: 24px; }
.qt-header-top { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #1e3a5f; }
.qt-company { flex: 1; }
.qt-company-name { font-size: 20px; font-weight: 800; color: #1e3a5f; margin: 0; letter-spacing: -0.02em; }
.qt-company-addr { font-size: 10px; color: #555; margin: 4px 0 0; line-height: 1.4; }
.qt-company-contact { font-size: 10px; color: #555; margin: 2px 0 0; }
.qt-title-block { text-align: right; }
.qt-title { font-size: 32px; font-weight: 800; color: #1e3a5f; margin: 0; letter-spacing: 0.04em; line-height: 1; }
.qt-number { font-size: 12px; color: #555; margin: 6px 0 0; font-weight: 600; }
.qt-date { font-size: 10px; color: #777; margin: 2px 0 0; }
.qt-customer { margin-bottom: 20px; }
.qt-customer-label { font-size: 10px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; }
.qt-customer-name { font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0; }
.qt-metadata { display: flex; gap: 0; margin-bottom: 24px; border-left: 4px solid #1e3a5f; background: #f5f7fa; padding: 14px 18px; border-radius: 0 6px 6px 0; }
.qt-meta-item { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.qt-meta-item + .qt-meta-item { padding-left: 20px; border-left: 1px solid #d0dce6; }
.qt-meta-label { font-size: 9px; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.06em; }
.qt-meta-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }
.qt-items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
.qt-items-table thead th { background: #1e3a5f; color: #fff; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; text-align: left; }
.qt-items-table thead th.num { text-align: right; }
.qt-items-table thead th.center { text-align: center; }
.qt-items-table tbody tr { page-break-inside: avoid; }
.qt-items-table tbody td { padding: 9px 12px; font-size: 11px; border-bottom: 1px solid #e0e6ed; color: #333; }
.qt-items-table tbody td.num { text-align: right; }
.qt-items-table tbody td.center { text-align: center; }
.qt-items-table tbody tr:nth-child(even) { background: #f8fafc; }
.qt-item-name { font-weight: 600; color: #1a1a1a; }
.qt-totals { width: 280px; margin-left: auto; margin-bottom: 20px; }
.qt-totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; color: #555; }
.qt-totals-grand { border-top: 2px solid #1e3a5f; padding-top: 10px; margin-top: 6px; font-weight: 800; font-size: 14px; color: #1e3a5f; display: flex; justify-content: space-between; }
.qt-notes { margin-bottom: 20px; }
.qt-notes-label { font-size: 10px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; }
.qt-notes-text { font-size: 10px; color: #555; margin: 0; line-height: 1.6; }
.qt-signature { display: flex; justify-content: space-between; margin-top: 48px; margin-bottom: 20px; }
.qt-sig-block { width: 200px; }
.qt-sig-line { border-bottom: 1px solid #999; height: 40px; }
.qt-sig-label { font-size: 9px; color: #666; margin-top: 4px; text-align: center; }
.qt-footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; border-top: 1px solid #e0e6ed; padding-top: 8px; }
.qt-footer-contact { font-size: 9px; color: #999; }
.qt-footer-text { font-size: 9px; color: #999; margin-top: 2px; }
.qt-compact-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #1e3a5f; }
.qt-compact-company { font-size: 14px; font-weight: 700; color: #1e3a5f; }
.qt-compact-info { text-align: right; }
.qt-compact-title { font-size: 12px; color: #555; font-weight: 600; }
.qt-compact-number { font-size: 10px; color: #777; display: block; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildQuotationHTML(quotation: Quotation): string {
  const settings = getSettings();
  const { businessName, address, phone, email } = settings.business;
  const footerText = settings.print.footerText || 'Thank you for your business!';
  const pages = paginateItems(quotation.items);
  const discountLabel = quotation.discountType === 'percentage'
    ? `${quotation.discount}%`
    : formatCurrency(quotation.discount);

  const buildItemsTable = (items: QuotationItem[]): string => {
    return `<table class="qt-items-table">
      <thead><tr>
        <th>Item</th>
        <th class="center">Qty</th>
        <th class="num">Unit Price</th>
        <th class="num">Total</th>
      </tr></thead>
      <tbody>
        ${items.map((item) => `<tr>
          <td><span class="qt-item-name">${escapeHtml(item.productName)}</span></td>
          <td class="center">${item.quantity}</td>
          <td class="num">${formatCurrency(item.unitPrice)}</td>
          <td class="num">${formatCurrency(item.total)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  };

  const buildTotals = (): string => {
    return `<div class="qt-totals">
      <div class="qt-totals-row"><span>Subtotal</span><span>${formatCurrency(quotation.subtotal)}</span></div>
      ${quotation.discount > 0 ? `<div class="qt-totals-row"><span>Discount</span><span>-${discountLabel}</span></div>` : ''}
      ${quotation.tax > 0 ? `<div class="qt-totals-row"><span>Tax (${quotation.taxRate}%)</span><span>${formatCurrency(quotation.tax)}</span></div>` : ''}
      <div class="qt-totals-grand"><span>Grand Total</span><span>${formatCurrency(quotation.total)}</span></div>
    </div>`;
  };

  const buildNotes = (): string => {
    if (!quotation.notes) return '';
    return `<div class="qt-notes"><p class="qt-notes-label">Notes</p><p class="qt-notes-text">${escapeHtml(quotation.notes)}</p></div>`;
  };

  const buildSignature = (): string => {
    return `<div class="qt-signature">
      <div class="qt-sig-block"><div class="qt-sig-line"></div><p class="qt-sig-label">Customer Signature</p></div>
      <div class="qt-sig-block"><div class="qt-sig-line"></div><p class="qt-sig-label">Authorized Signature</p></div>
    </div>`;
  };

  const buildFooter = (): string => {
    return `<div class="qt-footer"><div class="qt-footer-contact">${escapeHtml(businessName)} | ${escapeHtml(phone)} | ${escapeHtml(email)}</div><div class="qt-footer-text">${escapeHtml(footerText)}</div></div>`;
  };

  const headerFull = `<div class="qt-header">
    <div class="qt-header-top">
      <div class="qt-company">
        <h2 class="qt-company-name">${escapeHtml(businessName)}</h2>
        <p class="qt-company-addr">${escapeHtml(address)}</p>
        <p class="qt-company-contact">${escapeHtml(phone)} | ${escapeHtml(email)}</p>
      </div>
      <div class="qt-title-block">
        <h1 class="qt-title">QUOTATION</h1>
        <p class="qt-number">${escapeHtml(quotation.id.toUpperCase())}</p>
        <p class="qt-date">${formatDate(quotation.createdAt)}</p>
      </div>
    </div>
  </div>`;

  const customerInfo = `<div class="qt-customer"><p class="qt-customer-label">Bill To</p><p class="qt-customer-name">${escapeHtml(quotation.customerName)}</p></div>`;

  const metadataBox = `<div class="qt-metadata">
    <div class="qt-meta-item"><span class="qt-meta-label">Quotation #</span><span class="qt-meta-value">${escapeHtml(quotation.id.toUpperCase())}</span></div>
    <div class="qt-meta-item"><span class="qt-meta-label">Date</span><span class="qt-meta-value">${formatDate(quotation.createdAt)}</span></div>
    <div class="qt-meta-item"><span class="qt-meta-label">Valid Until</span><span class="qt-meta-value">${formatDate(quotation.validUntil)}</span></div>
    <div class="qt-meta-item"><span class="qt-meta-label">Status</span><span class="qt-meta-value">${statusLabels[quotation.status] || quotation.status}</span></div>
  </div>`;

  const headerCompact = `<div class="qt-compact-header"><div class="qt-compact-company">${escapeHtml(businessName)}</div><div class="qt-compact-info"><span class="qt-compact-title">QUOTATION</span><span class="qt-compact-number">${escapeHtml(quotation.id.toUpperCase())}</span></div></div>`;

  return pages.map((pageItems, i) => {
    const isFirst = i === 0;
    const isLast = i === pages.length - 1;
    if (isFirst) {
      return `<div class="qt-page">${headerFull}${customerInfo}${metadataBox}${buildItemsTable(pageItems)}${isLast ? buildTotals() + buildNotes() + buildSignature() : ''}${buildFooter()}</div>`;
    }
    return `<div class="qt-page">${headerCompact}${buildItemsTable(pageItems)}${isLast ? buildTotals() + buildSignature() : ''}${isLast ? buildFooter() : `<div class="qt-footer"><div class="qt-footer-contact">${escapeHtml(businessName)} | ${escapeHtml(phone)} | ${escapeHtml(email)}</div></div>`}</div>`;
  }).join('');
}

export function printQuotation(quotation: Quotation): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Quotation ${quotation.id.toUpperCase()}</title><style>${printStyles}</style></head><body>${buildQuotationHTML(quotation)}</body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

/* === PDF Generation === */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const ACCENT = rgb(0.118, 0.227, 0.373);
const DARK = rgb(0.102, 0.102, 0.102);
const GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.95, 0.95, 0.95);
const META_BG = rgb(0.961, 0.969, 0.98);

export async function generateQuotationPDF(quotation: Quotation): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const settings = getSettings();
  const { businessName, address, phone, email } = settings.business;
  const footerText = settings.print.footerText || 'Thank you for your business!';

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = (): PDFPage => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    page.drawText(businessName, { x: MARGIN, y, size: 12, font: boldFont, color: ACCENT });
    page.drawText(`QUOTATION - ${quotation.id.toUpperCase()}`, { x: PAGE_WIDTH - MARGIN - 200, y, size: 10, font, color: GRAY });
    y -= 20;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 4 }, thickness: 1, color: ACCENT });
    y -= 10;
    return page;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 60) addPage();
  };

  const drawText = (text: string, x: number, size: number, f: PDFFont, color = DARK): number => {
    page.drawText(text, { x, y, size, font: f, color });
    return y - size - 4;
  };

  const drawWrappedText = (text: string, x: number, maxWidth: number, size: number, f: PDFFont, color = DARK): number => {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(testLine, size) > maxWidth) {
        y = drawText(line, x, size, f, color);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) y = drawText(line, x, size, f, color);
    return y;
  };

  // Full header
  page.drawText(businessName, { x: MARGIN, y, size: 18, font: boldFont, color: ACCENT });
  y -= 22;
  y = drawWrappedText(address, MARGIN, 250, 9, font, GRAY);
  y = drawText(`${phone} | ${email}`, MARGIN, 9, font, GRAY);
  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 2, color: ACCENT });
  y -= 16;

  const titleX = PAGE_WIDTH - MARGIN - 120;
  let titleY = PAGE_HEIGHT - MARGIN - 4;
  page.drawText('QUOTATION', { x: titleX, y: titleY, size: 24, font: boldFont, color: ACCENT });
  titleY -= 26;
  page.drawText(quotation.id.toUpperCase(), { x: titleX, y: titleY, size: 11, font, color: GRAY });
  titleY -= 14;
  page.drawText(formatDate(quotation.createdAt), { x: titleX, y: titleY, size: 9, font, color: GRAY });
  y = Math.min(y, titleY - 20);

  // Customer info
  page.drawText('BILL TO', { x: MARGIN, y, size: 9, font: boldFont, color: ACCENT });
  y -= 12;
  page.drawText(quotation.customerName, { x: MARGIN, y, size: 11, font: boldFont, color: DARK });
  y -= 16;

  // Metadata box
  page.drawRectangle({ x: MARGIN, y: y - 30, width: PAGE_WIDTH - MARGIN * 2, height: 34, color: META_BG });
  page.drawRectangle({ x: MARGIN, y: y - 30, width: 4, height: 34, color: ACCENT });

  const metaItems = [
    { label: 'Quotation #', value: quotation.id.toUpperCase() },
    { label: 'Date', value: formatDate(quotation.createdAt) },
    { label: 'Valid Until', value: formatDate(quotation.validUntil) },
    { label: 'Status', value: statusLabels[quotation.status] || quotation.status },
  ];
  const metaColW = (PAGE_WIDTH - MARGIN * 2 - 4) / metaItems.length;
  metaItems.forEach((m, i) => {
    const mx = MARGIN + 4 + i * metaColW + 10;
    page.drawText(m.label.toUpperCase(), { x: mx, y: y - 8, size: 8, font: boldFont, color: GRAY });
    page.drawText(m.value, { x: mx, y: y - 22, size: 10, font: font, color: DARK });
  });
  y -= 40;

  // Items table
  const cols = [
    { name: 'Item', x: MARGIN, w: 250 },
    { name: 'Qty', x: MARGIN + 260, w: 50 },
    { name: 'Unit Price', x: MARGIN + 320, w: 80 },
    { name: 'Total', x: MARGIN + 410, w: 80 },
  ];

  page.drawRectangle({ x: MARGIN, y: y - 16, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: ACCENT });
  for (const col of cols) {
    const alignRight = col.name === 'Unit Price' || col.name === 'Total';
    const alignCenter = col.name === 'Qty';
    let tx = col.x;
    if (alignRight) {
      tx = col.x + col.w - boldFont.widthOfTextAtSize(col.name, 9) - 2;
    } else if (alignCenter) {
      tx = col.x + col.w / 2 - boldFont.widthOfTextAtSize(col.name, 9) / 2;
    }
    page.drawText(col.name.toUpperCase(), { x: tx, y: y - 12, size: 9, font: boldFont, color: rgb(1, 1, 1) });
  }
  y -= 20;

  const allItems = quotation.items;
  const firstPageItems = allItems.slice(0, ITEMS_PER_PAGE);
  const remainingItems = allItems.slice(ITEMS_PER_PAGE);

  const drawItems = (items: QuotationItem[]) => {
    for (let i = 0; i < items.length; i++) {
      ensureSpace(26);
      const item = items[i];
      if (i % 2 === 0) {
        page.drawRectangle({ x: MARGIN, y: y - 12, width: PAGE_WIDTH - MARGIN * 2, height: 18, color: LIGHT_GRAY });
      }
      page.drawText(item.productName, { x: cols[0].x, y: y - 8, size: 9, font, color: DARK });
      page.drawText(String(item.quantity), { x: cols[1].x + cols[1].w / 2 - font.widthOfTextAtSize(String(item.quantity), 9) / 2, y: y - 8, size: 9, font, color: DARK });
      const priceStr = formatCurrency(item.unitPrice);
      page.drawText(priceStr, { x: cols[2].x + cols[2].w - font.widthOfTextAtSize(priceStr, 9) - 2, y: y - 8, size: 9, font, color: DARK });
      const totalStr = formatCurrency(item.total);
      page.drawText(totalStr, { x: cols[3].x + cols[3].w - font.widthOfTextAtSize(totalStr, 9) - 2, y: y - 8, size: 9, font, color: DARK });
      y -= 18;
    }
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: GRAY });
    y -= 16;
  };

  drawItems(firstPageItems);

  for (let i = 0; i < remainingItems.length; i += ITEMS_PER_MIDDLE_PAGE) {
    addPage();
    drawItems(remainingItems.slice(i, i + ITEMS_PER_MIDDLE_PAGE));
  }

  // Totals
  ensureSpace(80);
  const labelX = PAGE_WIDTH - MARGIN - 160;
  const valueX = PAGE_WIDTH - MARGIN;

  page.drawText('Subtotal', { x: labelX, y, size: 9, font, color: GRAY });
  page.drawText(formatCurrency(quotation.subtotal), { x: valueX - font.widthOfTextAtSize(formatCurrency(quotation.subtotal), 9), y, size: 9, font, color: DARK });
  y -= 16;

  if (quotation.discount > 0) {
    const discStr = quotation.discountType === 'percentage' ? `${quotation.discount}%` : formatCurrency(quotation.discount);
    page.drawText('Discount', { x: labelX, y, size: 9, font, color: GRAY });
    page.drawText(`-${discStr}`, { x: valueX - font.widthOfTextAtSize(`-${discStr}`, 9), y, size: 9, font, color: DARK });
    y -= 16;
  }

  if (quotation.tax > 0) {
    page.drawText(`Tax (${quotation.taxRate}%)`, { x: labelX, y, size: 9, font, color: GRAY });
    page.drawText(formatCurrency(quotation.tax), { x: valueX - font.widthOfTextAtSize(formatCurrency(quotation.tax), 9), y, size: 9, font, color: DARK });
    y -= 16;
  }

  page.drawLine({ start: { x: labelX, y: y + 4 }, end: { x: valueX, y: y + 4 }, thickness: 1.5, color: ACCENT });
  y -= 4;
  page.drawText('Grand Total', { x: labelX, y, size: 12, font: boldFont, color: ACCENT });
  const totalStr = formatCurrency(quotation.total);
  page.drawText(totalStr, { x: valueX - boldFont.widthOfTextAtSize(totalStr, 12), y, size: 12, font: boldFont, color: ACCENT });
  y -= 20;

  // Notes
  if (quotation.notes) {
    ensureSpace(30);
    page.drawText('NOTES', { x: MARGIN, y, size: 9, font: boldFont, color: ACCENT });
    y -= 12;
    y = drawWrappedText(quotation.notes, MARGIN, PAGE_WIDTH - MARGIN * 2, 9, font, GRAY);
    y -= 8;
  }

  // Signature
  ensureSpace(60);
  y -= 20;
  const sigW = 180;
  const sig1X = MARGIN;
  const sig2X = PAGE_WIDTH - MARGIN - sigW;
  page.drawLine({ start: { x: sig1X, y }, end: { x: sig1X + sigW, y }, thickness: 0.5, color: GRAY });
  page.drawLine({ start: { x: sig2X, y }, end: { x: sig2X + sigW, y }, thickness: 0.5, color: GRAY });
  page.drawText('Customer Signature', { x: sig1X, y: y - 12, size: 8, font, color: GRAY });
  page.drawText('Authorized Signature', { x: sig2X, y: y - 12, size: 8, font, color: GRAY });
  y -= 24;

  // Footer
  const footerY = MARGIN - 20;
  page.drawLine({ start: { x: MARGIN, y: footerY + 14 }, end: { x: PAGE_WIDTH - MARGIN, y: footerY + 14 }, thickness: 0.5, color: LIGHT_GRAY });
  page.drawText(`${businessName} | ${phone} | ${email}`, { x: MARGIN, y: footerY, size: 8, font, color: GRAY });
  page.drawText(footerText, { x: MARGIN, y: footerY - 12, size: 8, font, color: GRAY });

  return doc.save();
}

export async function downloadQuotationPDF(quotation: Quotation): Promise<void> {
  const bytes = await generateQuotationPDF(quotation);
  const filename = `Quotation_${quotation.id.toUpperCase()}.pdf`;
  downloadPDF(bytes, filename);
}

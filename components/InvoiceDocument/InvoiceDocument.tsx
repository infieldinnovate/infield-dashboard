'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { Invoice, InvoiceItem } from '../../types';
import {
  formatCurrency,
  formatDate,
  getSettings,
  statusLabels,
  statusColors,
  downloadPDF,
} from '../../lib/documentUtils';
import styles from './InvoiceDocument.module.scss';

export interface InvoiceDocumentActions {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const ITEMS_PER_PAGE = 12;
const ITEMS_PER_MIDDLE_PAGE = 18;

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function paginateItems(items: InvoiceItem[]): InvoiceItem[][] {
  const pages: InvoiceItem[][] = [];
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

function padToMinimum(rows: InvoiceItem[], min: number): InvoiceItem[] {
  const padded = [...rows];
  while (padded.length < min) {
    padded.push({
      productId: `blank-${padded.length}`,
      productName: '',
      description: '',
      quantity: 0,
      unitPrice: 0,
      total: 0,
    });
  }
  return padded;
}

/* === Items Table === */
function ItemsTable({ items, pad }: { items: InvoiceItem[]; pad?: boolean }) {
  const rows = pad ? padToMinimum(items, 4) : items;

  return (
    <table className={styles.itemsTable}>
      <thead>
        <tr>
          <th className={styles.noColumn}>No.</th>
          <th>Description</th>
          <th className={styles.sizeColumn}>Size</th>
          <th className={styles.qtyColumn}>Qty</th>
          <th className={styles.priceColumn}>Price</th>
          <th className={styles.totalColumn}>Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => {
          const isBlank = !item.productName;
          return (
            <tr key={item.productId}>
              <td className={styles.noColumn}>{isBlank ? '' : index + 1}</td>
              <td>{item.productName}</td>
              <td className={styles.sizeColumn}>{isBlank ? '' : '-'}</td>
              <td className={styles.qtyColumn}>{isBlank ? '' : `${item.quantity} Units`}</td>
              <td className={styles.priceColumn}>{isBlank ? '' : formatAmount(item.unitPrice)}</td>
              <td className={styles.totalColumn}>{isBlank ? '-' : formatAmount(item.total)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* === Totals === */
function Totals({ invoice }: { invoice: Invoice }) {
  return (
    <div className={styles.totals}>
      <div className={styles.totalsRow}>
        <span>Sub-Total</span>
        <strong>{formatCurrency(invoice.subtotal)}</strong>
      </div>
      <div className={styles.totalsRow}>
        <span>Labour</span>
        <strong>-</strong>
      </div>
      <div className={styles.totalsRow}>
        <span>Transportation</span>
        <strong>-</strong>
      </div>
      <div className={styles.totalsRow}>
        <span>Tax <em>({invoice.taxRate}%)</em></span>
        <strong>{formatCurrency(invoice.tax)}</strong>
      </div>
      <div className={styles.grandTotal}>
        <strong>Grand Total</strong>
        <span>{formatCurrency(invoice.total)}</span>
      </div>
    </div>
  );
}

/* === Branded Header === */
function BrandedHeader({ invoice }: { invoice: Invoice }) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const invoiceFor = invoice.items
    .filter((item) => item.productName)
    .map((item) => `${item.quantity} ${item.productName}`)
    .join(' and ');

  useEffect(() => {
    if (!barcodeRef.current) return;
    JsBarcode(barcodeRef.current, invoice.invoiceNumber, {
      format: 'CODE128',
      displayValue: false,
      height: 34,
      width: 1.35,
      margin: 0,
      background: 'transparent',
      lineColor: '#111111',
    });
  }, [invoice.invoiceNumber]);

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.brand}>
          <div className={styles.logo} aria-label={businessName}>
            <span className={styles.logoMark}>in</span>
            <span className={styles.logoName}>Field</span>
            <span className={styles.logoDrop} />
          </div>
          <div className={styles.businessName}>
            <strong>INFIELD</strong>
            <span>INNOVATIONS</span>
          </div>
          <div className={styles.brandRule} />
        </div>

        <div className={styles.titleBlock}>
          <h1>INVOICE</h1>
          <svg ref={barcodeRef} className={styles.barcode} aria-label={`Barcode for ${invoice.invoiceNumber}`} />
        </div>

        <div className={styles.contact}>
          <div className={styles.contactRow}>
            <strong>T.</strong>
            <span>{phone}</span>
          </div>
          <div className={styles.contactRow}>
            <strong>W.</strong>
            <span>{website || 'www.infield.co.ke'}</span>
          </div>
          <div className={styles.contactRow}>
            <strong>E.</strong>
            <span>{email}</span>
          </div>
          <address>{address}</address>
        </div>
      </div>

      <div className={styles.accentBar}>
        <span />
      </div>

      <div className={styles.invoiceFor}>
        <strong>INVOICE FOR:</strong>
        <span>{invoiceFor || invoice.customerName}</span>
      </div>
    </header>
  );
}

/* === Compact Header (multi-page) === */
function CompactHeader({ invoice }: { invoice: Invoice }) {
  const settings = getSettings();
  return (
    <div className={styles.compactHeader}>
      <div className={styles.compactCompany}>{settings.business.businessName}</div>
      <div className={styles.compactDocInfo}>
        <span className={styles.compactTitle}>INVOICE</span>
        <span className={styles.compactNumber}>{invoice.invoiceNumber}</span>
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

/* === Signature === */
function Signature() {
  return (
    <div className={styles.signature}>
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

/* === Status Badge === */
function StatusBadge({ status }: { status: Invoice['status'] }) {
  const label = statusLabels[status] || status;
  const color = statusColors[status] || '#6b7280';
  return (
    <span className={styles.statusBadge} style={{ backgroundColor: color }}>
      {label}
    </span>
  );
}

/* === A4 Layout === */
function A4Layout({ invoice }: { invoice: Invoice }) {
  const pages = paginateItems(invoice.items);

  return (
    <div className={styles.a4Container}>
      {pages.map((pageItems, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;

        return (
          <div key={pageIndex} className={styles.a4Page}>
            {isFirst ? (
              <>
                <BrandedHeader invoice={invoice} />
                <ItemsTable items={pageItems} pad />
                {isLast && <Totals invoice={invoice} />}
                {isLast && invoice.notes && (
                  <div className={styles.notes}>
                    <p className={styles.notesLabel}>Notes</p>
                    <p className={styles.notesText}>{invoice.notes}</p>
                  </div>
                )}
                {isLast && <Signature />}
                <Footer />
              </>
            ) : (
              <>
                <CompactHeader invoice={invoice} />
                <ItemsTable items={pageItems} />
                {isLast && <Totals invoice={invoice} />}
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
function ActionBar({ invoice, actions }: { invoice: Invoice; actions: InvoiceDocumentActions }) {
  return (
    <div className={styles.actionBar}>
      <button className={styles.actionBtn} onClick={() => printInvoice(invoice)}>
        Print A4
      </button>
      <button className={styles.actionBtn} onClick={() => downloadInvoicePDF(invoice)}>
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
interface InvoiceDocumentProps {
  invoice: Invoice;
  actions: InvoiceDocumentActions;
}

export default function InvoiceDocument({ invoice, actions }: InvoiceDocumentProps) {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewToolbar}>
        <div className={styles.previewStatus}>
          <StatusBadge status={invoice.status} />
        </div>
        <ActionBar invoice={invoice} actions={actions} />
      </div>
      <div className={styles.previewBody}>
        <A4Layout invoice={invoice} />
      </div>
    </div>
  );
}

/* === Print Function === */
const printStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: A4 portrait; margin: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; background: #fff; }
.inv-page { width: 210mm; min-height: 297mm; padding: 15mm; position: relative; page-break-after: always; }
.inv-page:last-child { page-break-after: auto; }
.inv-header { margin-bottom: 20px; overflow: hidden; background: #fff; color: #111; }
.inv-header-top { display: grid; grid-template-columns: 1.15fr 1fr 1fr; align-items: stretch; min-height: 132px; padding: 18px 28px 22px; gap: 24px; }
.inv-brand { display: flex; flex-direction: column; gap: 12px; }
.inv-logo { display: inline-flex; align-items: flex-end; gap: 2px; width: fit-content; color: #168ac0; font-size: 25px; font-style: italic; font-weight: 800; letter-spacing: -0.08em; line-height: 0.9; position: relative; padding: 0 8px 9px 4px; }
.inv-logo::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 7px; border-top: 3px solid #168ac0; border-radius: 50%; transform: skewX(-20deg); }
.inv-logo-mark { color: #168ac0; font-size: 24px; font-weight: 800; }
.inv-logo-name { font-size: 25px; font-weight: 800; color: #168ac0; }
.inv-logo-drop { width: 8px; height: 14px; border: 2px solid #168ac0; border-radius: 70% 30% 70% 30%; transform: rotate(35deg); align-self: flex-end; margin: 0 0 1px 3px; }
.inv-business-name { display: flex; flex-direction: column; font-size: 23px; line-height: 1; letter-spacing: 0.02em; }
.inv-business-name strong { font-weight: 800; color: #126542; }
.inv-business-name span { font-weight: 400; color: #111; }
.inv-brand-rule { height: 18px; width: 58%; background: #707070; margin-top: auto; }
.inv-title-block { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
.inv-title-block h1 { font-size: 30px; font-weight: 800; letter-spacing: 0.06em; color: #126542; margin: 0; line-height: 1; }
.inv-contact { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; border-left: 4px solid #111; padding: 8px 0 8px 20px; position: relative; }
.inv-contact::before { content: ''; position: absolute; top: -18px; right: -28px; width: 130px; height: 24px; background: #c9c9c9; }
.inv-contact-row { display: grid; grid-template-columns: 18px 1fr; align-items: baseline; gap: 8px; width: 100%; padding-bottom: 4px; border-bottom: 1px solid #c9c9c9; font-size: 11px; color: #111; }
.inv-contact-row strong { color: #126542; font-weight: 800; font-size: 14px; }
.inv-contact address { font-size: 11px; font-style: normal; color: #111; margin-top: 8px; line-height: 1.35; }
.inv-accent-bar { height: 8px; background: #35b875; display: flex; }
.inv-accent-bar span { width: 7%; background: #c9c9c9; }
.inv-for { display: grid; grid-template-columns: 252px 1fr; min-height: 56px; background: #e2e2e2; font-size: 16px; line-height: 1.25; }
.inv-for strong { display: flex; align-items: center; justify-content: flex-end; padding: 14px 28px; background: #86ad9c; color: #fff; font-size: 18px; }
.inv-for span { display: flex; align-items: center; padding: 12px 28px; color: #222; }
.inv-items-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 44px 0 0; color: #111; font-size: 12px; }
.inv-items-table th, .inv-items-table td { padding: 8px 12px; border-bottom: 1px solid #dce5e8; text-align: left; vertical-align: middle; }
.inv-items-table thead th { height: 34px; background: #36b976; color: #fff; font-size: 15px; font-weight: 800; border-right: 2px solid #fff; }
.inv-items-table thead th:nth-child(3), .inv-items-table thead th:nth-child(4) { background: #888b8b; }
.inv-items-table thead th:last-child { border-right: 0; }
.inv-items-table tbody td { height: 34px; font-family: Georgia, 'Times New Roman', serif; font-size: 13px; }
.inv-no-col { width: 8%; text-align: center; }
.inv-size-col { width: 9%; text-align: center; }
.inv-qty-col { width: 15%; text-align: center; }
.inv-price-col { width: 12%; text-align: right; }
.inv-total-col { width: 16%; text-align: right; }
.inv-totals { width: 52%; margin: 48px 0 24px auto; color: #111; font-family: Georgia, 'Times New Roman', serif; font-size: 13px; }
.inv-totals-row { display: grid; grid-template-columns: 1fr 0.7fr; min-height: 32px; align-items: center; border-bottom: 2px solid #d2d2d2; }
.inv-totals-row span { padding-left: 18px; }
.inv-totals-row strong { text-align: right; padding-right: 14px; font-weight: 400; }
.inv-totals-row em { margin-left: 24px; font-style: italic; }
.inv-grand-total { display: grid; grid-template-columns: 1.15fr 1fr; min-height: 42px; align-items: center; background: #b4ead6; font-size: 16px; }
.inv-grand-total strong { height: 100%; display: flex; align-items: center; padding-left: 18px; background: #36b976; color: #fff; font-size: 17px; }
.inv-grand-total span { text-align: right; padding-right: 14px; font-weight: 800; }
.inv-notes { margin-top: 24px; margin-bottom: 16px; }
.inv-notes-label { font-size: 10px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px; }
.inv-notes-text { font-size: 10px; color: #333; margin: 0; line-height: 1.5; }
.inv-footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; border-top: 1px solid #eee; padding-top: 8px; }
.inv-footer-contact { font-size: 9px; color: #999; }
.inv-footer-text { font-size: 9px; color: #999; margin-top: 2px; }
.inv-signature { display: flex; justify-content: space-between; margin-top: 40px; }
.inv-sig-block { width: 200px; }
.inv-sig-line { border-bottom: 1px solid #999; height: 40px; }
.inv-sig-label { font-size: 9px; color: #666; margin-top: 4px; text-align: center; }
.inv-compact-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e5e5; }
.inv-compact-company { font-size: 14px; font-weight: 700; color: #126542; }
.inv-compact-info { text-align: right; }
.inv-compact-title { font-size: 12px; color: #666; }
.inv-compact-number { font-size: 10px; color: #999; display: block; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildInvoiceHTML(invoice: Invoice): string {
  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const footerText = settings.print.footerText || 'Thank you for your business!';
  const pages = paginateItems(invoice.items);
  const invoiceFor = invoice.items
    .filter((item) => item.productName)
    .map((item) => `${item.quantity} ${item.productName}`)
    .join(' and ');

  const buildItemsTable = (items: InvoiceItem[], pad = false): string => {
    const rows = pad ? padToMinimum(items, 4) : items;
    return `<table class="inv-items-table">
      <thead><tr>
        <th class="inv-no-col">No.</th>
        <th>Description</th>
        <th class="inv-size-col">Size</th>
        <th class="inv-qty-col">Qty</th>
        <th class="inv-price-col">Price</th>
        <th class="inv-total-col">Total</th>
      </tr></thead>
      <tbody>
        ${rows.map((item, i) => {
          const isBlank = !item.productName;
          return `<tr>
            <td class="inv-no-col">${isBlank ? '' : i + 1}</td>
            <td>${escapeHtml(item.productName)}</td>
            <td class="inv-size-col">${isBlank ? '' : '-'}</td>
            <td class="inv-qty-col">${isBlank ? '' : item.quantity + ' Units'}</td>
            <td class="inv-price-col">${isBlank ? '' : formatAmount(item.unitPrice)}</td>
            <td class="inv-total-col">${isBlank ? '-' : formatAmount(item.total)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  };

  const buildTotals = (): string => {
    return `<div class="inv-totals">
      <div class="inv-totals-row"><span>Sub-Total</span><strong>${formatCurrency(invoice.subtotal)}</strong></div>
      <div class="inv-totals-row"><span>Labour</span><strong>-</strong></div>
      <div class="inv-totals-row"><span>Transportation</span><strong>-</strong></div>
      <div class="inv-totals-row"><span>Tax <em>(${invoice.taxRate}%)</em></span><strong>${formatCurrency(invoice.tax)}</strong></div>
      <div class="inv-grand-total"><strong>Grand Total</strong><span>${formatCurrency(invoice.total)}</span></div>
    </div>`;
  };

  const buildNotes = (): string => {
    if (!invoice.notes) return '';
    return `<div class="inv-notes">
      <p class="inv-notes-label">Notes</p>
      <p class="inv-notes-text">${escapeHtml(invoice.notes)}</p>
    </div>`;
  };

  const buildSignature = (): string => {
    return `<div class="inv-signature">
      <div class="inv-sig-block"><div class="inv-sig-line"></div><p class="inv-sig-label">Customer Signature</p></div>
      <div class="inv-sig-block"><div class="inv-sig-line"></div><p class="inv-sig-label">Authorized Signature</p></div>
    </div>`;
  };

  const buildFooter = (): string => {
    return `<div class="inv-footer">
      <div class="inv-footer-contact">${escapeHtml(businessName)} | ${escapeHtml(phone)} | ${escapeHtml(email)}</div>
      <div class="inv-footer-text">${escapeHtml(footerText)}</div>
    </div>`;
  };

  const headerFull = `<header class="inv-header">
    <div class="inv-header-top">
      <div class="inv-brand">
        <div class="inv-logo"><span class="inv-logo-mark">in</span><span class="inv-logo-name">Field</span><span class="inv-logo-drop"></span></div>
        <div class="inv-business-name"><strong>INFIELD</strong><span>INNOVATIONS</span></div>
        <div class="inv-brand-rule"></div>
      </div>
      <div class="inv-title-block">
        <h1>INVOICE</h1>
      </div>
      <div class="inv-contact">
        <div class="inv-contact-row"><strong>T.</strong><span>${escapeHtml(phone)}</span></div>
        <div class="inv-contact-row"><strong>W.</strong><span>${escapeHtml(website || 'www.infield.co.ke')}</span></div>
        <div class="inv-contact-row"><strong>E.</strong><span>${escapeHtml(email)}</span></div>
        <address>${escapeHtml(address)}</address>
      </div>
    </div>
    <div class="inv-accent-bar"><span></span></div>
    <div class="inv-for"><strong>INVOICE FOR:</strong><span>${escapeHtml(invoiceFor || invoice.customerName)}</span></div>
  </header>`;

  const headerCompact = `<div class="inv-compact-header">
    <div class="inv-compact-company">${escapeHtml(businessName)}</div>
    <div class="inv-compact-info"><span class="inv-compact-title">INVOICE</span><span class="inv-compact-number">${escapeHtml(invoice.invoiceNumber)}</span></div>
  </div>`;

  return pages.map((pageItems, i) => {
    const isFirst = i === 0;
    const isLast = i === pages.length - 1;
    if (isFirst) {
      return `<div class="inv-page">${headerFull}${buildItemsTable(pageItems, true)}${isLast ? buildTotals() + buildNotes() + buildSignature() : ''}${buildFooter()}</div>`;
    }
    return `<div class="inv-page">${headerCompact}${buildItemsTable(pageItems)}${isLast ? buildTotals() + buildSignature() : ''}${isLast ? buildFooter() : `<div class="inv-footer"><div class="inv-footer-contact">${escapeHtml(businessName)} | ${escapeHtml(phone)} | ${escapeHtml(email)}</div></div>`}</div>`;
  }).join('');
}

export function printInvoice(invoice: Invoice): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice.invoiceNumber}</title><style>${printStyles}</style></head><body>${buildInvoiceHTML(invoice)}</body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

/* === PDF Generation === */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const PRIMARY = rgb(0.073, 0.396, 0.259);
const DARK = rgb(0.067, 0.067, 0.067);
const GRAY = rgb(0.5, 0.5, 0.5);
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93);
const MINT_BG = rgb(0.706, 0.918, 0.839);
const GREEN_BAR = rgb(0.212, 0.725, 0.463);

export async function generateInvoicePDF(invoice: Invoice): Promise<Uint8Array> {
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
    page.drawText(businessName, { x: MARGIN, y, size: 12, font: boldFont, color: PRIMARY });
    page.drawText(`INVOICE - ${invoice.invoiceNumber}`, { x: PAGE_WIDTH - MARGIN - 180, y, size: 10, font, color: GRAY });
    y -= 20;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 4 }, thickness: 0.5, color: LIGHT_GRAY });
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
  page.drawText(businessName, { x: MARGIN, y, size: 18, font: boldFont, color: PRIMARY });
  y -= 22;
  y = drawWrappedText(address, MARGIN, 250, 9, font, GRAY);
  y = drawText(`${phone} | ${email}`, MARGIN, 9, font, GRAY);
  y -= 10;

  const titleX = PAGE_WIDTH - MARGIN - 120;
  let titleY = PAGE_HEIGHT - MARGIN - 4;
  page.drawText('INVOICE', { x: titleX, y: titleY, size: 24, font: boldFont, color: PRIMARY });
  titleY -= 26;
  page.drawText(invoice.invoiceNumber, { x: titleX, y: titleY, size: 11, font, color: GRAY });
  titleY -= 14;
  page.drawText(`Issue Date: ${formatDate(invoice.issueDate)}`, { x: titleX, y: titleY, size: 9, font, color: GRAY });
  y = Math.min(y, titleY - 20);

  // Customer info
  page.drawText('Bill To', { x: MARGIN, y, size: 9, font, color: GRAY });
  y -= 12;
  page.drawText(invoice.customerName, { x: MARGIN, y, size: 11, font: boldFont, color: DARK });
  y -= 14;
  y -= 10;

  // Metadata
  const metaX = PAGE_WIDTH - MARGIN - 200;
  page.drawText('Due Date:', { x: metaX, y, size: 9, font, color: GRAY });
  page.drawText(formatDate(invoice.dueDate), { x: metaX + 80, y, size: 9, font, color: DARK });
  y -= 14;
  page.drawText('Status:', { x: metaX, y, size: 9, font, color: GRAY });
  page.drawText(statusLabels[invoice.status] || invoice.status, { x: metaX + 80, y, size: 9, font, color: DARK });
  y -= 14;
  if (invoice.paid > 0) {
    page.drawText('Amount Paid:', { x: metaX, y, size: 9, font, color: GRAY });
    page.drawText(formatCurrency(invoice.paid), { x: metaX + 80, y, size: 9, font, color: DARK });
    y -= 14;
  }
  if (invoice.balance > 0) {
    page.drawText('Balance Due:', { x: metaX, y, size: 9, font: boldFont, color: rgb(0.8, 0.2, 0.2) });
    page.drawText(formatCurrency(invoice.balance), { x: metaX + 80, y, size: 9, font: boldFont, color: rgb(0.8, 0.2, 0.2) });
    y -= 14;
  }
  y -= 6;

  // Items table
  const cols = [
    { name: 'No.', x: MARGIN, w: 30 },
    { name: 'Description', x: MARGIN + 40, w: 180 },
    { name: 'Qty', x: MARGIN + 230, w: 50 },
    { name: 'Price', x: MARGIN + 290, w: 70 },
    { name: 'Total', x: MARGIN + 370, w: 70 },
  ];

  page.drawRectangle({ x: MARGIN, y: y - 16, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: GREEN_BAR });
  for (const col of cols) {
    page.drawText(col.name, { x: col.x, y: y - 12, size: 9, font: boldFont, color: rgb(1, 1, 1) });
  }
  y -= 20;

  const allItems = invoice.items;
  const firstPageItems = allItems.slice(0, ITEMS_PER_PAGE);
  const remainingItems = allItems.slice(ITEMS_PER_PAGE);

  const drawItems = (items: InvoiceItem[]) => {
    for (let i = 0; i < items.length; i++) {
      ensureSpace(30);
      const item = items[i];
      if (i % 2 === 0) {
        page.drawRectangle({ x: MARGIN, y: y - 12, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: LIGHT_GRAY });
      }
      page.drawText(String(i + 1), { x: cols[0].x, y: y - 8, size: 9, font, color: DARK });
      page.drawText(item.productName, { x: cols[1].x, y: y - 8, size: 9, font, color: DARK });
      page.drawText(String(item.quantity), { x: cols[2].x, y: y - 8, size: 9, font, color: DARK });
      page.drawText(formatCurrency(item.unitPrice), { x: cols[3].x, y: y - 8, size: 9, font, color: DARK });
      page.drawText(formatCurrency(item.total), { x: cols[4].x, y: y - 8, size: 9, font, color: DARK });
      y -= 20;
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
  const labelX = PAGE_WIDTH - MARGIN - 150;
  const valueX = PAGE_WIDTH - MARGIN;

  page.drawText('Sub-Total', { x: labelX, y, size: 9, font, color: GRAY });
  page.drawText(formatCurrency(invoice.subtotal), { x: valueX - font.widthOfTextAtSize(formatCurrency(invoice.subtotal), 9), y, size: 9, font, color: DARK });
  y -= 16;

  page.drawText(`Tax (${invoice.taxRate}%)`, { x: labelX, y, size: 9, font, color: GRAY });
  page.drawText(formatCurrency(invoice.tax), { x: valueX - font.widthOfTextAtSize(formatCurrency(invoice.tax), 9), y, size: 9, font, color: DARK });
  y -= 16;

  page.drawRectangle({ x: labelX - 10, y: y - 12, width: 160, height: 20, color: PRIMARY });
  page.drawText('Grand Total', { x: labelX, y: y - 8, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  const totalStr = formatCurrency(invoice.total);
  page.drawText(totalStr, { x: valueX - boldFont.widthOfTextAtSize(totalStr, 10), y: y - 8, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  y -= 24;

  if (invoice.balance > 0) {
    page.drawText('Balance Due', { x: labelX, y, size: 9, font: boldFont, color: rgb(0.8, 0.2, 0.2) });
    const balStr = formatCurrency(invoice.balance);
    page.drawText(balStr, { x: valueX - boldFont.widthOfTextAtSize(balStr, 9), y, size: 9, font: boldFont, color: rgb(0.8, 0.2, 0.2) });
    y -= 16;
  }

  // Notes
  if (invoice.notes) {
    ensureSpace(30);
    page.drawText('Notes:', { x: MARGIN, y, size: 9, font: boldFont, color: GRAY });
    y -= 12;
    y = drawWrappedText(invoice.notes, MARGIN, PAGE_WIDTH - MARGIN * 2, 9, font, GRAY);
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

export async function downloadInvoicePDF(invoice: Invoice): Promise<void> {
  const bytes = await generateInvoicePDF(invoice);
  const filename = `Invoice_${invoice.invoiceNumber}.pdf`;
  downloadPDF(bytes, filename);
}

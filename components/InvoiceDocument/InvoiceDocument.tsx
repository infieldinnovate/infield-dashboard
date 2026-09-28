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
import Stamp from './Stamp';

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
function Footer({ notes }: { notes?: string }) {
  const footerText = getSettings().print.footerText || 'Thank you for your business!';

  return (
    <footer className={styles.footer}>
      <section className={styles.paymentInfo} aria-label="Payment information">
        <h2>Payment Information</h2>
        <div className={styles.paymentRow}>
          <strong>M-PESA</strong>
          <span />
        </div>
      </section>

      <div className={styles.footerNotes}>
        <strong>Notes:</strong>
        {notes && <span>{notes}</span>}
      </div>

      <div className={styles.footerBottom}>
        <div className={styles.footerThankYou}>{footerText}</div>
        <div className={styles.footerStamp}><Stamp /></div>
        <div className={styles.authorizedSignature}>
          <div className={styles.signatureLine} />
          <strong>Authorised Sign</strong>
        </div>
      </div>
    </footer>
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
                {isLast && <Footer notes={invoice.notes} />}
              </>
            ) : (
              <>
                <CompactHeader invoice={invoice} />
                <ItemsTable items={pageItems} />
                {isLast && <Totals invoice={invoice} />}
                {isLast && <Footer notes={invoice.notes} />}
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
.inv-footer { margin-top: 28px; color: #111; }
.inv-payment-info h2 { margin: 0 0 8px; font-size: 18px; font-weight: 800; }
.inv-payment-row { display: grid; grid-template-columns: 136px minmax(0, 390px); height: 58px; background: linear-gradient(90deg, #d9d9d9 0%, #f0f0f0 62%, #fff 100%); }
.inv-payment-row strong { display: flex; align-items: center; padding: 0 20px; background: #bdbdbd; color: #fff; font-size: 15px; }
.inv-footer-notes { display: flex; flex-direction: column; gap: 6px; min-height: 82px; padding-top: 44px; font-size: 14px; }
.inv-footer-notes strong { font-size: 16px; font-weight: 800; }
.inv-footer-notes span { color: #333; line-height: 1.45; }
.inv-footer-bottom { display: grid; grid-template-columns: 1fr 120px 1fr; align-items: end; gap: 20px; min-height: 126px; }
.inv-footer-thank { align-self: end; padding-bottom: 16px; color: #126542; font-size: 16px; font-weight: 800; text-transform: uppercase; }
.inv-footer-stamp { justify-self: center; align-self: center; }
.inv-authorised-sign { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-bottom: 12px; }
.inv-authorised-line { width: 100%; border-bottom: 1px solid #111; height: 26px; }
.inv-authorised-sign strong { font-size: 14px; font-weight: 800; }
.inv-signature { display: none; }
.inv-notes { display: none; }
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

  const buildFooter = (notes?: string): string => {
    const stampHtml = `<div class="inv-footer-stamp"><div class="inv-footer-stamp-inner"><span class="inv-footer-stamp-name">Infield</span><span class="inv-footer-stamp-stars">★ ★ ★ ★</span><span class="inv-footer-stamp-number">+254 702 393 677</span></div><span class="inv-footer-stamp-text">DIGITAL STAMP</span></div>`;
    const stampStyles = `.inv-footer-stamp { width: 88px; height: 88px; border: 2.5px solid #c0392b; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #c0392b; font-family: Georgia, 'Times New Roman', serif; transform: rotate(-8deg); opacity: 0.85; } .inv-footer-stamp-inner { display: flex; flex-direction: column; align-items: center; gap: 1px; } .inv-footer-stamp-name { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; } .inv-footer-stamp-stars { font-size: 7px; letter-spacing: 1px; } .inv-footer-stamp-number { font-size: 7px; font-weight: 600; } .inv-footer-stamp-text { font-size: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; border-top: 1px solid #c0392b; padding-top: 1px; }`;
    return `<style>${stampStyles}</style><footer class="inv-footer"><section class="inv-payment-info"><h2>Payment Information</h2><div class="inv-payment-row"><strong>M-PESA</strong><span></span></div></section><div class="inv-footer-notes"><strong>Notes:</strong>${notes ? `<span>${escapeHtml(notes)}</span>` : ''}</div><div class="inv-footer-bottom"><div class="inv-footer-thank">${escapeHtml(footerText)}</div>${stampHtml}<div class="inv-authorised-sign"><div class="inv-authorised-line"></div><strong>Authorised Sign</strong></div></div></footer>`;
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
      return `<div class="inv-page">${headerFull}${buildItemsTable(pageItems, true)}${isLast ? buildTotals() + buildFooter(invoice.notes) : ''}</div>`;
    }
    return `<div class="inv-page">${headerCompact}${buildItemsTable(pageItems)}${isLast ? buildTotals() + buildFooter(invoice.notes) : ''}</div>`;
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
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const LOGO_BLUE = rgb(0.094, 0.541, 0.753);
const BRAND_GREEN = rgb(0.073, 0.396, 0.259);
const ACCENT_GREEN = rgb(0.208, 0.722, 0.463);
const ACCENT_GRAY = rgb(0.788, 0.788, 0.788);
const FOR_LABEL_BG = rgb(0.525, 0.678, 0.612);
const FOR_CONTENT_BG = rgb(0.886, 0.886, 0.886);
const TABLE_GREEN = rgb(0.212, 0.725, 0.463);
const TABLE_GRAY = rgb(0.533, 0.545, 0.545);
const GRAND_TOTAL_BG = rgb(0.706, 0.918, 0.839);
const BRAND_RULE = rgb(0.439, 0.439, 0.439);
const PAYMENT_LABEL_BG = rgb(0.741, 0.741, 0.741);
const PAYMENT_CONTENT_BG = rgb(0.90, 0.90, 0.90);
const STAMP_RED = rgb(0.753, 0.224, 0.169);
const DARK = rgb(0.067, 0.067, 0.067);
const GRAY = rgb(0.5, 0.5, 0.5);
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93);
const WHITE = rgb(1, 1, 1);

export async function generateInvoicePDF(invoice: Invoice): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const serifFont: PDFFont = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBoldFont: PDFFont = await doc.embedFont(StandardFonts.TimesRomanBold);

  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const footerText = settings.print.footerText || 'Thank you for your business!';
  const siteUrl = website || 'www.infield.co.ke';
  const invoiceFor = invoice.items
    .filter((item) => item.productName)
    .map((item) => `${item.quantity} ${item.productName}`)
    .join(' and ');

  // Header column positions (1.15fr : 1fr : 1fr with 20px gaps)
  const col1X = MARGIN;
  const col1W = 166;
  const col2X = col1X + col1W + 20;
  const col2W = 145;
  const col3X = col2X + col2W + 20;
  const col3W = PAGE_WIDTH - MARGIN - col3X;

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = (): PDFPage => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    page.drawText(businessName, { x: MARGIN, y, size: 12, font: boldFont, color: BRAND_GREEN });
    const compactInfo = `INVOICE  ${invoice.invoiceNumber}`;
    page.drawText(compactInfo, { x: PAGE_WIDTH - MARGIN - boldFont.widthOfTextAtSize(compactInfo, 10), y, size: 10, font, color: GRAY });
    y -= 16;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 4 }, thickness: 1, color: ACCENT_GREEN });
    y -= 14;
    return page;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 60) addPage();
  };

  const drawWrappedTextAt = (
    text: string, x: number, maxWidth: number, size: number,
    f: PDFFont, color: ReturnType<typeof rgb>, startY: number,
  ): number => {
    const words = text.split(' ');
    let line = '';
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

  // === BRANDED HEADER ===
  const headerTop = PAGE_HEIGHT - MARGIN - 18;

  // Brand column - "inField" logo
  const logoY = headerTop + 2;
  page.drawText('in', { x: col1X + 4, y: logoY, size: 20, font: boldFont, color: LOGO_BLUE });
  const inW = boldFont.widthOfTextAtSize('in', 20);
  page.drawText('Field', { x: col1X + 4 + inW, y: logoY, size: 20, font: boldFont, color: LOGO_BLUE });
  const logoFullW = boldFont.widthOfTextAtSize('inField', 20);
  page.drawLine({ start: { x: col1X + 4, y: logoY - 4 }, end: { x: col1X + 4 + logoFullW + 2, y: logoY - 4 }, thickness: 2, color: LOGO_BLUE });

  // Business name
  const bizY = logoY - 28;
  page.drawText('INFIELD', { x: col1X, y: bizY, size: 18, font: boldFont, color: BRAND_GREEN });
  page.drawText('INNOVATIONS', { x: col1X, y: bizY - 18, size: 18, font: font, color: DARK });

  // Brand rule
  const ruleY = bizY - 18 - 16;
  page.drawRectangle({ x: col1X, y: ruleY, width: col1W * 0.58, height: 12, color: BRAND_RULE });

  // Title column - "INVOICE" centered
  const titleText = 'INVOICE';
  const titleW = boldFont.widthOfTextAtSize(titleText, 24);
  page.drawText(titleText, { x: col2X + (col2W - titleW) / 2, y: headerTop - 6, size: 24, font: boldFont, color: BRAND_GREEN });

  // Contact column
  const contactTop = headerTop + 8;
  const contactH = 62;
  const contactBottom = contactTop - contactH;

  // Left border (4px dark)
  page.drawRectangle({ x: col3X, y: contactBottom, width: 4, height: contactH + 8, color: DARK });

  // Gray decoration box (top-right corner)
  page.drawRectangle({ x: col3X + col3W - 36, y: contactTop + 10, width: 36, height: 14, color: ACCENT_GRAY });

  const cLabelX = col3X + 4 + 14;
  const cValX = cLabelX + 18;

  let cy = contactTop;
  // T. + phone
  page.drawText('T.', { x: cLabelX, y: cy, size: 11, font: boldFont, color: BRAND_GREEN });
  page.drawText(phone, { x: cValX, y: cy, size: 9, font: font, color: DARK });
  page.drawLine({ start: { x: cLabelX, y: cy - 4 }, end: { x: col3X + col3W, y: cy - 4 }, thickness: 0.5, color: ACCENT_GRAY });
  cy -= 15;
  // W. + website
  page.drawText('W.', { x: cLabelX, y: cy, size: 11, font: boldFont, color: BRAND_GREEN });
  page.drawText(siteUrl, { x: cValX, y: cy, size: 9, font: font, color: DARK });
  page.drawLine({ start: { x: cLabelX, y: cy - 4 }, end: { x: col3X + col3W, y: cy - 4 }, thickness: 0.5, color: ACCENT_GRAY });
  cy -= 15;
  // E. + email
  page.drawText('E.', { x: cLabelX, y: cy, size: 11, font: boldFont, color: BRAND_GREEN });
  page.drawText(email, { x: cValX, y: cy, size: 9, font: font, color: DARK });
  page.drawLine({ start: { x: cLabelX, y: cy - 4 }, end: { x: col3X + col3W, y: cy - 4 }, thickness: 0.5, color: ACCENT_GRAY });
  cy -= 15;
  // Address
  page.drawText(address, { x: cLabelX, y: cy, size: 9, font: font, color: DARK });

  // Header bottom border (3px)
  const headerBottomY = Math.min(ruleY, cy - 12);
  page.drawLine({ start: { x: MARGIN, y: headerBottomY }, end: { x: PAGE_WIDTH - MARGIN, y: headerBottomY }, thickness: 3, color: LOGO_BLUE });

  // Accent bar
  const accentY = headerBottomY - 10;
  page.drawRectangle({ x: MARGIN, y: accentY - 8, width: CONTENT_WIDTH, height: 8, color: ACCENT_GREEN });
  page.drawRectangle({ x: MARGIN, y: accentY - 8, width: CONTENT_WIDTH * 0.07, height: 8, color: ACCENT_GRAY });

  // Invoice For section
  const forHeight = 40;
  const forY = accentY - 18;
  const forLabelW = 180;

  // Label background
  page.drawRectangle({ x: MARGIN, y: forY - forHeight, width: forLabelW, height: forHeight, color: FOR_LABEL_BG });
  const forLabelText = 'INVOICE FOR:';
  const forLabelW2 = boldFont.widthOfTextAtSize(forLabelText, 14);
  page.drawText(forLabelText, { x: MARGIN + forLabelW - forLabelW2 - 14, y: forY - forHeight / 2 - 5, size: 14, font: boldFont, color: WHITE });

  // Content background
  const forContentW = CONTENT_WIDTH - forLabelW;
  page.drawRectangle({ x: MARGIN + forLabelW, y: forY - forHeight, width: forContentW, height: forHeight, color: FOR_CONTENT_BG });
  const forText = invoiceFor || invoice.customerName;
  let forDisplay = forText;
  const maxForW = forContentW - 28;
  if (font.widthOfTextAtSize(forDisplay, 13) > maxForW) {
    while (font.widthOfTextAtSize(forDisplay + '...', 13) > maxForW && forDisplay.length > 0) {
      forDisplay = forDisplay.slice(0, -1);
    }
    forDisplay += '...';
  }
  page.drawText(forDisplay, { x: MARGIN + forLabelW + 14, y: forY - forHeight / 2 - 5, size: 13, font: font, color: DARK });

  // Set y for items table
  y = forY - forHeight - 30;

  // === ITEMS TABLE ===
  const colWidths: Record<string, number> = {
    no: CONTENT_WIDTH * 0.08,
    size: CONTENT_WIDTH * 0.09,
    qty: CONTENT_WIDTH * 0.15,
    price: CONTENT_WIDTH * 0.12,
    total: CONTENT_WIDTH * 0.16,
  };
  colWidths.desc = CONTENT_WIDTH - colWidths.no - colWidths.size - colWidths.qty - colWidths.price - colWidths.total;

  const colXs: Record<string, number> = {
    no: MARGIN,
    desc: MARGIN + colWidths.no,
    size: MARGIN + colWidths.no + colWidths.desc,
    qty: MARGIN + colWidths.no + colWidths.desc + colWidths.size,
    price: MARGIN + colWidths.no + colWidths.desc + colWidths.size + colWidths.qty,
    total: MARGIN + colWidths.no + colWidths.desc + colWidths.size + colWidths.qty + colWidths.price,
  };

  const drawTableHeader = () => {
    const thH = 28;
    const thY = y - thH;

    // Green background for all
    page.drawRectangle({ x: MARGIN, y: thY, width: CONTENT_WIDTH, height: thH, color: TABLE_GREEN });
    // Gray background for Size and Qty columns
    page.drawRectangle({ x: colXs.size, y: thY, width: colWidths.size + colWidths.qty, height: thH, color: TABLE_GRAY });

    // White separators
    const sepW = 1.5;
    [colXs.desc, colXs.size, colXs.qty, colXs.price, colXs.total].forEach((sx) => {
      page.drawRectangle({ x: sx - sepW / 2, y: thY, width: sepW, height: thH, color: WHITE });
    });

    // Header labels
    const headers = [
      { text: 'No.', x: colXs.no, w: colWidths.no, align: 'center' as const },
      { text: 'Description', x: colXs.desc, w: colWidths.desc, align: 'left' as const },
      { text: 'Size', x: colXs.size, w: colWidths.size, align: 'center' as const },
      { text: 'Qty', x: colXs.qty, w: colWidths.qty, align: 'center' as const },
      { text: 'Price', x: colXs.price, w: colWidths.price, align: 'right' as const },
      { text: 'Total', x: colXs.total, w: colWidths.total, align: 'right' as const },
    ];

    for (const h of headers) {
      const tw = boldFont.widthOfTextAtSize(h.text, 13);
      let tx: number;
      if (h.align === 'center') tx = h.x + (h.w - tw) / 2;
      else if (h.align === 'right') tx = h.x + h.w - tw - 8;
      else tx = h.x + 8;
      page.drawText(h.text, { x: tx, y: thY + 8, size: 13, font: boldFont, color: WHITE });
    }

    y = thY;
  };

  const drawItems = (items: InvoiceItem[], startIndex: number) => {
    drawTableHeader();
    y -= 2;

    const rowH = 24;

    for (let i = 0; i < items.length; i++) {
      ensureSpace(rowH + 4);
      const item = items[i];
      const isBlank = !item.productName;
      const rowY = y - rowH;

      // Row bottom border
      page.drawLine({ start: { x: MARGIN, y: rowY }, end: { x: PAGE_WIDTH - MARGIN, y: rowY }, thickness: 0.5, color: rgb(0.86, 0.90, 0.91) });

      const cellY = rowY + 7;

      if (!isBlank) {
        // No.
        const noStr = String(startIndex + i + 1);
        const noW = serifFont.widthOfTextAtSize(noStr, 11);
        page.drawText(noStr, { x: colXs.no + (colWidths.no - noW) / 2, y: cellY, size: 11, font: serifFont, color: DARK });

        // Description (truncate if needed)
        let descText = item.productName;
        const maxDescW = colWidths.desc - 16;
        if (serifFont.widthOfTextAtSize(descText, 11) > maxDescW) {
          while (serifFont.widthOfTextAtSize(descText + '...', 11) > maxDescW && descText.length > 0) {
            descText = descText.slice(0, -1);
          }
          descText += '...';
        }
        page.drawText(descText, { x: colXs.desc + 8, y: cellY, size: 11, font: serifFont, color: DARK });

        // Size
        page.drawText('-', { x: colXs.size + (colWidths.size - serifFont.widthOfTextAtSize('-', 11)) / 2, y: cellY, size: 11, font: serifFont, color: DARK });

        // Qty
        const qtyStr = `${item.quantity} Units`;
        const qw = serifFont.widthOfTextAtSize(qtyStr, 11);
        page.drawText(qtyStr, { x: colXs.qty + (colWidths.qty - qw) / 2, y: cellY, size: 11, font: serifFont, color: DARK });

        // Price
        const priceStr = formatAmount(item.unitPrice);
        const pw = serifFont.widthOfTextAtSize(priceStr, 11);
        page.drawText(priceStr, { x: colXs.price + colWidths.price - pw - 8, y: cellY, size: 11, font: serifFont, color: DARK });

        // Total
        const totalStr = formatAmount(item.total);
        const tw = serifFont.widthOfTextAtSize(totalStr, 11);
        page.drawText(totalStr, { x: colXs.total + colWidths.total - tw - 8, y: cellY, size: 11, font: serifFont, color: DARK });
      }

      y = rowY;
    }
  };

  // Draw items
  const firstPageItems = invoice.items.slice(0, ITEMS_PER_PAGE);
  const paddedFirst = padToMinimum(firstPageItems, 4);
  const remainingItems = invoice.items.slice(ITEMS_PER_PAGE);

  drawItems(paddedFirst, 0);

  for (let i = 0; i < remainingItems.length; i += ITEMS_PER_MIDDLE_PAGE) {
    addPage();
    drawItems(remainingItems.slice(i, i + ITEMS_PER_MIDDLE_PAGE), i + ITEMS_PER_PAGE);
  }

  // Check if there's room for totals + footer
  if (y < 400) {
    addPage();
  }

  // === TOTALS ===
  y -= 30;
  const totalsW = CONTENT_WIDTH * 0.52;
  const totalsX = PAGE_WIDTH - MARGIN - totalsW;

  const drawTotalsRow = (label: string, value: string) => {
    const rowH = 28;
    const rowY = y - rowH;
    page.drawText(label, { x: totalsX + 14, y: rowY + 8, size: 11, font: font, color: GRAY });
    const vw = font.widthOfTextAtSize(value, 11);
    page.drawText(value, { x: totalsX + totalsW - vw - 14, y: rowY + 8, size: 11, font: font, color: DARK });
    page.drawLine({ start: { x: totalsX, y: rowY }, end: { x: totalsX + totalsW, y: rowY }, thickness: 1, color: rgb(0.82, 0.82, 0.82) });
    y = rowY;
  };

  drawTotalsRow('Sub-Total', formatCurrency(invoice.subtotal));
  drawTotalsRow('Labour', '-');
  drawTotalsRow('Transportation', '-');
  drawTotalsRow(`Tax (${invoice.taxRate}%)`, formatCurrency(invoice.tax));

  // Grand Total
  y -= 4;
  const gtH = 32;
  const gtY = y - gtH;
  const gtLabelW = (totalsW * 1.15) / 2.15;
  const gtValW = totalsW - gtLabelW;

  page.drawRectangle({ x: totalsX, y: gtY, width: gtLabelW, height: gtH, color: TABLE_GREEN });
  page.drawText('Grand Total', { x: totalsX + 14, y: gtY + 9, size: 14, font: boldFont, color: WHITE });

  page.drawRectangle({ x: totalsX + gtLabelW, y: gtY, width: gtValW, height: gtH, color: GRAND_TOTAL_BG });
  const gtValStr = formatCurrency(invoice.total);
  const gtValW2 = boldFont.widthOfTextAtSize(gtValStr, 14);
  page.drawText(gtValStr, { x: totalsX + gtLabelW + gtValW - gtValW2 - 14, y: gtY + 9, size: 14, font: boldFont, color: DARK });
  y = gtY;

  if (invoice.balance > 0) {
    y -= 8;
    const balStr = formatCurrency(invoice.balance);
    page.drawText('Balance Due', { x: totalsX + 14, y, size: 10, font: boldFont, color: rgb(0.8, 0.2, 0.2) });
    const bw = boldFont.widthOfTextAtSize(balStr, 10);
    page.drawText(balStr, { x: totalsX + totalsW - bw - 14, y, size: 10, font: boldFont, color: rgb(0.8, 0.2, 0.2) });
    y -= 16;
  }

  // === FOOTER ===
  let fy = 235;

  // Payment Information heading
  page.drawText('Payment Information', { x: MARGIN, y: fy, size: 14, font: boldFont, color: DARK });
  fy -= 24;

  // M-PESA row
  const mpesaLabelW = 120;
  const mpesaH = 36;
  page.drawRectangle({ x: MARGIN, y: fy - mpesaH, width: mpesaLabelW, height: mpesaH, color: PAYMENT_LABEL_BG });
  const mpesaW = boldFont.widthOfTextAtSize('M-PESA', 13);
  page.drawText('M-PESA', { x: MARGIN + (mpesaLabelW - mpesaW) / 2, y: fy - mpesaH / 2 - 5, size: 13, font: boldFont, color: WHITE });
  page.drawRectangle({ x: MARGIN + mpesaLabelW, y: fy - mpesaH, width: CONTENT_WIDTH - mpesaLabelW, height: mpesaH, color: PAYMENT_CONTENT_BG });
  fy -= mpesaH + 16;

  // Notes
  page.drawText('Notes:', { x: MARGIN, y: fy, size: 12, font: boldFont, color: DARK });
  fy -= 16;
  if (invoice.notes) {
    fy = drawWrappedTextAt(invoice.notes, MARGIN, CONTENT_WIDTH, 10, font, DARK, fy);
  }
  fy -= 20;

  // Bottom row: Thank you | Stamp | Authorised Sign
  const bottomY = Math.max(fy, 55);

  // Thank you text (left)
  page.drawText(footerText.toUpperCase(), { x: MARGIN, y: bottomY, size: 11, font: boldFont, color: BRAND_GREEN });

  // Stamp (center)
  const stampCx = PAGE_WIDTH / 2;
  const stampCy = bottomY + 8;
  const stampR = 30;
  page.drawCircle({ x: stampCx, y: stampCy, size: stampR, borderWidth: 2, borderColor: STAMP_RED, color: WHITE });
  page.drawText('INFIELD', { x: stampCx - boldFont.widthOfTextAtSize('INFIELD', 8) / 2, y: stampCy + 10, size: 8, font: boldFont, color: STAMP_RED });
  page.drawText('★ ★ ★ ★', { x: stampCx - font.widthOfTextAtSize('★ ★ ★ ★', 5) / 2, y: stampCy + 1, size: 5, font: font, color: STAMP_RED });
  page.drawText('+254 702 393 677', { x: stampCx - font.widthOfTextAtSize('+254 702 393 677', 5) / 2, y: stampCy - 7, size: 5, font: font, color: STAMP_RED });
  page.drawLine({ start: { x: stampCx - 18, y: stampCy - 12 }, end: { x: stampCx + 18, y: stampCy - 12 }, thickness: 0.5, color: STAMP_RED });
  page.drawText('DIGITAL STAMP', { x: stampCx - boldFont.widthOfTextAtSize('DIGITAL STAMP', 4) / 2, y: stampCy - 18, size: 4, font: boldFont, color: STAMP_RED });

  // Authorised Sign (right)
  const sigX = PAGE_WIDTH - MARGIN - 140;
  page.drawLine({ start: { x: sigX, y: bottomY + 18 }, end: { x: sigX + 140, y: bottomY + 18 }, thickness: 1, color: DARK });
  const sigLabel = 'Authorised Sign';
  const sigLabelW = boldFont.widthOfTextAtSize(sigLabel, 10);
  page.drawText(sigLabel, { x: sigX + (140 - sigLabelW) / 2, y: bottomY + 4, size: 10, font: boldFont, color: DARK });

  return doc.save();
}

export async function downloadInvoicePDF(invoice: Invoice): Promise<void> {
  const bytes = await generateInvoicePDF(invoice);
  const filename = `Invoice_${invoice.invoiceNumber}.pdf`;
  downloadPDF(bytes, filename);
}

'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import type { Quotation, QuotationItem } from '../../types';
import {
  formatCurrency,
  formatDate,
  getSettings,
  statusLabels,
  statusColors,
  downloadPDF,
  generateBarcode,
  generateBarcodePng,
  fetchImageBytes,
} from '../../lib/documentUtils';
import styles from './QuotationDocument.module.scss';
import Stamp from '../InvoiceDocument/Stamp';
import { ImageWithFallback } from '../ui/ImageWithFallback';

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

function padToMinimum(rows: QuotationItem[], min: number): QuotationItem[] {
  const padded = [...rows];
  while (padded.length < min) {
    padded.push({ productId: `blank-${padded.length}`, productName: '', quantity: 0, unitPrice: 0, total: 0, size: '' });
  }
  return padded;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* === Branded Header === */
function BrandedHeader({ quotation }: { quotation: Quotation }) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const barcodeValue = generateBarcode(quotation.userId, quotation.quotationCode);

  useEffect(() => {
    if (!barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: 'CODE128',
        displayValue: false,
        height: 34,
        width: 1.35,
        margin: 0,
        background: 'transparent',
        lineColor: '#111111',
      });
    } catch { /* ignore */ }
  }, [barcodeValue]);

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.brand}>
          <div className={styles.logo}>
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
          <h1>QUOTATION</h1>
          <svg ref={barcodeRef} className={styles.barcode} />
          <span className={styles.codeText}>{quotation.quotationCode}</span>
          <span className={styles.barcodeText}>{barcodeValue}</span>
        </div>
        <div className={styles.contact}>
          <div className={styles.contactRow}><strong>T.</strong><span>{phone}</span></div>
          <div className={styles.contactRow}><strong>W.</strong><span>{website || 'www.infield.co.ke'}</span></div>
          <div className={styles.contactRow}><strong>E.</strong><span>{email}</span></div>
          <address>{address}</address>
        </div>
      </div>
      <div className={styles.accentBar}><span /></div>
    </header>
  );
}

/* === Bill To + For === */
function BillToAndFor({ quotation }: { quotation: Quotation }) {
  return (
    <div className={styles.billToFor}>
      <div className={styles.billTo}>
        <strong className={styles.sectionLabel}>BILL TO:</strong>
        <div className={styles.billToContent}>
          <p className={styles.clientName}>{quotation.customerName}</p>
          {quotation.customerAddress && <p className={styles.clientAddress}>{quotation.customerAddress}</p>}
          <p className={styles.clientContact}>{quotation.customerContact}</p>
        </div>
      </div>
      <div className={styles.forSection}>
        <strong className={styles.forLabel}>FOR:</strong>
        <span className={styles.forText}>{quotation.quoteFor}</span>
      </div>
    </div>
  );
}

/* === Date Bar === */
function DateBar({ quotation }: { quotation: Quotation }) {
  return (
    <div className={styles.dateBar}>
      <div className={styles.dateItem}>
        <span className={styles.dateLabel}>Date</span>
        <span className={styles.dateValue}>{formatDate(quotation.createdAt)}</span>
      </div>
      <div className={styles.dateItem}>
        <span className={styles.dateLabel}>Status</span>
        <span className={styles.dateValue}>{statusLabels[quotation.status] || quotation.status}</span>
      </div>
    </div>
  );
}

/* === Items Table === */
function ItemsTable({ items, pad }: { items: QuotationItem[]; pad?: boolean }) {
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
              <td className={styles.sizeColumn}>{isBlank ? '' : (item.size || '-')}</td>
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
function Totals({ quotation }: { quotation: Quotation }) {
  return (
    <div className={styles.totals}>
      <div className={styles.totalsRow}><span>Sub-Total</span><strong>{formatCurrency(quotation.subtotal)}</strong></div>
      <div className={styles.totalsRow}><span>Tax <em>({quotation.taxRate}%)</em></span><strong>{formatCurrency(quotation.tax)}</strong></div>
      <div className={styles.grandTotal}><strong>Grand Total</strong><span>{formatCurrency(quotation.total)}</span></div>
    </div>
  );
}

/* === Footer === */
function Footer({ quotation }: { quotation: Quotation }) {
  const settings = getSettings();
  const { phone } = settings.business;
  const signatureSrc = quotation.createdBySignature || settings.business.signature;
  return (
    <footer className={styles.footer}>
      <div className={styles.footerNotes}>
        <strong>Notes:</strong>
        {quotation.notes && <span>{quotation.notes}</span>}
      </div>
      <div className={styles.footerBottom}>
        <div className={styles.footerThankYou}>Thank you for choosing Infield Innovations!</div>
        <div className={styles.footerStamp}><Stamp /></div>
        <div className={styles.authorizedSignature}>
          <ImageWithFallback src={signatureSrc} alt="Signature" width={140} height={50} animation="fadeUp" className={styles.signatureImage} />
          <strong>{quotation.createdBy}</strong>
        </div>
      </div>
      <div className={styles.footerContact}>Contact us: {phone}</div>
    </footer>
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
        <span className={styles.compactNumber}>{quotation.quotationCode}</span>
      </div>
    </div>
  );
}

/* === Status Badge === */
function StatusBadge({ status }: { status: Quotation['status'] }) {
  const label = statusLabels[status] || status;
  const color = statusColors[status] || '#6b7280';
  return <span className={styles.statusBadge} style={{ backgroundColor: color }}>{label}</span>;
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
                <BrandedHeader quotation={quotation} />
                <BillToAndFor quotation={quotation} />
                <DateBar quotation={quotation} />
                <ItemsTable items={pageItems} pad />
                {isLast && <Totals quotation={quotation} />}
                {isLast && <Footer quotation={quotation} />}
              </>
            ) : (
              <>
                <CompactHeader quotation={quotation} />
                <ItemsTable items={pageItems} />
                {isLast && <Totals quotation={quotation} />}
                {isLast && <Footer quotation={quotation} />}
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
      <button className={styles.actionBtn} onClick={() => printQuotation(quotation)}>Print A4</button>
      <button className={styles.actionBtn} onClick={() => downloadQuotationPDF(quotation)}>Download PDF</button>
      <button className={styles.actionBtn} onClick={actions.onEdit}>Edit</button>
      <button className={styles.actionBtn} onClick={actions.onDuplicate}>Duplicate</button>
      <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={actions.onDelete}>Delete</button>
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
        <div className={styles.previewStatus}><StatusBadge status={quotation.status} /></div>
        <ActionBar quotation={quotation} actions={actions} />
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
.qt-page{width:210mm;min-height:297mm;padding:15mm;position:relative;page-break-after:always}
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
.qt-code-text{font-size:14px;font-weight:800;color:#126542;letter-spacing:0.1em}.qt-barcode-text{font-size:10px;font-weight:600;color:#555;letter-spacing:0.06em}
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
.qt-items-table tbody td{height:34px;font-family:Georgia,'Times New Roman',serif;font-size:13px}
.qt-no-col{width:8%;text-align:center}
.qt-size-col{width:9%;text-align:center}
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
`;

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildQuotationHTML(quotation: Quotation): string {
  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const siteUrl = website || 'www.infield.co.ke';
  const pages = paginateItems(quotation.items);
  const signatureSrc = quotation.createdBySignature || settings.business.signature;
  const barcodeValue = generateBarcode(quotation.userId, quotation.quotationCode);

  const buildItemsTable = (items: QuotationItem[], pad = false): string => {
    const rows = pad ? padToMinimum(items, 4) : items;
    return `<table class="qt-items-table"><thead><tr>
      <th class="qt-no-col">No.</th><th>Description</th><th class="qt-size-col">Size</th>
      <th class="qt-qty-col">Qty</th><th class="qt-price-col">Price</th><th class="qt-total-col">Total</th>
    </tr></thead><tbody>${rows.map((item, i) => {
      const isBlank = !item.productName;
      return `<tr>
        <td class="qt-no-col">${isBlank ? '' : i + 1}</td>
        <td>${escapeHtml(item.productName)}</td>
        <td class="qt-size-col">${isBlank ? '' : escapeHtml(item.size || '-')}</td>
        <td class="qt-qty-col">${isBlank ? '' : item.quantity + ' Units'}</td>
        <td class="qt-price-col">${isBlank ? '' : formatAmount(item.unitPrice)}</td>
        <td class="qt-total-col">${isBlank ? '-' : formatAmount(item.total)}</td>
      </tr>`;
    }).join('')}</tbody></table>`;
  };

  const buildTotals = () => `<div class="qt-totals">
    <div class="qt-totals-row"><span>Sub-Total</span><strong>${formatCurrency(quotation.subtotal)}</strong></div>
    <div class="qt-totals-row"><span>Tax <em>(${quotation.taxRate}%)</em></span><strong>${formatCurrency(quotation.tax)}</strong></div>
    <div class="qt-grand-total"><strong>Grand Total</strong><span>${formatCurrency(quotation.total)}</span></div>
  </div>`;

  const stampHTML = `<div class="qt-footer-stamp"><div style="width:88px;height:88px;border:2.5px solid #c0392b;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#c0392b;font-family:Georgia,serif;transform:rotate(-8deg);opacity:0.85">
    <div style="display:flex;flex-direction:column;align-items:center;gap:1px">
      <span style="font-size:11px;font-weight:800;text-transform:uppercase">Infield</span>
      <span style="font-size:7px;letter-spacing:1px">* * * *</span>
      <span style="font-size:7px;font-weight:600">+254 702 393 677</span>
    </div>
    <span style="font-size:6px;font-weight:700;text-transform:uppercase;border-top:1px solid #c0392b;padding-top:1px;margin-top:2px">DIGITAL STAMP</span>
  </div></div>`;

  const sigHTML = signatureSrc ? `<img src="${escapeHtml(signatureSrc)}" alt="Signature" style="max-width:140px;max-height:50px;object-fit:contain" />` : '';

  const buildFooter = () => `<footer class="qt-footer">
    <div class="qt-footer-notes"><strong>Notes:</strong>${quotation.notes ? `<span>${escapeHtml(quotation.notes)}</span>` : ''}</div>
    <div class="qt-footer-bottom">
      <div class="qt-footer-thank">Thank you for choosing Infield Innovations!</div>
      ${stampHTML}
      <div class="qt-authorised-sig">${sigHTML}<strong>${escapeHtml(quotation.createdBy || '')}</strong></div>
    </div>
    <div class="qt-footer-contact">Contact us: ${escapeHtml(phone)}</div>
  </footer>`;

  const headerFull = `<header class="qt-header"><div class="qt-header-top">
    <div class="qt-brand">
      <div class="qt-logo"><span class="qt-logo-mark">in</span><span class="qt-logo-name">Field</span><span class="qt-logo-drop"></span></div>
      <div class="qt-business-name"><strong>INFIELD</strong><span>INNOVATIONS</span></div>
      <div class="qt-brand-rule"></div>
    </div>
    <div class="qt-title-block"><h1>QUOTATION</h1><span class="qt-code-text">${escapeHtml(quotation.quotationCode || '')}</span><span class="qt-barcode-text">${escapeHtml(barcodeValue)}</span></div>
    <div class="qt-contact">
      <div class="qt-contact-row"><strong>T.</strong><span>${escapeHtml(phone)}</span></div>
      <div class="qt-contact-row"><strong>W.</strong><span>${escapeHtml(siteUrl)}</span></div>
      <div class="qt-contact-row"><strong>E.</strong><span>${escapeHtml(email)}</span></div>
      <address>${escapeHtml(address)}</address>
    </div>
  </div><div class="qt-accent-bar"><span></span></div></header>`;

  const billToFor = `<div class="qt-billto-for">
    <div class="qt-billto">
      <span class="qt-billto-label">BILL TO:</span>
      <p class="qt-client-name">${escapeHtml(quotation.customerName)}</p>
      ${quotation.customerAddress ? `<p class="qt-client-address">${escapeHtml(quotation.customerAddress)}</p>` : ''}
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

  const headerCompact = `<div class="qt-compact-header"><div class="qt-compact-company">${escapeHtml(businessName)}</div><div class="qt-compact-info"><span class="qt-compact-title">QUOTATION</span><span class="qt-compact-number">${escapeHtml(quotation.quotationCode || '')}</span></div></div>`;

  return pages.map((pageItems, i) => {
    const isFirst = i === 0;
    const isLast = i === pages.length - 1;
    if (isFirst) return `<div class="qt-page">${headerFull}${billToFor}${dateBar}${buildItemsTable(pageItems, true)}${isLast ? buildTotals() + buildFooter() : ''}</div>`;
    return `<div class="qt-page">${headerCompact}${buildItemsTable(pageItems)}${isLast ? buildTotals() + buildFooter() : ''}</div>`;
  }).join('');
}

export function printQuotation(quotation: Quotation): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Quotation ${quotation.quotationCode || quotation.id}</title><style>${printStyles}</style></head><body>${buildQuotationHTML(quotation)}</body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

/* === PDF === */
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';

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
const STAMP_RED = rgb(0.753, 0.224, 0.169);
const DARK = rgb(0.067, 0.067, 0.067);
const GRAY = rgb(0.5, 0.5, 0.5);
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93);
const WHITE = rgb(1, 1, 1);

export async function generateQuotationPDF(quotation: Quotation): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const serifFont: PDFFont = await doc.embedFont(StandardFonts.TimesRoman);

  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const siteUrl = website || 'www.infield.co.ke';
  const barcodeValue = generateBarcode(quotation.userId, quotation.quotationCode);
  const signatureSrc = quotation.createdBySignature || settings.business.signature;

  const barcodeBytes = await generateBarcodePng(barcodeValue);
  let barcodeImg = null;
  if (barcodeBytes) { try { barcodeImg = await doc.embedPng(barcodeBytes); } catch { /* ignore */ } }

  const sigBytes = await fetchImageBytes(signatureSrc);
  let sigImg = null;
  if (sigBytes) { try { sigImg = await doc.embedPng(sigBytes); } catch { /* try jpg */ try { sigImg = await doc.embedJpg(sigBytes); } catch { /* ignore */ } } }

  const col1X = MARGIN; const col1W = 166;
  const col2X = col1X + col1W + 20; const col2W = 145;
  const col3X = col2X + col2W + 20; const col3W = PAGE_WIDTH - MARGIN - col3X;

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = (): PDFPage => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    page.drawText(businessName, { x: MARGIN, y, size: 12, font: boldFont, color: BRAND_GREEN });
    const info = `QUOTATION  ${quotation.quotationCode || quotation.id}`;
    page.drawText(info, { x: PAGE_WIDTH - MARGIN - boldFont.widthOfTextAtSize(info, 10), y, size: 10, font, color: GRAY });
    y -= 16;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 4 }, thickness: 1, color: ACCENT_GREEN });
    y -= 14;
    return page;
  };

  const ensureSpace = (needed: number) => { if (y - needed < MARGIN + 60) addPage(); };

  const drawWrappedTextAt = (text: string, x: number, maxWidth: number, size: number, f: PDFFont, color: ReturnType<typeof rgb>, startY: number): number => {
    const words = text.split(' '); let line = ''; let cy = startY;
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(testLine, size) > maxWidth) { page.drawText(line, { x, y: cy, size, font: f, color }); cy -= size + 4; line = word; }
      else { line = testLine; }
    }
    if (line) { page.drawText(line, { x, y: cy, size, font: f, color }); cy -= size + 4; }
    return cy;
  };

  // Header
  const headerTop = PAGE_HEIGHT - MARGIN - 18;
  page.drawText('in', { x: col1X + 4, y: headerTop + 2, size: 20, font: boldFont, color: LOGO_BLUE });
  const inW = boldFont.widthOfTextAtSize('in', 20);
  page.drawText('Field', { x: col1X + 4 + inW, y: headerTop + 2, size: 20, font: boldFont, color: LOGO_BLUE });
  const logoFullW = boldFont.widthOfTextAtSize('inField', 20);
  page.drawLine({ start: { x: col1X + 4, y: headerTop - 2 }, end: { x: col1X + 4 + logoFullW + 2, y: headerTop - 2 }, thickness: 2, color: LOGO_BLUE });

  const bizY = headerTop - 28;
  page.drawText('INFIELD', { x: col1X, y: bizY, size: 18, font: boldFont, color: BRAND_GREEN });
  page.drawText('INNOVATIONS', { x: col1X, y: bizY - 18, size: 18, font: font, color: DARK });
  page.drawRectangle({ x: col1X, y: bizY - 34, width: col1W * 0.58, height: 12, color: BRAND_RULE });

  const titleText = 'QUOTATION';
  page.drawText(titleText, { x: col2X + (col2W - boldFont.widthOfTextAtSize(titleText, 24)) / 2, y: headerTop - 6, size: 24, font: boldFont, color: BRAND_GREEN });
  const codeText = quotation.quotationCode || '';
  page.drawText(codeText, { x: col2X + (col2W - boldFont.widthOfTextAtSize(codeText, 14)) / 2, y: headerTop - 28, size: 14, font: boldFont, color: BRAND_GREEN });
  const barcodeText = barcodeValue;
  page.drawText(barcodeText, { x: col2X + (col2W - font.widthOfTextAtSize(barcodeText, 7)) / 2, y: headerTop - 44, size: 7, font: font, color: GRAY });
  if (barcodeImg) {
    const bw = 100; const bh = (barcodeImg.height / barcodeImg.width) * bw;
    page.drawImage(barcodeImg, { x: col2X + (col2W - bw) / 2, y: headerTop - 44 - bh - 2, width: bw, height: bh });
  }

  const contactTop = headerTop + 8;
  const contactH = 62; const contactBottom = contactTop - contactH;
  page.drawRectangle({ x: col3X, y: contactBottom, width: 4, height: contactH + 8, color: DARK });
  page.drawRectangle({ x: col3X + col3W - 36, y: contactTop + 10, width: 36, height: 14, color: ACCENT_GRAY });
  const cLabelX = col3X + 4 + 14; const cValX = cLabelX + 18;
  let cy = contactTop;
  page.drawText('T.', { x: cLabelX, y: cy, size: 11, font: boldFont, color: BRAND_GREEN });
  page.drawText(phone, { x: cValX, y: cy, size: 9, font: font, color: DARK });
  page.drawLine({ start: { x: cLabelX, y: cy - 4 }, end: { x: col3X + col3W, y: cy - 4 }, thickness: 0.5, color: ACCENT_GRAY });
  cy -= 15;
  page.drawText('W.', { x: cLabelX, y: cy, size: 11, font: boldFont, color: BRAND_GREEN });
  page.drawText(siteUrl, { x: cValX, y: cy, size: 9, font: font, color: DARK });
  page.drawLine({ start: { x: cLabelX, y: cy - 4 }, end: { x: col3X + col3W, y: cy - 4 }, thickness: 0.5, color: ACCENT_GRAY });
  cy -= 15;
  page.drawText('E.', { x: cLabelX, y: cy, size: 11, font: boldFont, color: BRAND_GREEN });
  page.drawText(email, { x: cValX, y: cy, size: 9, font: font, color: DARK });
  page.drawLine({ start: { x: cLabelX, y: cy - 4 }, end: { x: col3X + col3W, y: cy - 4 }, thickness: 0.5, color: ACCENT_GRAY });
  cy -= 15;
  page.drawText(address, { x: cLabelX, y: cy, size: 9, font: font, color: DARK });

  const headerBottomY = Math.min(bizY - 40, cy - 12);
  page.drawLine({ start: { x: MARGIN, y: headerBottomY }, end: { x: PAGE_WIDTH - MARGIN, y: headerBottomY }, thickness: 3, color: LOGO_BLUE });
  const accentY = headerBottomY - 10;
  page.drawRectangle({ x: MARGIN, y: accentY - 8, width: CONTENT_WIDTH, height: 8, color: ACCENT_GREEN });
  page.drawRectangle({ x: MARGIN, y: accentY - 8, width: CONTENT_WIDTH * 0.07, height: 8, color: ACCENT_GRAY });

  // Bill To + For
  const bfHeight = 50; const bfY = accentY - 18; const halfW = CONTENT_WIDTH / 2;
  page.drawRectangle({ x: MARGIN, y: bfY - bfHeight, width: halfW, height: bfHeight, color: FOR_CONTENT_BG });
  page.drawText('BILL TO:', { x: MARGIN + 14, y: bfY - 12, size: 11, font: boldFont, color: BRAND_GREEN });
  page.drawText(quotation.customerName, { x: MARGIN + 14, y: bfY - 26, size: 12, font: boldFont, color: DARK });
  let addrY = bfY - 38;
  if (quotation.customerAddress) { page.drawText(quotation.customerAddress, { x: MARGIN + 14, y: addrY, size: 9, font: font, color: GRAY }); addrY -= 12; }
  page.drawText(quotation.customerContact, { x: MARGIN + 14, y: addrY, size: 9, font: font, color: GRAY });
  page.drawRectangle({ x: MARGIN + halfW, y: bfY - bfHeight, width: halfW, height: bfHeight, color: FOR_LABEL_BG });
  page.drawText('FOR:', { x: MARGIN + halfW + 14, y: bfY - 12, size: 11, font: boldFont, color: WHITE });
  let forDisplay = quotation.quoteFor || '';
  const maxForW = halfW - 28;
  if (font.widthOfTextAtSize(forDisplay, 11) > maxForW) {
    while (font.widthOfTextAtSize(forDisplay + '...', 11) > maxForW && forDisplay.length > 0) forDisplay = forDisplay.slice(0, -1);
    forDisplay += '...';
  }
  page.drawText(forDisplay, { x: MARGIN + halfW + 14, y: bfY - 28, size: 11, font: font, color: WHITE });

  // Date Bar
  y = bfY - bfHeight - 10;
  const dateBarH = 28;
  page.drawRectangle({ x: MARGIN, y: y - dateBarH, width: 4, height: dateBarH, color: BRAND_GREEN });
  const dateItems = [
    { label: 'Date', value: formatDate(quotation.createdAt) },
    { label: 'Status', value: statusLabels[quotation.status] || quotation.status },
  ];
  const dateColW = (CONTENT_WIDTH - 4) / dateItems.length;
  dateItems.forEach((d, i) => {
    const dx = MARGIN + 4 + i * dateColW + 10;
    page.drawText(d.label.toUpperCase(), { x: dx, y: y - 8, size: 8, font: boldFont, color: GRAY });
    page.drawText(d.value, { x: dx, y: y - 22, size: 10, font: font, color: DARK });
  });
  y -= dateBarH + 10;

  // Items table
  const colWidths: Record<string, number> = {
    no: CONTENT_WIDTH * 0.08, size: CONTENT_WIDTH * 0.09, qty: CONTENT_WIDTH * 0.15,
    price: CONTENT_WIDTH * 0.12, total: CONTENT_WIDTH * 0.16,
  };
  colWidths.desc = CONTENT_WIDTH - colWidths.no - colWidths.size - colWidths.qty - colWidths.price - colWidths.total;
  const colXs: Record<string, number> = {
    no: MARGIN, desc: MARGIN + colWidths.no, size: MARGIN + colWidths.no + colWidths.desc,
    qty: MARGIN + colWidths.no + colWidths.desc + colWidths.size,
    price: MARGIN + colWidths.no + colWidths.desc + colWidths.size + colWidths.qty,
    total: MARGIN + colWidths.no + colWidths.desc + colWidths.size + colWidths.qty + colWidths.price,
  };

  const drawTableHeader = () => {
    const thH = 28; const thY = y - thH;
    page.drawRectangle({ x: MARGIN, y: thY, width: CONTENT_WIDTH, height: thH, color: TABLE_GREEN });
    page.drawRectangle({ x: colXs.size, y: thY, width: colWidths.size + colWidths.qty, height: thH, color: TABLE_GRAY });
    const sepW = 1.5;
    [colXs.desc, colXs.size, colXs.qty, colXs.price, colXs.total].forEach(sx => page.drawRectangle({ x: sx - sepW / 2, y: thY, width: sepW, height: thH, color: WHITE }));
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

  const drawItems = (items: QuotationItem[], startIndex: number) => {
    drawTableHeader(); y -= 2;
    const rowH = 24;
    for (let i = 0; i < items.length; i++) {
      ensureSpace(rowH + 4);
      const item = items[i]; const isBlank = !item.productName;
      const rowY = y - rowH;
      page.drawLine({ start: { x: MARGIN, y: rowY }, end: { x: PAGE_WIDTH - MARGIN, y: rowY }, thickness: 0.5, color: rgb(0.86, 0.90, 0.91) });
      const cellY = rowY + 7;
      if (!isBlank) {
        const noStr = String(startIndex + i + 1);
        page.drawText(noStr, { x: colXs.no + (colWidths.no - serifFont.widthOfTextAtSize(noStr, 11)) / 2, y: cellY, size: 11, font: serifFont, color: DARK });
        let descText = item.productName; const maxDescW = colWidths.desc - 16;
        if (serifFont.widthOfTextAtSize(descText, 11) > maxDescW) {
          while (serifFont.widthOfTextAtSize(descText + '...', 11) > maxDescW && descText.length > 0) descText = descText.slice(0, -1);
          descText += '...';
        }
        page.drawText(descText, { x: colXs.desc + 8, y: cellY, size: 11, font: serifFont, color: DARK });
        const sizeStr = item.size || '-';
        page.drawText(sizeStr, { x: colXs.size + (colWidths.size - serifFont.widthOfTextAtSize(sizeStr, 11)) / 2, y: cellY, size: 11, font: serifFont, color: DARK });
        const qtyStr = `${item.quantity} Units`;
        page.drawText(qtyStr, { x: colXs.qty + (colWidths.qty - serifFont.widthOfTextAtSize(qtyStr, 11)) / 2, y: cellY, size: 11, font: serifFont, color: DARK });
        const priceStr = formatAmount(item.unitPrice);
        page.drawText(priceStr, { x: colXs.price + colWidths.price - serifFont.widthOfTextAtSize(priceStr, 11) - 8, y: cellY, size: 11, font: serifFont, color: DARK });
        const totalStr = formatAmount(item.total);
        page.drawText(totalStr, { x: colXs.total + colWidths.total - serifFont.widthOfTextAtSize(totalStr, 11) - 8, y: cellY, size: 11, font: serifFont, color: DARK });
      }
      y = rowY;
    }
  };

  const firstPageItems = quotation.items.slice(0, ITEMS_PER_PAGE);
  drawItems(padToMinimum(firstPageItems, 4), 0);
  const remainingItems = quotation.items.slice(ITEMS_PER_PAGE);
  for (let i = 0; i < remainingItems.length; i += ITEMS_PER_MIDDLE_PAGE) { addPage(); drawItems(remainingItems.slice(i, i + ITEMS_PER_MIDDLE_PAGE), i + ITEMS_PER_PAGE); }

  if (y < 400) addPage();

  // Totals
  y -= 30;
  const totalsW = CONTENT_WIDTH * 0.52; const totalsX = PAGE_WIDTH - MARGIN - totalsW;
  const drawTotalsRow = (label: string, value: string) => {
    const rowH = 28; const rowY = y - rowH;
    page.drawText(label, { x: totalsX + 14, y: rowY + 8, size: 11, font: font, color: GRAY });
    const vw = font.widthOfTextAtSize(value, 11);
    page.drawText(value, { x: totalsX + totalsW - vw - 14, y: rowY + 8, size: 11, font: font, color: DARK });
    page.drawLine({ start: { x: totalsX, y: rowY }, end: { x: totalsX + totalsW, y: rowY }, thickness: 1, color: rgb(0.82, 0.82, 0.82) });
    y = rowY;
  };
  drawTotalsRow('Sub-Total', formatCurrency(quotation.subtotal));
  drawTotalsRow(`Tax (${quotation.taxRate}%)`, formatCurrency(quotation.tax));
  y -= 4;
  const gtH = 32; const gtY = y - gtH;
  const gtLabelW = (totalsW * 1.15) / 2.15; const gtValW = totalsW - gtLabelW;
  page.drawRectangle({ x: totalsX, y: gtY, width: gtLabelW, height: gtH, color: TABLE_GREEN });
  page.drawText('Grand Total', { x: totalsX + 14, y: gtY + 9, size: 14, font: boldFont, color: WHITE });
  page.drawRectangle({ x: totalsX + gtLabelW, y: gtY, width: gtValW, height: gtH, color: GRAND_TOTAL_BG });
  const gtValStr = formatCurrency(quotation.total);
  page.drawText(gtValStr, { x: totalsX + gtLabelW + gtValW - boldFont.widthOfTextAtSize(gtValStr, 14) - 14, y: gtY + 9, size: 14, font: boldFont, color: DARK });
  y = gtY;

  // Footer
  let fy = 235;
  page.drawText('Notes:', { x: MARGIN, y: fy, size: 12, font: boldFont, color: DARK });
  fy -= 16;
  if (quotation.notes) fy = drawWrappedTextAt(quotation.notes, MARGIN, CONTENT_WIDTH, 10, font, DARK, fy);
  fy -= 20;
  const bottomY = Math.max(fy, 55);
  page.drawText('THANK YOU FOR CHOOSING INFIELD INNOVATIONS!', { x: MARGIN, y: bottomY, size: 11, font: boldFont, color: BRAND_GREEN });
  // Stamp
  const stampCx = PAGE_WIDTH / 2; const stampCy = bottomY + 8; const stampR = 30;
  page.drawCircle({ x: stampCx, y: stampCy, size: stampR, borderWidth: 2, borderColor: STAMP_RED, color: WHITE });
  page.drawText('INFIELD', { x: stampCx - boldFont.widthOfTextAtSize('INFIELD', 8) / 2, y: stampCy + 10, size: 8, font: boldFont, color: STAMP_RED });
  page.drawText('* * * *', { x: stampCx - font.widthOfTextAtSize('* * * *', 5) / 2, y: stampCy + 1, size: 5, font: font, color: STAMP_RED });
  page.drawText('+254 702 393 677', { x: stampCx - font.widthOfTextAtSize('+254 702 393 677', 5) / 2, y: stampCy - 7, size: 5, font: font, color: STAMP_RED });
  page.drawLine({ start: { x: stampCx - 18, y: stampCy - 12 }, end: { x: stampCx + 18, y: stampCy - 12 }, thickness: 0.5, color: STAMP_RED });
  page.drawText('DIGITAL STAMP', { x: stampCx - boldFont.widthOfTextAtSize('DIGITAL STAMP', 4) / 2, y: stampCy - 18, size: 4, font: boldFont, color: STAMP_RED });
  // Signature
  const sigX = PAGE_WIDTH - MARGIN - 140;
  page.drawLine({ start: { x: sigX, y: bottomY + 18 }, end: { x: sigX + 140, y: bottomY + 18 }, thickness: 1, color: DARK });
  if (sigImg) {
    const sigW = 120; const sigH = (sigImg.height / sigImg.width) * sigW;
    page.drawImage(sigImg, { x: sigX + (140 - sigW) / 2, y: bottomY + 20, width: sigW, height: Math.min(sigH, 40) });
  }
  const sigLabel = quotation.createdBy || 'Authorised Sign';
  page.drawText(sigLabel, { x: sigX + (140 - boldFont.widthOfTextAtSize(sigLabel, 10)) / 2, y: bottomY + 4, size: 10, font: boldFont, color: DARK });
  // Contact us
  fy = bottomY - 16;
  page.drawLine({ start: { x: MARGIN, y: fy }, end: { x: PAGE_WIDTH - MARGIN, y: fy }, thickness: 0.5, color: LIGHT_GRAY });
  fy -= 14;
  page.drawText(`Contact us: ${phone}`, { x: MARGIN, y: fy, size: 9, font: font, color: GRAY });

  return doc.save();
}

export async function downloadQuotationPDF(quotation: Quotation): Promise<void> {
  const bytes = await generateQuotationPDF(quotation);
  const filename = `Quotation_${quotation.quotationCode || quotation.id.toUpperCase()}.pdf`;
  downloadPDF(bytes, filename);
}
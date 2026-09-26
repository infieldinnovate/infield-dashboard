'use client';

import React from 'react';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { DeliveryNote, DeliveryItem } from '../../types';
import {
  formatCurrency,
  formatDate,
  getSettings,
  statusLabels,
  downloadPDF,
} from '../../lib/documentUtils';
import styles from './DeliveryNoteDocument.module.scss';

export interface DeliveryNoteDocumentActions {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const ITEMS_PER_PAGE = 12;
const ITEMS_PER_MIDDLE_PAGE = 18;

const AMBER = rgb(0.851, 0.467, 0.024);
const DARK = rgb(0.102, 0.102, 0.102);
const GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93);
const AMBER_BG = rgb(1, 0.97, 0.88);
const GREEN = rgb(0.024, 0.588, 0.412);
const EVEN_ROW = rgb(1, 0.99, 0.91);

function paginateItems(items: DeliveryItem[]): DeliveryItem[][] {
  const pages: DeliveryItem[][] = [];
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

/* === Full Header === */
function FullHeader({ note }: { note: DeliveryNote }) {
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
          <h1 className={styles.docTitle}>DELIVERY NOTE</h1>
          <p className={styles.docNumber}>{note.deliveryNumber}</p>
          <p className={styles.docDate}>{formatDate(note.shipDate)}</p>
        </div>
      </div>
    </div>
  );
}

/* === Party Grid === */
function PartyGrid({ note }: { note: DeliveryNote }) {
  return (
    <div className={styles.partyGrid}>
      <div className={styles.partyBlock}>
        <p className={styles.partyLabel}>Deliver To</p>
        <p className={styles.partyName}>{note.customerName}</p>
        {note.customerAddress && <p className={styles.partyText}>{note.customerAddress}</p>}
      </div>
      <div className={styles.partyBlock}>
        <p className={styles.partyLabel}>Recipient</p>
        <p className={styles.partyName}>{note.recipient}</p>
        {note.recipientPhone && <p className={styles.partyText}>{note.recipientPhone}</p>}
      </div>
    </div>
  );
}

/* === Metadata Box === */
function MetadataBox({ note }: { note: DeliveryNote }) {
  return (
    <div className={styles.metadataBox}>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Delivery #</span>
        <span className={styles.metaValue}>{note.deliveryNumber}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Ship Date</span>
        <span className={styles.metaValue}>{formatDate(note.shipDate)}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Carrier</span>
        <span className={styles.metaValue}>{note.carrier || 'N/A'}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Tracking #</span>
        <span className={styles.metaValue}>{note.trackingNumber || 'N/A'}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Status</span>
        <span className={styles.metaValue}>{statusLabels[note.status] || note.status}</span>
      </div>
    </div>
  );
}

/* === Items Table === */
function ItemsTable({ items }: { items: DeliveryItem[] }) {
  return (
    <table className={styles.itemsTable}>
      <thead>
        <tr>
          <th>Item</th>
          <th className={styles.numCol}>Qty Ordered</th>
          <th className={styles.numCol}>Qty Delivered</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => {
          const complete = (item.quantityDelivered ?? 0) === item.quantity;
          const partial = (item.quantityDelivered ?? 0) > 0 && (item.quantityDelivered ?? 0) < item.quantity;
          return (
            <tr key={i}>
              <td>
                <span className={styles.itemName}>{item.productName}</span>
                <span className={styles.itemDesc}>Product ID: {item.productId}</span>
              </td>
              <td className={styles.numCol}>{item.quantity}</td>
              <td className={styles.numCol}>
                <span className={
                  complete ? styles.qtyComplete : partial ? styles.qtyPartial : styles.qtyPending
                }>
                  {item.quantityDelivered}
                  {complete && <span className={styles.qtyLabel}>Complete</span>}
                  {partial && <span className={styles.qtyLabel}>Partial</span>}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* === Notes === */
function Notes({ note }: { note: DeliveryNote }) {
  if (!note.notes) return null;
  return (
    <div className={styles.notesSection}>
      <p className={styles.notesLabel}>Notes</p>
      <p className={styles.notesText}>{note.notes}</p>
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
function CompactHeader({ note }: { note: DeliveryNote }) {
  const settings = getSettings();
  return (
    <div className={styles.compactHeader}>
      <div className={styles.compactCompany}>{settings.business.businessName}</div>
      <div className={styles.compactDocInfo}>
        <span className={styles.compactTitle}>DELIVERY NOTE</span>
        <span className={styles.compactNumber}>{note.deliveryNumber}</span>
      </div>
    </div>
  );
}

/* === Status Badge === */
function StatusBadge({ status }: { status: DeliveryNote['status'] }) {
  const colorMap: Record<string, string> = {
    pending: '#f59e0b',
    shipped: '#3b82f6',
    delivered: '#10b981',
    returned: '#ef4444',
  };
  const label = statusLabels[status] || status;
  const color = colorMap[status] || '#6b7280';
  return (
    <span className={styles.statusBadge} style={{ backgroundColor: color }}>
      {label}
    </span>
  );
}

/* === A4 Layout === */
function A4Layout({ note }: { note: DeliveryNote }) {
  const pages = paginateItems(note.items);

  return (
    <div className={styles.a4Container}>
      {pages.map((pageItems, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;

        return (
          <div key={pageIndex} className={styles.a4Page}>
            {isFirst ? (
              <>
                <FullHeader note={note} />
                <PartyGrid note={note} />
                <MetadataBox note={note} />
                <ItemsTable items={pageItems} />
                {isLast && <Notes note={note} />}
                {isLast && <Signature />}
                <Footer />
              </>
            ) : (
              <>
                <CompactHeader note={note} />
                <ItemsTable items={pageItems} />
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
function ActionBar({ note, actions }: { note: DeliveryNote; actions: DeliveryNoteDocumentActions }) {
  return (
    <div className={styles.actionBar}>
      <button className={styles.actionBtn} onClick={() => printDeliveryNote(note)}>
        Print A4
      </button>
      <button className={styles.actionBtn} onClick={() => downloadDeliveryNotePDF(note)}>
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
interface DeliveryNoteDocumentProps {
  note: DeliveryNote;
  actions: DeliveryNoteDocumentActions;
}

export default function DeliveryNoteDocument({ note, actions }: DeliveryNoteDocumentProps) {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewToolbar}>
        <div className={styles.previewStatus}>
          <StatusBadge status={note.status} />
        </div>
        <ActionBar note={note} actions={actions} />
      </div>
      <div className={styles.previewBody}>
        <A4Layout note={note} />
      </div>
    </div>
  );
}

/* === Print Function === */
const printStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: A4 portrait; margin: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; }
.dn-page { width: 210mm; min-height: 297mm; padding: 15mm; position: relative; page-break-after: always; }
.dn-page:last-child { page-break-after: auto; }
.dn-header { margin-bottom: 24px; }
.dn-header-top { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #d97706; }
.dn-company { flex: 1; }
.dn-company-name { font-size: 20px; font-weight: 800; color: #d97706; margin: 0; letter-spacing: -0.02em; }
.dn-company-addr { font-size: 10px; color: #555; margin: 4px 0 0; line-height: 1.4; }
.dn-company-contact { font-size: 10px; color: #555; margin: 2px 0 0; }
.dn-title-block { text-align: right; }
.dn-title { font-size: 28px; font-weight: 800; color: #d97706; margin: 0; letter-spacing: 0.04em; line-height: 1; }
.dn-number { font-size: 12px; color: #555; margin: 6px 0 0; font-weight: 600; }
.dn-date { font-size: 10px; color: #777; margin: 2px 0 0; }
.dn-party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
.dn-party-label { font-size: 10px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px; }
.dn-party-name { font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0; }
.dn-party-text { font-size: 10px; color: #555; margin: 2px 0 0; line-height: 1.4; }
.dn-metadata { display: flex; gap: 0; margin-bottom: 24px; border-left: 4px solid #d97706; background: #fffbeb; padding: 14px 18px; border-radius: 0 6px 6px 0; }
.dn-meta-item { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.dn-meta-item + .dn-meta-item { padding-left: 20px; border-left: 1px solid #fde68a; }
.dn-meta-label { font-size: 9px; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.06em; }
.dn-meta-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }
.dn-items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
.dn-items-table thead th { background: #d97706; color: #fff; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; text-align: left; }
.dn-items-table thead th.num { text-align: center; }
.dn-items-table tbody tr { page-break-inside: avoid; }
.dn-items-table tbody td { padding: 9px 12px; font-size: 11px; border-bottom: 1px solid #e0e6ed; color: #333; }
.dn-items-table tbody td.num { text-align: center; }
.dn-items-table tbody tr:nth-child(even) { background: #fefce8; }
.dn-item-name { font-weight: 600; color: #1a1a1a; }
.dn-item-desc { display: block; font-size: 9px; color: #999; margin-top: 2px; }
.dn-qty-complete { color: #059669; font-weight: 600; }
.dn-qty-partial { color: #d97706; font-weight: 600; }
.dn-qty-pending { color: #999; font-weight: 500; }
.dn-qty-label { font-size: 9px; margin-left: 4px; }
.dn-notes { margin-bottom: 20px; }
.dn-notes-label { font-size: 10px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; }
.dn-notes-text { font-size: 10px; color: #555; margin: 0; line-height: 1.6; }
.dn-signature { display: flex; justify-content: space-between; margin-top: 48px; margin-bottom: 20px; }
.dn-sig-block { width: 200px; }
.dn-sig-line { border-bottom: 1px solid #999; height: 40px; }
.dn-sig-label { font-size: 9px; color: #666; margin-top: 4px; text-align: center; }
.dn-footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; border-top: 1px solid #e0e6ed; padding-top: 8px; }
.dn-footer-contact { font-size: 9px; color: #999; }
.dn-footer-text { font-size: 9px; color: #999; margin-top: 2px; }
.dn-compact-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #d97706; }
.dn-compact-company { font-size: 14px; font-weight: 700; color: #d97706; }
.dn-compact-info { text-align: right; }
.dn-compact-title { font-size: 12px; color: #555; font-weight: 600; }
.dn-compact-number { font-size: 10px; color: #777; display: block; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildItemsTable(items: DeliveryItem[]): string {
  return `<table class="dn-items-table">
    <thead><tr>
      <th>Item</th>
      <th class="num">Qty Ordered</th>
      <th class="num">Qty Delivered</th>
    </tr></thead>
    <tbody>
      ${items.map((item) => {
        const complete = (item.quantityDelivered ?? 0) === item.quantity;
        const partial = (item.quantityDelivered ?? 0) > 0 && (item.quantityDelivered ?? 0) < item.quantity;
        const cls = complete ? 'dn-qty-complete' : partial ? 'dn-qty-partial' : 'dn-qty-pending';
        const lbl = complete ? ' <span class="dn-qty-label">Complete</span>' : partial ? ' <span class="dn-qty-label">Partial</span>' : '';
        return `<tr>
          <td><span class="dn-item-name">${escapeHtml(item.productName)}</span><span class="dn-item-desc">Product ID: ${escapeHtml(item.productId)}</span></td>
          <td class="num">${item.quantity}</td>
          <td class="num"><span class="${cls}">${item.quantityDelivered}${lbl}</span></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

function buildDeliveryNoteHTML(note: DeliveryNote): string {
  const settings = getSettings();
  const { businessName, address, phone, email } = settings.business;
  const footerText = settings.print.footerText || 'Thank you for your business!';
  const pages = paginateItems(note.items);

  const headerFull = `<div class="dn-header">
    <div class="dn-header-top">
      <div class="dn-company">
        <h2 class="dn-company-name">${escapeHtml(businessName)}</h2>
        <p class="dn-company-addr">${escapeHtml(address)}</p>
        <p class="dn-company-contact">${escapeHtml(phone)} | ${escapeHtml(email)}</p>
      </div>
      <div class="dn-title-block">
        <h1 class="dn-title">DELIVERY NOTE</h1>
        <p class="dn-number">${escapeHtml(note.deliveryNumber)}</p>
        <p class="dn-date">${formatDate(note.shipDate)}</p>
      </div>
    </div>
  </div>`;

  const partyGrid = `<div class="dn-party-grid">
    <div>
      <p class="dn-party-label">Deliver To</p>
      <p class="dn-party-name">${escapeHtml(note.customerName)}</p>
      ${note.customerAddress ? `<p class="dn-party-text">${escapeHtml(note.customerAddress)}</p>` : ''}
    </div>
    <div>
      <p class="dn-party-label">Recipient</p>
      <p class="dn-party-name">${escapeHtml(note.recipient)}</p>
      ${note.recipientPhone ? `<p class="dn-party-text">${escapeHtml(note.recipientPhone)}</p>` : ''}
    </div>
  </div>`;

  const metadataBox = `<div class="dn-metadata">
    <div class="dn-meta-item"><span class="dn-meta-label">Delivery #</span><span class="dn-meta-value">${escapeHtml(note.deliveryNumber)}</span></div>
    <div class="dn-meta-item"><span class="dn-meta-label">Ship Date</span><span class="dn-meta-value">${formatDate(note.shipDate)}</span></div>
    <div class="dn-meta-item"><span class="dn-meta-label">Carrier</span><span class="dn-meta-value">${escapeHtml(note.carrier || 'N/A')}</span></div>
    <div class="dn-meta-item"><span class="dn-meta-label">Tracking #</span><span class="dn-meta-value">${escapeHtml(note.trackingNumber || 'N/A')}</span></div>
    <div class="dn-meta-item"><span class="dn-meta-label">Status</span><span class="dn-meta-value">${escapeHtml(statusLabels[note.status] || note.status)}</span></div>
  </div>`;

  const notesHtml = note.notes
    ? `<div class="dn-notes"><p class="dn-notes-label">Notes</p><p class="dn-notes-text">${escapeHtml(note.notes)}</p></div>`
    : '';

  const signatureHtml = `<div class="dn-signature">
    <div class="dn-sig-block"><div class="dn-sig-line"></div><p class="dn-sig-label">Customer Signature</p></div>
    <div class="dn-sig-block"><div class="dn-sig-line"></div><p class="dn-sig-label">Authorized Signature</p></div>
  </div>`;

  const footerHtml = `<div class="dn-footer"><div class="dn-footer-contact">${escapeHtml(businessName)} | ${escapeHtml(phone)} | ${escapeHtml(email)}</div><div class="dn-footer-text">${escapeHtml(footerText)}</div></div>`;

  const headerCompact = `<div class="dn-compact-header"><div class="dn-compact-company">${escapeHtml(businessName)}</div><div class="dn-compact-info"><span class="dn-compact-title">DELIVERY NOTE</span><span class="dn-compact-number">${escapeHtml(note.deliveryNumber)}</span></div></div>`;

  return pages.map((pageItems, i) => {
    const isFirst = i === 0;
    const isLast = i === pages.length - 1;
    if (isFirst) {
      return `<div class="dn-page">${headerFull}${partyGrid}${metadataBox}${buildItemsTable(pageItems)}${isLast ? notesHtml + signatureHtml : ''}${footerHtml}</div>`;
    }
    return `<div class="dn-page">${headerCompact}${buildItemsTable(pageItems)}${isLast ? signatureHtml : ''}${isLast ? footerHtml : `<div class="dn-footer"><div class="dn-footer-contact">${escapeHtml(businessName)} | ${escapeHtml(phone)} | ${escapeHtml(email)}</div></div>`}</div>`;
  }).join('');
}

export function printDeliveryNote(note: DeliveryNote): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Delivery Note ${note.deliveryNumber}</title><style>${printStyles}</style></head><body>${buildDeliveryNoteHTML(note)}</body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

/* === PDF Generation === */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

export async function generateDeliveryNotePDF(note: DeliveryNote): Promise<Uint8Array> {
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
    page.drawText(businessName, { x: MARGIN, y, size: 12, font: boldFont, color: AMBER });
    page.drawText(`DELIVERY NOTE - ${note.deliveryNumber}`, { x: PAGE_WIDTH - MARGIN - 220, y, size: 10, font, color: GRAY });
    y -= 20;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 4 }, thickness: 1, color: AMBER });
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
  page.drawText(businessName, { x: MARGIN, y, size: 18, font: boldFont, color: AMBER });
  y -= 22;
  y = drawWrappedText(address, MARGIN, 250, 9, font, GRAY);
  y = drawText(`${phone} | ${email}`, MARGIN, 9, font, GRAY);
  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 2, color: AMBER });
  y -= 16;

  const titleX = PAGE_WIDTH - MARGIN - 140;
  let titleY = PAGE_HEIGHT - MARGIN - 4;
  page.drawText('DELIVERY NOTE', { x: titleX, y: titleY, size: 22, font: boldFont, color: AMBER });
  titleY -= 24;
  page.drawText(note.deliveryNumber, { x: titleX, y: titleY, size: 11, font, color: GRAY });
  titleY -= 14;
  page.drawText(formatDate(note.shipDate), { x: titleX, y: titleY, size: 9, font, color: GRAY });
  y = Math.min(y, titleY - 20);

  // Party grid
  page.drawText('DELIVER TO', { x: MARGIN, y, size: 9, font: boldFont, color: AMBER });
  y -= 12;
  page.drawText(note.customerName, { x: MARGIN, y, size: 11, font: boldFont, color: DARK });
  y -= 14;
  if (note.customerAddress) {
    y = drawWrappedText(note.customerAddress, MARGIN, 220, 9, font, GRAY);
  }

  const recipientX = PAGE_WIDTH / 2;
  let ry = y + 26;
  page.drawText('RECIPIENT', { x: recipientX, y: ry, size: 9, font: boldFont, color: AMBER });
  ry -= 12;
  page.drawText(note.recipient, { x: recipientX, y: ry, size: 11, font: boldFont, color: DARK });
  if (note.recipientPhone) {
    ry -= 14;
    page.drawText(note.recipientPhone, { x: recipientX, y: ry, size: 9, font, color: GRAY });
  }
  y -= 10;

  // Metadata box
  page.drawRectangle({ x: MARGIN, y: y - 30, width: PAGE_WIDTH - MARGIN * 2, height: 34, color: AMBER_BG });
  page.drawRectangle({ x: MARGIN, y: y - 30, width: 4, height: 34, color: AMBER });

  const metaItems = [
    { label: 'Delivery #', value: note.deliveryNumber },
    { label: 'Ship Date', value: formatDate(note.shipDate) },
    { label: 'Carrier', value: note.carrier || 'N/A' },
    { label: 'Tracking #', value: note.trackingNumber || 'N/A' },
    { label: 'Status', value: statusLabels[note.status] || note.status },
  ];
  const metaColW = (PAGE_WIDTH - MARGIN * 2 - 4) / metaItems.length;
  metaItems.forEach((m, i) => {
    const mx = MARGIN + 4 + i * metaColW + 8;
    page.drawText(m.label.toUpperCase(), { x: mx, y: y - 8, size: 7, font: boldFont, color: GRAY });
    const valStr = m.value.length > 16 ? m.value.substring(0, 14) + '...' : m.value;
    page.drawText(valStr, { x: mx, y: y - 22, size: 9, font, color: DARK });
  });
  y -= 40;

  // Items table
  const cols = [
    { name: 'Item', x: MARGIN, w: 300 },
    { name: 'Qty Ordered', x: MARGIN + 310, w: 80 },
    { name: 'Qty Delivered', x: MARGIN + 400, w: 80 },
  ];

  page.drawRectangle({ x: MARGIN, y: y - 16, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: AMBER });
  for (const col of cols) {
    const alignCenter = col.name !== 'Item';
    let tx = col.x;
    if (alignCenter) {
      tx = col.x + col.w / 2 - boldFont.widthOfTextAtSize(col.name.toUpperCase(), 8) / 2;
    }
    page.drawText(col.name.toUpperCase(), { x: tx, y: y - 12, size: 8, font: boldFont, color: rgb(1, 1, 1) });
  }
  y -= 20;

  const allItems = note.items;
  const firstPageItems = allItems.slice(0, ITEMS_PER_PAGE);
  const remainingItems = allItems.slice(ITEMS_PER_PAGE);

  const drawItems = (items: DeliveryItem[], startIndex: number) => {
    for (let i = 0; i < items.length; i++) {
      ensureSpace(26);
      const item = items[i];
      if (i % 2 === 0) {
        page.drawRectangle({ x: MARGIN, y: y - 12, width: PAGE_WIDTH - MARGIN * 2, height: 18, color: EVEN_ROW });
      }
      page.drawText(item.productName, { x: cols[0].x, y: y - 8, size: 9, font, color: DARK });
      page.drawText(String(item.quantity), { x: cols[1].x + cols[1].w / 2 - font.widthOfTextAtSize(String(item.quantity), 9) / 2, y: y - 8, size: 9, font, color: DARK });
      const deliveredStr = String(item.quantityDelivered ?? 0);
      const complete = (item.quantityDelivered ?? 0) === item.quantity;
      const partial = (item.quantityDelivered ?? 0) > 0 && (item.quantityDelivered ?? 0) < item.quantity;
      const deliveredColor = complete ? GREEN : partial ? AMBER : GRAY;
      page.drawText(deliveredStr, { x: cols[2].x + cols[2].w / 2 - font.widthOfTextAtSize(deliveredStr, 9) / 2, y: y - 8, size: 9, font: boldFont, color: deliveredColor });
      y -= 18;
    }
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: GRAY });
    y -= 16;
  };

  drawItems(firstPageItems, 0);

  for (let i = 0; i < remainingItems.length; i += ITEMS_PER_MIDDLE_PAGE) {
    addPage();
    drawItems(remainingItems.slice(i, i + ITEMS_PER_MIDDLE_PAGE), i + ITEMS_PER_PAGE);
  }

  // Notes
  if (note.notes) {
    ensureSpace(30);
    page.drawText('NOTES', { x: MARGIN, y, size: 9, font: boldFont, color: AMBER });
    y -= 12;
    y = drawWrappedText(note.notes, MARGIN, PAGE_WIDTH - MARGIN * 2, 9, font, GRAY);
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

export async function downloadDeliveryNotePDF(note: DeliveryNote): Promise<void> {
  const bytes = await generateDeliveryNotePDF(note);
  const filename = `DeliveryNote_${note.deliveryNumber}.pdf`;
  downloadPDF(bytes, filename);
}

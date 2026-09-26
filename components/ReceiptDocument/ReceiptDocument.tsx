'use client';

import React from 'react';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { Receipt } from '../../types';
import {
  formatCurrency,
  formatDate,
  getSettings,
  paymentMethodLabels,
  downloadPDF,
} from '../../lib/documentUtils';
import styles from './ReceiptDocument.module.scss';

export interface ReceiptDocumentActions {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const EMERALD = rgb(0.024, 0.588, 0.412);
const DARK = rgb(0.102, 0.102, 0.102);
const GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93);
const MINT_BG = rgb(0.925, 0.992, 0.957);
const MINT_BORDER = rgb(0.043, 0.608, 0.412);

/* === Full Header === */
function FullHeader({ receipt }: { receipt: Receipt }) {
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
          <h1 className={styles.docTitle}>RECEIPT</h1>
          <p className={styles.docNumber}>{receipt.receiptNumber}</p>
          <p className={styles.docDate}>{formatDate(receipt.date)}</p>
        </div>
      </div>
    </div>
  );
}

/* === Customer Info === */
function CustomerInfo({ receipt }: { receipt: Receipt }) {
  return (
    <div className={styles.customerInfo}>
      <p className={styles.customerLabel}>Received From</p>
      <p className={styles.customerName}>{receipt.customerName}</p>
    </div>
  );
}

/* === Metadata Box === */
function MetadataBox({ receipt }: { receipt: Receipt }) {
  return (
    <div className={styles.metadataBox}>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Receipt #</span>
        <span className={styles.metaValue}>{receipt.receiptNumber}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Date</span>
        <span className={styles.metaValue}>{formatDate(receipt.date)}</span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Payment Method</span>
        <span className={styles.metaValue}>
          {paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}
        </span>
      </div>
      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Reference</span>
        <span className={styles.metaValue}>{receipt.reference || 'N/A'}</span>
      </div>
    </div>
  );
}

/* === Amount Box === */
function AmountBox({ receipt }: { receipt: Receipt }) {
  return (
    <div className={styles.amountBox}>
      <p className={styles.amountLabel}>Amount Received</p>
      <p className={styles.amountValue}>{formatCurrency(receipt.amount)}</p>
      <p className={styles.amountMethod}>
        via {paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}
      </p>
    </div>
  );
}

/* === Notes === */
function Notes({ receipt }: { receipt: Receipt }) {
  if (!receipt.notes) return null;
  return (
    <div className={styles.notesSection}>
      <p className={styles.notesLabel}>Notes</p>
      <p className={styles.notesText}>{receipt.notes}</p>
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
function CompactHeader({ receipt }: { receipt: Receipt }) {
  const settings = getSettings();
  return (
    <div className={styles.compactHeader}>
      <div className={styles.compactCompany}>{settings.business.businessName}</div>
      <div className={styles.compactDocInfo}>
        <span className={styles.compactTitle}>RECEIPT</span>
        <span className={styles.compactNumber}>{receipt.receiptNumber}</span>
      </div>
    </div>
  );
}

/* === Status Badge === */
function StatusBadge() {
  return (
    <span className={styles.statusBadge} style={{ backgroundColor: '#059669' }}>
      Paid
    </span>
  );
}

/* === A4 Layout === */
function A4Layout({ receipt }: { receipt: Receipt }) {
  return (
    <div className={styles.a4Container}>
      <div className={styles.a4Page}>
        <FullHeader receipt={receipt} />
        <CustomerInfo receipt={receipt} />
        <MetadataBox receipt={receipt} />
        <AmountBox receipt={receipt} />
        <Notes receipt={receipt} />
        <Footer />
      </div>
    </div>
  );
}

/* === Action Bar === */
function ActionBar({ receipt, actions }: { receipt: Receipt; actions: ReceiptDocumentActions }) {
  return (
    <div className={styles.actionBar}>
      <button className={styles.actionBtn} onClick={() => printReceipt(receipt)}>
        Print A4
      </button>
      <button className={styles.actionBtn} onClick={() => printReceiptThermal(receipt)}>
        Thermal Print (57mm)
      </button>
      <button className={styles.actionBtn} onClick={() => downloadReceiptPDF(receipt)}>
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
interface ReceiptDocumentProps {
  receipt: Receipt;
  actions: ReceiptDocumentActions;
}

export default function ReceiptDocument({ receipt, actions }: ReceiptDocumentProps) {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewToolbar}>
        <div className={styles.previewStatus}>
          <StatusBadge />
        </div>
        <ActionBar receipt={receipt} actions={actions} />
      </div>
      <div className={styles.previewBody}>
        <A4Layout receipt={receipt} />
      </div>
    </div>
  );
}

/* === Print Function (A4) === */
const printStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: A4 portrait; margin: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; }
.rcpt-page { width: 210mm; min-height: 297mm; padding: 15mm; position: relative; page-break-after: always; }
.rcpt-page:last-child { page-break-after: auto; }
.rcpt-header { margin-bottom: 24px; }
.rcpt-header-top { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid #059669; }
.rcpt-company { flex: 1; }
.rcpt-company-name { font-size: 20px; font-weight: 800; color: #059669; margin: 0; letter-spacing: -0.02em; }
.rcpt-company-addr { font-size: 10px; color: #555; margin: 4px 0 0; line-height: 1.4; }
.rcpt-company-contact { font-size: 10px; color: #555; margin: 2px 0 0; }
.rcpt-title-block { text-align: right; }
.rcpt-title { font-size: 32px; font-weight: 800; color: #059669; margin: 0; letter-spacing: 0.04em; line-height: 1; }
.rcpt-number { font-size: 12px; color: #555; margin: 6px 0 0; font-weight: 600; }
.rcpt-date { font-size: 10px; color: #777; margin: 2px 0 0; }
.rcpt-customer { margin-bottom: 20px; }
.rcpt-customer-label { font-size: 10px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; }
.rcpt-customer-name { font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0; }
.rcpt-metadata { display: flex; gap: 0; margin-bottom: 24px; border-left: 4px solid #059669; background: #f0fdf4; padding: 14px 18px; border-radius: 0 6px 6px 0; }
.rcpt-meta-item { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.rcpt-meta-item + .rcpt-meta-item { padding-left: 20px; border-left: 1px solid #d1fae5; }
.rcpt-meta-label { font-size: 9px; font-weight: 700; color: #777; text-transform: uppercase; letter-spacing: 0.06em; }
.rcpt-meta-value { font-size: 12px; font-weight: 600; color: #1a1a1a; }
.rcpt-amount-box { text-align: center; margin: 32px auto 28px; width: 320px; border: 2px solid #059669; border-radius: 12px; padding: 24px 20px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
.rcpt-amount-label { font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 8px; }
.rcpt-amount-value { font-size: 36px; font-weight: 800; color: #065f46; margin: 0; line-height: 1; }
.rcpt-amount-method { font-size: 12px; color: #047857; margin: 10px 0 0; font-weight: 600; }
.rcpt-notes { margin-bottom: 20px; }
.rcpt-notes-label { font-size: 10px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 6px; }
.rcpt-notes-text { font-size: 10px; color: #555; margin: 0; line-height: 1.6; }
.rcpt-footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; border-top: 1px solid #e0e6ed; padding-top: 8px; }
.rcpt-footer-contact { font-size: 9px; color: #999; }
.rcpt-footer-text { font-size: 9px; color: #999; margin-top: 2px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReceiptHTML(receipt: Receipt): string {
  const settings = getSettings();
  const { businessName, address, phone, email } = settings.business;
  const footerText = settings.print.footerText || 'Thank you for your business!';
  const methodLabel = paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod;

  const headerFull = `<div class="rcpt-header">
    <div class="rcpt-header-top">
      <div class="rcpt-company">
        <h2 class="rcpt-company-name">${escapeHtml(businessName)}</h2>
        <p class="rcpt-company-addr">${escapeHtml(address)}</p>
        <p class="rcpt-company-contact">${escapeHtml(phone)} | ${escapeHtml(email)}</p>
      </div>
      <div class="rcpt-title-block">
        <h1 class="rcpt-title">RECEIPT</h1>
        <p class="rcpt-number">${escapeHtml(receipt.receiptNumber)}</p>
        <p class="rcpt-date">${formatDate(receipt.date)}</p>
      </div>
    </div>
  </div>`;

  const customerInfo = `<div class="rcpt-customer"><p class="rcpt-customer-label">Received From</p><p class="rcpt-customer-name">${escapeHtml(receipt.customerName)}</p></div>`;

  const metadataBox = `<div class="rcpt-metadata">
    <div class="rcpt-meta-item"><span class="rcpt-meta-label">Receipt #</span><span class="rcpt-meta-value">${escapeHtml(receipt.receiptNumber)}</span></div>
    <div class="rcpt-meta-item"><span class="rcpt-meta-label">Date</span><span class="rcpt-meta-value">${formatDate(receipt.date)}</span></div>
    <div class="rcpt-meta-item"><span class="rcpt-meta-label">Payment Method</span><span class="rcpt-meta-value">${escapeHtml(methodLabel)}</span></div>
    <div class="rcpt-meta-item"><span class="rcpt-meta-label">Reference</span><span class="rcpt-meta-value">${escapeHtml(receipt.reference || 'N/A')}</span></div>
  </div>`;

  const amountBox = `<div class="rcpt-amount-box">
    <p class="rcpt-amount-label">Amount Received</p>
    <p class="rcpt-amount-value">${formatCurrency(receipt.amount)}</p>
    <p class="rcpt-amount-method">via ${escapeHtml(methodLabel)}</p>
  </div>`;

  const notesHtml = receipt.notes
    ? `<div class="rcpt-notes"><p class="rcpt-notes-label">Notes</p><p class="rcpt-notes-text">${escapeHtml(receipt.notes)}</p></div>`
    : '';

  const footerHtml = `<div class="rcpt-footer"><div class="rcpt-footer-contact">${escapeHtml(businessName)} | ${escapeHtml(phone)} | ${escapeHtml(email)}</div><div class="rcpt-footer-text">${escapeHtml(footerText)}</div></div>`;

  return `<div class="rcpt-page">${headerFull}${customerInfo}${metadataBox}${amountBox}${notesHtml}${footerHtml}</div>`;
}

export function printReceipt(receipt: Receipt): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Receipt ${receipt.receiptNumber}</title><style>${printStyles}</style></head><body>${buildReceiptHTML(receipt)}</body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

/* === Thermal Print (57mm) === */
const thermalStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: 57mm auto; margin: 0; }
body { font-family: 'Courier New', monospace; font-size: 10px; color: #000; background: #fff; }
.thermal { width: 57mm; padding: 4mm 2mm; }
.thermal-business { text-align: center; font-weight: 700; font-size: 12px; }
.thermal-addr { text-align: center; font-size: 9px; margin-top: 2px; }
.thermal-phone { text-align: center; font-size: 9px; }
.thermal-divider { border-top: 1px dashed #000; margin: 6px 0; }
.thermal-info-row { display: flex; justify-content: space-between; font-size: 9px; }
.thermal-amount-box { text-align: center; border: 1px dashed #059669; border-radius: 4px; padding: 8px 4px; margin: 6px 0; background: #f0fdf4; }
.thermal-amount-label { font-size: 8px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.04em; }
.thermal-amount-value { font-size: 16px; font-weight: 700; color: #065f46; margin-top: 2px; }
.thermal-payment-method { margin-top: 4px; font-size: 9px; text-align: center; }
.thermal-thankyou { text-align: center; margin-top: 8px; }
.thermal-thankyou p { margin: 2px 0; }
.thermal-powered { font-size: 8px; color: #999; }
.thermal-cut { text-align: center; font-size: 8px; color: #999; margin-top: 8px; border-top: 1px dashed #999; padding-top: 4px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

function buildThermalHTML(receipt: Receipt): string {
  const settings = getSettings();
  const { businessName, address, phone } = settings.business;
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const methodLabel = paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod;

  return `<div class="thermal">
    <div class="thermal-business">${escapeHtml(businessName.toUpperCase())}</div>
    <div class="thermal-addr">${escapeHtml(address)}</div>
    <div class="thermal-phone">${escapeHtml(phone)}</div>
    <div class="thermal-divider"></div>
    <div class="thermal-info-row"><span>Receipt #</span><span>${escapeHtml(receipt.receiptNumber)}</span></div>
    <div class="thermal-info-row"><span>Date</span><span>${formatDate(receipt.date)}</span></div>
    <div class="thermal-info-row"><span>Time</span><span>${time}</span></div>
    <div class="thermal-info-row"><span>Customer</span><span>${escapeHtml(receipt.customerName)}</span></div>
    <div class="thermal-info-row"><span>Reference</span><span>${escapeHtml(receipt.reference || 'N/A')}</span></div>
    <div class="thermal-divider"></div>
    <div class="thermal-amount-box">
      <div class="thermal-amount-label">Amount Received</div>
      <div class="thermal-amount-value">${formatCurrency(receipt.amount)}</div>
    </div>
    <div class="thermal-payment-method">Payment: ${escapeHtml(methodLabel)}</div>
    <div class="thermal-divider"></div>
    <div class="thermal-thankyou">
      <p>THANK YOU!</p>
      <p>Please come again</p>
      <p class="thermal-powered">Powered by ${escapeHtml(businessName)}</p>
    </div>
    <div class="thermal-cut">--- tear here ---</div>
  </div>`;
}

export function printReceiptThermal(receipt: Receipt): void {
  const printWindow = window.open('', '_blank', 'width=240,height=600');
  if (!printWindow) return;
  printWindow.document.write(`<!DOCTYPE html><html><head><title>Thermal ${receipt.receiptNumber}</title><style>${thermalStyles}</style></head><body>${buildThermalHTML(receipt)}</body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

/* === PDF Generation === */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

export async function generateReceiptPDF(receipt: Receipt): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const settings = getSettings();
  const { businessName, address, phone, email } = settings.business;
  const footerText = settings.print.footerText || 'Thank you for your business!';
  const methodLabel = paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod;

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

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
  page.drawText(businessName, { x: MARGIN, y, size: 18, font: boldFont, color: EMERALD });
  y -= 22;
  y = drawWrappedText(address, MARGIN, 250, 9, font, GRAY);
  y = drawText(`${phone} | ${email}`, MARGIN, 9, font, GRAY);
  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 2, color: EMERALD });
  y -= 16;

  const titleX = PAGE_WIDTH - MARGIN - 120;
  let titleY = PAGE_HEIGHT - MARGIN - 4;
  page.drawText('RECEIPT', { x: titleX, y: titleY, size: 24, font: boldFont, color: EMERALD });
  titleY -= 26;
  page.drawText(receipt.receiptNumber, { x: titleX, y: titleY, size: 11, font, color: GRAY });
  titleY -= 14;
  page.drawText(formatDate(receipt.date), { x: titleX, y: titleY, size: 9, font, color: GRAY });
  y = Math.min(y, titleY - 20);

  // Customer info
  page.drawText('RECEIVED FROM', { x: MARGIN, y, size: 9, font: boldFont, color: EMERALD });
  y -= 12;
  page.drawText(receipt.customerName, { x: MARGIN, y, size: 11, font: boldFont, color: DARK });
  y -= 16;

  // Metadata box
  page.drawRectangle({ x: MARGIN, y: y - 34, width: PAGE_WIDTH - MARGIN * 2, height: 38, color: MINT_BG });
  page.drawRectangle({ x: MARGIN, y: y - 34, width: 4, height: 38, color: EMERALD });

  const metaItems = [
    { label: 'Receipt #', value: receipt.receiptNumber },
    { label: 'Date', value: formatDate(receipt.date) },
    { label: 'Payment Method', value: methodLabel },
    { label: 'Reference', value: receipt.reference || 'N/A' },
  ];
  const metaColW = (PAGE_WIDTH - MARGIN * 2 - 4) / metaItems.length;
  metaItems.forEach((m, i) => {
    const mx = MARGIN + 4 + i * metaColW + 10;
    page.drawText(m.label.toUpperCase(), { x: mx, y: y - 8, size: 8, font: boldFont, color: GRAY });
    const valStr = m.value.length > 18 ? m.value.substring(0, 16) + '...' : m.value;
    page.drawText(valStr, { x: mx, y: y - 22, size: 10, font, color: DARK });
  });
  y -= 44;

  // Amount box
  const boxW = 240, boxH = 70;
  const boxX = (PAGE_WIDTH - boxW) / 2;
  page.drawRectangle({ x: boxX, y: y - boxH, width: boxW, height: boxH, color: MINT_BG });
  page.drawRectangle({ x: boxX, y: y - boxH, width: boxW, height: boxH, borderColor: MINT_BORDER, borderWidth: 1.5 });
  page.drawText('AMOUNT RECEIVED', { x: boxX + (boxW - boldFont.widthOfTextAtSize('AMOUNT RECEIVED', 10)) / 2, y: y - 18, size: 10, font: boldFont, color: EMERALD });
  const amountStr = formatCurrency(receipt.amount);
  page.drawText(amountStr, { x: boxX + (boxW - boldFont.widthOfTextAtSize(amountStr, 20)) / 2, y: y - 44, size: 20, font: boldFont, color: rgb(0.024, 0.373, 0.275) });
  const methodStr = `via ${methodLabel}`;
  page.drawText(methodStr, { x: boxX + (boxW - font.widthOfTextAtSize(methodStr, 9)) / 2, y: y - 60, size: 9, font, color: EMERALD });
  y -= boxH + 20;

  // Notes
  if (receipt.notes) {
    page.drawText('NOTES', { x: MARGIN, y, size: 9, font: boldFont, color: EMERALD });
    y -= 12;
    y = drawWrappedText(receipt.notes, MARGIN, PAGE_WIDTH - MARGIN * 2, 9, font, GRAY);
    y -= 8;
  }

  // Footer
  const footerY = MARGIN - 20;
  page.drawLine({ start: { x: MARGIN, y: footerY + 14 }, end: { x: PAGE_WIDTH - MARGIN, y: footerY + 14 }, thickness: 0.5, color: LIGHT_GRAY });
  page.drawText(`${businessName} | ${phone} | ${email}`, { x: MARGIN, y: footerY, size: 8, font, color: GRAY });
  page.drawText(footerText, { x: MARGIN, y: footerY - 12, size: 8, font, color: GRAY });

  return doc.save();
}

export async function downloadReceiptPDF(receipt: Receipt): Promise<void> {
  const bytes = await generateReceiptPDF(receipt);
  const filename = `Receipt_${receipt.receiptNumber}.pdf`;
  downloadPDF(bytes, filename);
}

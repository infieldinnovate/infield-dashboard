import type { DocumentConfig, DocumentItem } from './types';
import { getSettings, formatCurrency, formatDate, formatDateShort, statusLabels, paymentMethodLabels } from './types';

const printStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: A4 portrait; margin: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; }
.doc-page { width: 210mm; min-height: 297mm; padding: 15mm; position: relative; page-break-after: always; }
.doc-page:last-child { page-break-after: auto; }
.doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.doc-company-name { font-size: 18px; font-weight: 700; color: #21458a; }
.doc-company-addr { font-size: 10px; color: #666; margin-top: 2px; }
.doc-company-contact { font-size: 10px; color: #666; margin-top: 2px; }
.doc-title-block { text-align: right; }
.doc-title { font-size: 28px; font-weight: 700; color: #21458a; }
.doc-number { font-size: 12px; color: #666; margin-top: 4px; }
.doc-date { font-size: 10px; color: #666; margin-top: 2px; }
.compact-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e5e5; }
.compact-company { font-size: 14px; font-weight: 700; color: #21458a; }
.compact-title { font-size: 12px; color: #666; }
.compact-number { font-size: 10px; color: #999; }
.doc-party { margin-bottom: 16px; }
.doc-party-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
.doc-party-name { font-size: 12px; font-weight: 600; margin-top: 4px; }
.doc-party-text { font-size: 10px; color: #666; margin-top: 2px; }
.doc-party-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
.doc-metadata { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 6px; }
.doc-meta-row { display: flex; gap: 4px; font-size: 10px; }
.doc-meta-label { color: #666; }
.doc-meta-value { font-weight: 600; }
.doc-items-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
.doc-items-table thead th { background: #21458a; color: #fff; padding: 8px 10px; font-size: 10px; text-align: left; font-weight: 600; }
.doc-items-table thead th.num { text-align: right; }
.doc-items-table tbody tr { page-break-inside: avoid; }
.doc-items-table tbody td { padding: 8px 10px; font-size: 10px; border-bottom: 1px solid #eee; }
.doc-items-table tbody td.num { text-align: right; }
.doc-items-table tbody tr:nth-child(even) { background: #f9f9f9; }
.qty-complete { color: #10b981; font-weight: 600; }
.qty-partial { color: #f59e0b; font-weight: 600; }
.qty-label { font-size: 9px; }
.doc-totals { width: 250px; margin-left: auto; margin-bottom: 16px; }
.doc-totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
.doc-totals-row.grand { border-top: 2px solid #21458a; padding-top: 8px; margin-top: 4px; font-weight: 700; font-size: 13px; }
.doc-totals-row.balance { color: #ef4444; font-weight: 600; }
.doc-notes { margin-bottom: 16px; }
.doc-notes-label { font-size: 10px; font-weight: 600; color: #666; }
.doc-notes-text { font-size: 10px; color: #333; margin-top: 4px; }
.doc-amount-box { text-align: center; border: 2px solid #21458a; border-radius: 8px; padding: 16px; margin: 16px auto; width: 300px; }
.doc-amount-label { font-size: 11px; color: #666; }
.doc-amount-value { font-size: 22px; font-weight: 700; color: #21458a; margin-top: 4px; }
.doc-amount-method { font-size: 10px; color: #666; margin-top: 4px; }
.doc-signature { display: flex; justify-content: space-between; margin-top: 40px; }
.doc-signature-block { width: 200px; }
.doc-signature-line { border-bottom: 1px solid #999; height: 40px; }
.doc-signature-label { font-size: 9px; color: #666; margin-top: 4px; text-align: center; }
.doc-footer { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; border-top: 1px solid #eee; padding-top: 8px; }
.doc-footer-contact { font-size: 9px; color: #999; }
.doc-footer-text { font-size: 9px; color: #999; margin-top: 2px; }

/* Thermal 57mm */
.thermal { width: 57mm; padding: 4mm 2mm; font-family: 'Courier New', monospace; font-size: 10px; color: #000; }
.thermal-business { text-align: center; font-weight: 700; font-size: 12px; }
.thermal-addr { text-align: center; font-size: 9px; margin-top: 2px; }
.thermal-phone { text-align: center; font-size: 9px; }
.thermal-divider { border-top: 1px dashed #000; margin: 6px 0; }
.thermal-info-row { display: flex; justify-content: space-between; font-size: 9px; }
.thermal-item-name { font-size: 10px; font-weight: 600; }
.thermal-item-row { display: flex; justify-content: space-between; font-size: 9px; }
.thermal-total-row { display: flex; justify-content: space-between; font-size: 10px; }
.thermal-grand-total { font-weight: 700; font-size: 12px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
.thermal-thankyou { text-align: center; margin-top: 8px; }
.thermal-cut { text-align: center; font-size: 8px; color: #999; margin-top: 8px; border-top: 1px dashed #999; padding-top: 4px; }

@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

function openPrintWindow(content: string, title: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`
<!DOCTYPE html>
<html><head><title>${title}</title>
<style>${printStyles}</style>
</head><body>${content}</body></html>
  `);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
}

function buildA4HTML(config: DocumentConfig): string {
  const settings = getSettings();
  const { businessName, address, phone, email } = settings.business;
  const isDeliveryNote = config.type === 'delivery-note';
  const isReceipt = config.type === 'receipt';
  const ITEMS_PER_PAGE = 12;
  const ITEMS_PER_MIDDLE = 18;

  const pages: DocumentItem[][] = [];
  if (config.items.length <= ITEMS_PER_PAGE) {
    pages.push(config.items);
  } else {
    pages.push(config.items.slice(0, ITEMS_PER_PAGE));
    const rest = config.items.slice(ITEMS_PER_PAGE);
    for (let i = 0; i < rest.length; i += ITEMS_PER_MIDDLE) {
      pages.push(rest.slice(i, i + ITEMS_PER_MIDDLE));
    }
  }

  const headerFull = `
    <div class="doc-header">
      <div>
        <div class="doc-company-name">${businessName}</div>
        <div class="doc-company-addr">${address}</div>
        <div class="doc-company-contact">${phone} | ${email}</div>
      </div>
      <div class="doc-title-block">
        <div class="doc-title">${config.title}</div>
        <div class="doc-number">${config.documentNumber}</div>
        <div class="doc-date">${config.dateLabel}: ${formatDate(config.date)}</div>
      </div>
    </div>`;

  const headerCompact = `
    <div class="compact-header">
      <div class="compact-company">${businessName}</div>
      <div><span class="compact-title">${config.title}</span> <span class="compact-number">${config.documentNumber}</span></div>
    </div>`;

  const partyHTML = isReceipt
    ? `<div class="doc-party"><div class="doc-party-label">Received From</div><div class="doc-party-name">${config.customer.name}</div></div>`
    : config.recipient
      ? `<div class="doc-party-grid">
          <div><div class="doc-party-label">${isDeliveryNote ? 'Deliver To' : 'Bill To'}</div><div class="doc-party-name">${config.customer.name}</div>${config.customer.address ? `<div class="doc-party-text">${config.customer.address}</div>` : ''}</div>
          <div><div class="doc-party-label">Recipient</div><div class="doc-party-name">${config.recipient.name}</div>${config.recipient.phone ? `<div class="doc-party-text">${config.recipient.phone}</div>` : ''}</div>
        </div>`
      : `<div class="doc-party"><div class="doc-party-label">${isDeliveryNote ? 'Deliver To' : 'Bill To'}</div><div class="doc-party-name">${config.customer.name}</div>${config.customer.address ? `<div class="doc-party-text">${config.customer.address}</div>` : ''}</div>`;

  const metadataHTML = config.metadata.length > 0
    ? `<div class="doc-metadata">${config.metadata.map(m => `<div class="doc-meta-row"><span class="doc-meta-label">${m.label}:</span><span class="doc-meta-value">${m.value}</span></div>`).join('')}</div>`
    : '';

  const itemsTableHTML = (items: DocumentItem[]) => {
    if (isDeliveryNote) {
      return `<table class="doc-items-table"><thead><tr><th>Item</th><th class="num">Qty Ordered</th><th class="num">Qty Delivered</th></tr></thead><tbody>
        ${items.map(item => {
          const complete = item.quantityDelivered === item.quantity;
          const partial = (item.quantityDelivered ?? 0) > 0 && (item.quantityDelivered ?? 0) < item.quantity;
          const cls = complete ? 'qty-complete' : partial ? 'qty-partial' : '';
          const lbl = complete ? ' <span class="qty-label">Complete</span>' : partial ? ' <span class="qty-label">Partial</span>' : '';
          return `<tr><td>${item.productName}<br><span style="font-size:9px;color:#999">Product ID: ${item.productId}</span></td><td class="num">${item.quantity}</td><td class="num"><span class="${cls}">${item.quantityDelivered}${lbl}</span></td></tr>`;
        }).join('')}
      </tbody></table>`;
    }
    return `<table class="doc-items-table"><thead><tr><th>Item</th><th>Description</th><th class="num">Qty</th>${config.showPrices ? '<th class="num">Price</th><th class="num">Total</th>' : ''}</tr></thead><tbody>
      ${items.map(item => `<tr><td>${item.productName}</td><td>${item.description || `Product ID: ${item.productId}`}</td><td class="num">${item.quantity}</td>${config.showPrices ? `<td class="num">${formatCurrency(item.unitPrice)}</td><td class="num">${formatCurrency(item.total)}</td>` : ''}</tr>`).join('')}
    </tbody></table>`;
  };

  const totalsHTML = config.totals ? (() => {
    const t = config.totals;
    const disc = t.discountType === 'percentage' ? `-${t.discount}%` : `-${formatCurrency(t.discount)}`;
    return `<div class="doc-totals">
      <div class="doc-totals-row"><span>Subtotal</span><span>${formatCurrency(t.subtotal)}</span></div>
      ${t.discount > 0 ? `<div class="doc-totals-row"><span>Discount</span><span>${disc}</span></div>` : ''}
      ${t.tax > 0 ? `<div class="doc-totals-row"><span>Tax (${t.taxRate}%)</span><span>${formatCurrency(t.tax)}</span></div>` : ''}
      <div class="doc-totals-row grand"><span>Total</span><span>${formatCurrency(t.total)}</span></div>
      ${t.balance !== undefined && t.balance > 0 ? `<div class="doc-totals-row balance"><span>Balance Due</span><span>${formatCurrency(t.balance)}</span></div>` : ''}
    </div>`;
  })() : '';

  const notesHTML = (() => {
    let html = '';
    if (config.amount !== undefined) {
      html += `<div class="doc-amount-box"><div class="doc-amount-label">Amount Received</div><div class="doc-amount-value">${formatCurrency(config.amount)}</div>${config.paymentMethod ? `<div class="doc-amount-method">via ${paymentMethodLabels[config.paymentMethod] || config.paymentMethod}</div>` : ''}</div>`;
    }
    if (config.notes) {
      html += `<div class="doc-notes"><div class="doc-notes-label">Notes</div><div class="doc-notes-text">${config.notes}</div></div>`;
    }
    return html;
  })();

  const signatureHTML = config.showSignature ? `
    <div class="doc-signature">
      <div class="doc-signature-block"><div class="doc-signature-line"></div><div class="doc-signature-label">Customer Signature</div></div>
      <div class="doc-signature-block"><div class="doc-signature-line"></div><div class="doc-signature-label">Authorized Signature</div></div>
    </div>` : '';

  const footerHTML = `<div class="doc-footer"><div class="doc-footer-contact">${businessName} | ${phone} | ${email}</div><div class="doc-footer-text">${settings.print.footerText || 'Thank you for your business!'}</div></div>`;

  return pages.map((pageItems, i) => {
    const isFirst = i === 0;
    const isLast = i === pages.length - 1;
    if (isFirst) {
      return `<div class="doc-page">${headerFull}${partyHTML}${metadataHTML}${itemsTableHTML(pageItems)}${isLast ? totalsHTML + notesHTML + signatureHTML : ''}${footerHTML}</div>`;
    }
    return `<div class="doc-page">${headerCompact}${itemsTableHTML(pageItems)}${isLast ? totalsHTML + notesHTML + signatureHTML : ''}${isLast ? footerHTML : `<div class="doc-footer"><div class="doc-footer-contact">${businessName} | ${phone} | ${email}</div></div>`}</div>`;
  }).join('');
}

function buildThermalHTML(config: DocumentConfig, cashierName: string): string {
  const settings = getSettings();
  const { businessName, address, phone } = settings.business;
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const itemsHTML = config.items.map(item => `
    <div class="thermal-item-name">${item.productName}</div>
    <div class="thermal-item-row"><span>${item.quantity} x ${formatCurrency(item.unitPrice)}</span><span>${formatCurrency(item.total)}</span></div>
  `).join('');

  const totalsHTML = config.totals ? `
    <div class="thermal-total-row"><span>Subtotal</span><span>${formatCurrency(config.totals.subtotal)}</span></div>
    <div class="thermal-total-row"><span>Tax</span><span>${formatCurrency(config.totals.tax)}</span></div>
  ` : '';

  const amountHTML = config.amount !== undefined ? `<div class="thermal-total-row"><span>Amount</span><span>${formatCurrency(config.amount)}</span></div>` : '';

  return `<div class="thermal">
    <div class="thermal-business">${businessName.toUpperCase()}</div>
    <div class="thermal-addr">${address}</div>
    <div class="thermal-phone">${phone}</div>
    <div class="thermal-divider"></div>
    <div class="thermal-info-row"><span>Receipt #</span><span>${config.documentNumber}</span></div>
    <div class="thermal-info-row"><span>Date</span><span>${formatDateShort(config.date)}</span></div>
    <div class="thermal-info-row"><span>Time</span><span>${time}</span></div>
    <div class="thermal-info-row"><span>Cashier</span><span>${cashierName}</span></div>
    <div class="thermal-info-row"><span>Customer</span><span>${config.customer.name}</span></div>
    <div class="thermal-divider"></div>
    ${itemsHTML}
    <div class="thermal-divider"></div>
    <div class="thermal-total-row"><span>Subtotal</span><span>${formatCurrency(config.totals?.subtotal ?? config.amount ?? 0)}</span></div>
    ${totalsHTML}${amountHTML}
    <div class="thermal-grand-total"><span>TOTAL</span><span>${formatCurrency(config.totals?.total ?? config.amount ?? 0)}</span></div>
    ${config.paymentMethod ? `<div class="thermal-info-row" style="margin-top:4px"><span>Payment</span><span>${paymentMethodLabels[config.paymentMethod] || config.paymentMethod.toUpperCase()}</span></div>` : ''}
    <div class="thermal-divider"></div>
    <div class="thermal-thankyou"><p>THANK YOU!</p><p>Please come again</p><p style="font-size:8px;color:#999">Powered by ${businessName}</p></div>
    <div class="thermal-cut">--- tear here ---</div>
  </div>`;
}

export function printDocumentA4(config: DocumentConfig) {
  openPrintWindow(buildA4HTML(config), `${config.title} ${config.documentNumber}`);
}

export function printDocumentThermal57(config: DocumentConfig, cashierName = 'Admin') {
  openPrintWindow(buildThermalHTML(config, cashierName), `Thermal ${config.documentNumber}`);
}

import {
  PDFDocument, PDFFont, PDFPage, rgb, StandardFonts,
} from 'pdf-lib';
import QRCode from 'qrcode';
import type { DocumentConfig, DocumentItem } from './types';
import { getSettings, formatCurrency, formatDate, paymentMethodLabels, statusLabels } from './types';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const ITEMS_PER_PAGE = 12;
const ITEMS_PER_MIDDLE_PAGE = 18;
const PRIMARY = rgb(0.129, 0.271, 0.518);
const DARK = rgb(0.1, 0.1, 0.1);
const GRAY = rgb(0.5, 0.5, 0.5);
const LIGHT_GRAY = rgb(0.93, 0.93, 0.93);

export async function generateDocumentPDF(config: DocumentConfig): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  let boldFont: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const settings = getSettings();
  const { businessName, address, phone, email } = settings.business;

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const addPage = (): PDFPage => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    drawCompactHeader();
    return page;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 60) {
      addPage();
    }
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

  const drawFullHeader = () => {
    page.drawText(businessName, { x: MARGIN, y, size: 18, font: boldFont, color: PRIMARY });
    y -= 22;
    y = drawWrappedText(address, MARGIN, 250, 9, font, GRAY);
    y = drawText(`${phone} | ${email}`, MARGIN, 9, font, GRAY);
    y -= 10;

    const titleX = PAGE_WIDTH - MARGIN - 120;
    let titleY = PAGE_HEIGHT - MARGIN - 4;
    page.drawText(config.title, { x: titleX, y: titleY, size: 24, font: boldFont, color: PRIMARY });
    titleY -= 26;
    page.drawText(config.documentNumber, { x: titleX, y: titleY, size: 11, font: font, color: GRAY });
    titleY -= 14;
    page.drawText(`${config.dateLabel}: ${formatDate(config.date)}`, { x: titleX, y: titleY, size: 9, font: font, color: GRAY });
    y = Math.min(y, titleY - 20);
  };

  const drawCompactHeader = () => {
    page.drawText(businessName, { x: MARGIN, y, size: 12, font: boldFont, color: PRIMARY });
    page.drawText(`${config.title} - ${config.documentNumber}`, { x: PAGE_WIDTH - MARGIN - 180, y, size: 10, font: font, color: GRAY });
    y -= 20;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 4 }, thickness: 0.5, color: LIGHT_GRAY });
    y -= 10;
  };

  const drawCustomerInfo = () => {
    const label = config.type === 'receipt' ? 'Received From' : config.type === 'delivery-note' ? 'Deliver To' : 'Bill To';
    page.drawText(label, { x: MARGIN, y, size: 9, font: font, color: GRAY });
    y -= 12;
    page.drawText(config.customer.name, { x: MARGIN, y, size: 11, font: boldFont, color: DARK });
    y -= 14;
    if (config.customer.address) {
      y = drawWrappedText(config.customer.address, MARGIN, 250, 9, font, GRAY);
    }
    if (config.recipient) {
      const recipientX = PAGE_WIDTH - MARGIN - 200;
      let ry = y + 28;
      page.drawText('Recipient', { x: recipientX, y: ry, size: 9, font: font, color: GRAY });
      ry -= 12;
      page.drawText(config.recipient.name, { x: recipientX, y: ry, size: 11, font: boldFont, color: DARK });
      if (config.recipient.phone) {
        ry -= 14;
        page.drawText(config.recipient.phone, { x: recipientX, y: ry, size: 9, font: font, color: GRAY });
      }
    }
    y -= 10;
  };

  const drawMetadata = () => {
    const metaX = PAGE_WIDTH - MARGIN - 200;
    for (const entry of config.metadata) {
      if (y < MARGIN + 60) { addPage(); }
      page.drawText(`${entry.label}:`, { x: metaX, y, size: 9, font: font, color: GRAY });
      page.drawText(entry.value, { x: metaX + 80, y, size: 9, font: font, color: DARK });
      y -= 14;
    }
    y -= 6;
  };

  const drawItemsTable = (items: DocumentItem[]) => {
    const cols = config.type === 'delivery-note'
      ? [{ name: 'Item', x: MARGIN, w: 250 }, { name: 'Qty Ordered', x: MARGIN + 260, w: 80 }, { name: 'Qty Delivered', x: MARGIN + 350, w: 80 }]
      : [{ name: 'Item', x: MARGIN, w: 130 }, { name: 'Description', x: MARGIN + 140, w: 140 }, { name: 'Qty', x: MARGIN + 290, w: 40 }, ...(config.showPrices ? [{ name: 'Price', x: MARGIN + 340, w: 70 }, { name: 'Total', x: MARGIN + 420, w: 70 }] : [])];

    page.drawRectangle({ x: MARGIN, y: y - 16, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: PRIMARY });
    for (const col of cols) {
      page.drawText(col.name, { x: col.x, y: y - 12, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    }
    y -= 20;

    for (let i = 0; i < items.length; i++) {
      ensureSpace(30);
      const item = items[i];
      if (i % 2 === 0) {
        page.drawRectangle({ x: MARGIN, y: y - 12, width: PAGE_WIDTH - MARGIN * 2, height: 20, color: LIGHT_GRAY });
      }
      page.drawText(item.productName, { x: cols[0].x, y: y - 8, size: 9, font: font, color: DARK });
      if (config.type !== 'delivery-note') {
        const desc = item.description || `Product ID: ${item.productId}`;
        const descStr = desc.length > 60 ? desc.substring(0, 57) + '...' : desc;
        page.drawText(descStr, { x: cols[1].x, y: y - 8, size: 8, font: font, color: GRAY });
        page.drawText(String(item.quantity), { x: cols[2].x, y: y - 8, size: 9, font: font, color: DARK });
        if (config.showPrices) {
          page.drawText(formatCurrency(item.unitPrice), { x: (cols[3] || cols[2]).x, y: y - 8, size: 9, font: font, color: DARK });
          page.drawText(formatCurrency(item.total), { x: (cols[4] || cols[2]).x, y: y - 8, size: 9, font: font, color: DARK });
        }
      } else {
        page.drawText(String(item.quantity), { x: cols[1].x, y: y - 8, size: 9, font: font, color: DARK });
        page.drawText(String(item.quantityDelivered ?? 0), { x: cols[2].x, y: y - 8, size: 9, font: font, color: DARK });
      }
      y -= 20;
    }
    page.drawLine({ start: { x: MARGIN, y: y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: GRAY });
    y -= 16;
  };

  const drawTotals = () => {
    if (!config.totals) return;
    ensureSpace(80);
    const labelX = PAGE_WIDTH - MARGIN - 150;
    const valueX = PAGE_WIDTH - MARGIN;
    const t = config.totals;

    const rows: [string, string, boolean?][] = [
      ['Subtotal', formatCurrency(t.subtotal)],
      ...(t.discount > 0 ? [['Discount', t.discountType === 'percentage' ? `-${t.discount}%` : `-${formatCurrency(t.discount)}`] as [string, string]] : []),
      ...(t.tax > 0 ? [[`Tax (${t.taxRate}%)`, formatCurrency(t.tax)] as [string, string]] : []),
    ];
    for (const [label, value] of rows) {
      page.drawText(label, { x: labelX, y, size: 9, font: font, color: GRAY });
      page.drawText(value, { x: valueX - boldFont.widthOfTextAtSize(value, 9), y, size: 9, font: font, color: DARK });
      y -= 16;
    }
    page.drawRectangle({ x: labelX - 10, y: y - 12, width: 160, height: 20, color: PRIMARY });
    page.drawText('Total', { x: labelX, y: y - 8, size: 10, font: boldFont, color: rgb(1, 1, 1) });
    const totalStr = formatCurrency(t.total);
    page.drawText(totalStr, { x: valueX - boldFont.widthOfTextAtSize(totalStr, 10), y: y - 8, size: 10, font: boldFont, color: rgb(1, 1, 1) });
    y -= 24;
    if (t.balance !== undefined && t.balance > 0) {
      page.drawText('Balance Due', { x: labelX, y, size: 9, font: boldFont, color: rgb(0.8, 0.2, 0.2) });
      const balStr = formatCurrency(t.balance);
      page.drawText(balStr, { x: valueX - boldFont.widthOfTextAtSize(balStr, 9), y, size: 9, font: boldFont, color: rgb(0.8, 0.2, 0.2) });
      y -= 16;
    }
  };

  const drawNotes = () => {
    if (config.notes) {
      ensureSpace(30);
      page.drawText('Notes:', { x: MARGIN, y, size: 9, font: boldFont, color: GRAY });
      y -= 12;
      y = drawWrappedText(config.notes, MARGIN, PAGE_WIDTH - MARGIN * 2, 9, font, GRAY);
      y -= 8;
    }
    if (config.amount !== undefined) {
      ensureSpace(40);
      const boxW = 200, boxH = 40;
      const boxX = (PAGE_WIDTH - boxW) / 2;
      page.drawRectangle({ x: boxX, y: y - boxH, width: boxW, height: boxH, borderColor: PRIMARY, borderWidth: 1.5 });
      page.drawText('Amount Received', { x: boxX + 10, y: y - 14, size: 9, font: font, color: GRAY });
      page.drawText(formatCurrency(config.amount), { x: boxX + 10, y: y - 28, size: 14, font: boldFont, color: PRIMARY });
      y -= boxH + 10;
    }
  };

  const drawSignature = () => {
    if (!config.showSignature) return;
    ensureSpace(60);
    y -= 20;
    const sigW = 180, gap = 40;
    const sig1X = MARGIN;
    const sig2X = PAGE_WIDTH - MARGIN - sigW;
    page.drawLine({ start: { x: sig1X, y }, end: { x: sig1X + sigW, y }, thickness: 0.5, color: GRAY });
    page.drawLine({ start: { x: sig2X, y }, end: { x: sig2X + sigW, y }, thickness: 0.5, color: GRAY });
    page.drawText('Customer Signature', { x: sig1X, y: y - 12, size: 8, font: font, color: GRAY });
    page.drawText('Authorized Signature', { x: sig2X, y: y - 12, size: 8, font: font, color: GRAY });
    y -= 24;
  };

  const drawFooter = () => {
    const footerY = MARGIN - 20;
    page.drawLine({ start: { x: MARGIN, y: footerY + 14 }, end: { x: PAGE_WIDTH - MARGIN, y: footerY + 14 }, thickness: 0.5, color: LIGHT_GRAY });
    page.drawText(`${businessName} | ${phone} | ${email}`, { x: MARGIN, y: footerY, size: 8, font: font, color: GRAY });
    const footerText = settings.print.footerText || 'Thank you for your business!';
    page.drawText(footerText, { x: MARGIN, y: footerY - 12, size: 8, font: font, color: GRAY });
  };

  // --- Build pages ---
  drawFullHeader();
  drawCustomerInfo();
  drawMetadata();
  drawItemsTable(config.items.slice(0, ITEMS_PER_PAGE));

  const remaining = config.items.slice(ITEMS_PER_PAGE);
  for (let i = 0; i < remaining.length; i += ITEMS_PER_MIDDLE_PAGE) {
    addPage();
    drawItemsTable(remaining.slice(i, i + ITEMS_PER_MIDDLE_PAGE));
  }

  drawTotals();
  drawNotes();
  drawSignature();
  drawFooter();

  return doc.save();
}

export async function downloadDocumentPDF(config: DocumentConfig) {
  const { downloadPDF } = await import('./download');
  const bytes = await generateDocumentPDF(config);
  const filename = `${config.title}_${config.documentNumber}.pdf`;
  downloadPDF(bytes, filename);
}

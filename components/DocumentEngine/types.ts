import type {
  Invoice,
  Quotation,
  Receipt,
  DeliveryNote,
  AppSettings,
} from '../../types';
import { defaultSettings } from '../../data/settings';

export type DocumentType = 'quotation' | 'invoice' | 'receipt' | 'delivery-note';

export type DocumentModel = Invoice | Quotation | Receipt | DeliveryNote;

export type DocumentStatus =
  | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  | 'paid' | 'unpaid' | 'overdue' | 'partial'
  | 'pending' | 'shipped' | 'delivered' | 'returned'
  | 'new' | 'in_review' | 'quoted' | 'closed';

export interface DocumentItem {
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  quantityDelivered?: number;
  unitPrice: number;
  total: number;
}

export interface DocumentParty {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface DocumentMetadata {
  number: string;
  date: string;
  dateLabel: string;
  extra: { label: string; value: string }[];
}

export interface DocumentTotals {
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  taxRate: number;
  total: number;
  paid?: number;
  balance?: number;
}

export interface DocumentConfig {
  type: DocumentType;
  title: string;
  documentNumber: string;
  date: string;
  dateLabel: string;
  status: DocumentStatus;
  customer: DocumentParty;
  recipient?: DocumentParty;
  carrier?: string;
  trackingNumber?: string;
  items: DocumentItem[];
  totals?: DocumentTotals;
  metadata: { label: string; value: string }[];
  notes?: string;
  paymentMethod?: string;
  amount?: number;
  showPrices: boolean;
  showTotals: boolean;
  showSignature: boolean;
}

export function getSettings(): AppSettings {
  return defaultSettings;
}

export function formatCurrency(amount: number): string {
  const settings = getSettings();
  const { currencySymbol, decimalPlaces, thousandSeparator, decimalSeparator, currencyPosition } = settings.currency;
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).replace(/,/g, thousandSeparator).replace(/\./g, decimalSeparator);
  const sign = amount < 0 ? '-' : '';
  return currencyPosition === 'before'
    ? `${sign}${currencySymbol}${formatted}`
    : `${sign}${formatted}${currencySymbol}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const statusLabels: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected', expired: 'Expired',
  paid: 'Paid', unpaid: 'Unpaid', overdue: 'Overdue', partial: 'Partially Paid',
  pending: 'Pending', shipped: 'Shipped', delivered: 'Delivered', returned: 'Returned',
  new: 'New', in_review: 'In Review', quoted: 'Quoted', closed: 'Closed',
};

export const statusColors: Record<string, string> = {
  draft: '#6b7280', sent: '#3b82f6', accepted: '#10b981', rejected: '#ef4444', expired: '#f59e0b',
  paid: '#10b981', unpaid: '#f59e0b', overdue: '#ef4444', partial: '#3b82f6',
  pending: '#f59e0b', shipped: '#3b82f6', delivered: '#10b981', returned: '#ef4444',
  new: '#3b82f6', in_review: '#8b5cf6', quoted: '#10b981', closed: '#6b7280',
};

export const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash', card: 'Credit/Debit Card', bank_transfer: 'Bank Transfer',
  check: 'Check', mobile_money: 'Mobile Money',
};

export function invoiceToConfig(doc: Invoice): DocumentConfig {
  return {
    type: 'invoice',
    title: 'INVOICE',
    documentNumber: doc.invoiceNumber,
    date: doc.issueDate,
    dateLabel: 'Issue Date',
    status: doc.status,
    customer: { name: doc.customerName },
    items: doc.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    totals: {
      subtotal: doc.subtotal, discount: doc.discount, discountType: doc.discountType,
      tax: doc.tax, taxRate: doc.taxRate, total: doc.total, paid: doc.paid, balance: doc.balance,
    },
    metadata: [
      { label: 'Due Date', value: formatDate(doc.dueDate) },
      { label: 'Status', value: statusLabels[doc.status] || doc.status },
      ...(doc.paid > 0 ? [
        { label: 'Amount Paid', value: formatCurrency(doc.paid) },
        { label: 'Balance Due', value: formatCurrency(doc.balance) },
      ] : []),
    ],
    notes: doc.notes,
    showPrices: true,
    showTotals: true,
    showSignature: true,
  };
}

export function quotationToConfig(doc: Quotation): DocumentConfig {
  return {
    type: 'quotation',
    title: 'QUOTATION',
    documentNumber: doc.id.toUpperCase(),
    date: doc.createdAt,
    dateLabel: 'Date',
    status: doc.status,
    customer: { name: doc.customerName },
    items: doc.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    })),
    totals: {
      subtotal: doc.subtotal, discount: doc.discount, discountType: doc.discountType,
      tax: doc.tax, taxRate: doc.taxRate, total: doc.total,
    },
    metadata: [{ label: 'Valid Until', value: formatDate(doc.validUntil) }],
    notes: doc.notes,
    showPrices: true,
    showTotals: true,
    showSignature: true,
  };
}

export function receiptToConfig(doc: Receipt): DocumentConfig {
  return {
    type: 'receipt',
    title: 'RECEIPT',
    documentNumber: doc.receiptNumber,
    date: doc.date,
    dateLabel: 'Date',
    status: 'paid',
    customer: { name: doc.customerName },
    items: [{
      productId: '', productName: 'Payment Received', quantity: 1,
      unitPrice: doc.amount, total: doc.amount,
    }],
    totals: undefined,
    metadata: [
      { label: 'Payment Method', value: paymentMethodLabels[doc.paymentMethod] || doc.paymentMethod },
      { label: 'Reference', value: doc.reference || 'N/A' },
      { label: 'Invoice ID', value: doc.invoiceId },
    ],
    notes: doc.notes,
    paymentMethod: doc.paymentMethod,
    amount: doc.amount,
    showPrices: false,
    showTotals: false,
    showSignature: false,
  };
}

export function deliveryNoteToConfig(doc: DeliveryNote): DocumentConfig {
  return {
    type: 'delivery-note',
    title: 'DELIVERY NOTE',
    documentNumber: doc.deliveryNumber,
    date: doc.shipDate,
    dateLabel: 'Ship Date',
    status: doc.status,
    customer: { name: doc.customerName, address: doc.customerAddress },
    recipient: { name: doc.recipient, phone: doc.recipientPhone },
    carrier: doc.carrier,
    trackingNumber: doc.trackingNumber,
    items: doc.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      quantityDelivered: item.quantityDelivered,
      unitPrice: 0, total: 0,
    })),
    totals: undefined,
    metadata: [
      { label: 'Carrier', value: doc.carrier || 'N/A' },
      ...(doc.trackingNumber ? [{ label: 'Tracking #', value: doc.trackingNumber }] : []),
      { label: 'Status', value: statusLabels[doc.status] || doc.status },
      ...(doc.deliveryDate ? [{ label: 'Delivery Date', value: formatDate(doc.deliveryDate) }] : []),
    ],
    notes: doc.notes,
    showPrices: false,
    showTotals: false,
    showSignature: true,
  };
}

export function toDocumentConfig(doc: DocumentModel): DocumentConfig {
  if ('invoiceNumber' in doc) return invoiceToConfig(doc as Invoice);
  if ('receiptNumber' in doc) return receiptToConfig(doc as Receipt);
  if ('deliveryNumber' in doc) return deliveryNoteToConfig(doc as DeliveryNote);
  return quotationToConfig(doc as Quotation);
}

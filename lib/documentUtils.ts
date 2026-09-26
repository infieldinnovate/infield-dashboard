import type { AppSettings } from '../types';
import { defaultSettings } from '../data/settings';

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

export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

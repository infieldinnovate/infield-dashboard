import type { QuotationItem } from '../../types';

export const ITEMS_PER_PAGE = 12;
export const ITEMS_PER_MIDDLE_PAGE = 18;

export function paginateItems(items: QuotationItem[]): QuotationItem[][] {
  if (items.length <= ITEMS_PER_PAGE) return [items];
  const pages = [items.slice(0, ITEMS_PER_PAGE)];
  for (let i = ITEMS_PER_PAGE; i < items.length; i += ITEMS_PER_MIDDLE_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_MIDDLE_PAGE));
  }
  return pages;
}

export function padToMinimum(rows: QuotationItem[], min: number): QuotationItem[] {
  const padded = [...rows];
  while (padded.length < min) {
    padded.push({ productId: `blank-${padded.length}`, productName: '', quantity: 0, unitPrice: 0, unit: '' });
  }
  return padded;
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

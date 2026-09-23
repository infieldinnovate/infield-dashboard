import React from 'react';
import Fuse, { type IFuseOptions, type FuseResultMatch } from 'fuse.js';
import { products } from '../data/products';
import { customers } from '../data/customers';
import { invoices } from '../data/invoices';
import { receipts } from '../data/receipts';
import { quotations } from '../data/quotations';
import { deliveryNotes } from '../data/deliveryNotes';

export type SearchCategory =
  | 'products'
  | 'customers'
  | 'invoices'
  | 'receipts'
  | 'quotations'
  | 'delivery-notes';

export interface SearchRecord {
  id: string;
  category: SearchCategory;
  categoryLabel: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  icon: string;
}

const iconMap: Record<SearchCategory, string> = {
  products: 'Package',
  customers: 'Users',
  invoices: 'FileSpreadsheet',
  receipts: 'Receipt',
  quotations: 'FileText',
  'delivery-notes': 'PackageCheck',
};

const categoryLabelMap: Record<SearchCategory, string> = {
  products: 'Products',
  customers: 'Customers',
  invoices: 'Invoices',
  receipts: 'Receipts',
  quotations: 'Quotations',
  'delivery-notes': 'Delivery Notes',
};

const hrefMap: Record<SearchCategory, string> = {
  products: '/products',
  customers: '/customers',
  invoices: '/invoices',
  receipts: '/receipts',
  quotations: '/quotations',
  'delivery-notes': '/delivery-notes',
};

const productRecords: SearchRecord[] = products.map((p) => ({
  id: `products-${p.id}`,
  category: 'products',
  categoryLabel: categoryLabelMap.products,
  title: p.name,
  subtitle: p.sku,
  meta: p.category,
  href: hrefMap.products,
  icon: iconMap.products,
}));

const customerRecords: SearchRecord[] = customers.map((c) => ({
  id: `customers-${c.id}`,
  category: 'customers',
  categoryLabel: categoryLabelMap.customers,
  title: c.name,
  subtitle: c.email,
  meta: `${c.city}, ${c.country}`,
  href: hrefMap.customers,
  icon: iconMap.customers,
}));

const invoiceRecords: SearchRecord[] = invoices.map((i) => ({
  id: `invoices-${i.id}`,
  category: 'invoices',
  categoryLabel: categoryLabelMap.invoices,
  title: i.invoiceNumber,
  subtitle: i.customerName,
  meta: `$${i.total.toFixed(2)} • ${i.status}`,
  href: hrefMap.invoices,
  icon: iconMap.invoices,
}));

const receiptRecords: SearchRecord[] = receipts.map((r) => ({
  id: `receipts-${r.id}`,
  category: 'receipts',
  categoryLabel: categoryLabelMap.receipts,
  title: r.receiptNumber,
  subtitle: r.customerName,
  meta: `$${r.amount.toFixed(2)} • ${r.paymentMethod.replace('_', ' ')}`,
  href: hrefMap.receipts,
  icon: iconMap.receipts,
}));

const quotationRecords: SearchRecord[] = quotations.map((q) => ({
  id: `quotations-${q.id}`,
  category: 'quotations',
  categoryLabel: categoryLabelMap.quotations,
  title: q.id.toUpperCase(),
  subtitle: q.customerName,
  meta: `$${q.total.toFixed(2)} • ${q.status}`,
  href: hrefMap.quotations,
  icon: iconMap.quotations,
}));

const deliveryRecords: SearchRecord[] = deliveryNotes.map((d) => ({
  id: `delivery-notes-${d.id}`,
  category: 'delivery-notes',
  categoryLabel: categoryLabelMap['delivery-notes'],
  title: d.deliveryNumber,
  subtitle: d.customerName,
  meta: `${d.status} • ${d.carrier}`,
  href: hrefMap['delivery-notes'],
  icon: iconMap['delivery-notes'],
}));

const allRecords: SearchRecord[] = [
  ...productRecords,
  ...customerRecords,
  ...invoiceRecords,
  ...receiptRecords,
  ...quotationRecords,
  ...deliveryRecords,
];

const fuseOptions: IFuseOptions<SearchRecord> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'subtitle', weight: 0.3 },
    { name: 'meta', weight: 0.2 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 1,
  includeMatches: true,
};

let fuseInstance: Fuse<SearchRecord> | null = null;

function getFuse(): Fuse<SearchRecord> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(allRecords, fuseOptions);
  }
  return fuseInstance;
}

export interface SearchResult extends SearchRecord {
  matches: readonly FuseResultMatch[];
}

export function search(query: string, limit = 20): SearchResult[] {
  if (!query.trim()) return [];
  const results = getFuse().search(query, { limit });
  return results.map((r) => ({
    ...r.item,
    matches: r.matches ?? [],
  }));
}

export function searchByCategory(query: string, limitPerCategory = 4): SearchResult[] {
  if (!query.trim()) return [];
  const results = getFuse().search(query);
  const grouped: Record<string, SearchResult[]> = {};
  const order: SearchCategory[] = [
    'products',
    'customers',
    'invoices',
    'receipts',
    'quotations',
    'delivery-notes',
  ];

  for (const cat of order) grouped[cat] = [];

  for (const r of results) {
    const cat = r.item.category;
    if (grouped[cat] && grouped[cat].length < limitPerCategory) {
      grouped[cat].push({
        ...r.item,
        matches: r.matches ?? [],
      });
    }
  }

  return order.flatMap((cat) => grouped[cat]);
}

export function highlightMatch(
  text: string,
  matches: readonly FuseResultMatch[],
  key: string
): React.ReactNode[] {
  const match = matches.find((m) => m.key === key);
  if (!match || match.indices.length === 0) return [text];

  const sortedIndices = [...match.indices].sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const [start, end] of sortedIndices) {
    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }
    parts.push(text.slice(start, end + 1));
    cursor = end + 1;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

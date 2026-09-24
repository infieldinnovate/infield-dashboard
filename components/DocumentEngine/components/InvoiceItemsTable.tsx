'use client';

import React from 'react';
import type { DocumentItem } from '../types';
import styles from '../DocumentEngine.module.scss';

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface InvoiceItemsTableProps {
  items: DocumentItem[];
}

export default function InvoiceItemsTable({ items }: InvoiceItemsTableProps) {
  const rows = [...items];
  while (rows.length < 4) {
    rows.push({ productId: `blank-${rows.length}`, productName: '', quantity: 0, unitPrice: 0, total: 0 });
  }

  return (
    <table className={styles.invoiceItemsTable}>
      <thead>
        <tr>
          <th className={styles.invoiceNoColumn}>No.</th>
          <th>Description</th>
          <th className={styles.invoiceSizeColumn}>Size</th>
          <th className={styles.invoiceQtyColumn}>Qty</th>
          <th className={styles.invoicePriceColumn}>Price</th>
          <th className={styles.invoiceTotalColumn}>Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((item, index) => {
          const isBlank = !item.productName;
          return (
            <tr key={item.productId}>
              <td className={styles.invoiceNoColumn}>{isBlank ? '' : index + 1}</td>
              <td>{item.productName}</td>
              <td className={styles.invoiceSizeColumn}>{isBlank ? '' : '-'}</td>
              <td className={styles.invoiceQtyColumn}>{isBlank ? '' : `${item.quantity} Units`}</td>
              <td className={styles.invoicePriceColumn}>{isBlank ? '' : formatAmount(item.unitPrice)}</td>
              <td className={styles.invoiceTotalColumn}>{isBlank ? '-' : formatAmount(item.total)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

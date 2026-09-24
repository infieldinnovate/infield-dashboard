'use client';

import React from 'react';
import type { DocumentTotals as DocumentTotalsType } from '../types';
import { formatCurrency } from '../types';
import styles from '../DocumentEngine.module.scss';

interface InvoiceTotalsProps {
  totals: DocumentTotalsType;
}

export default function InvoiceTotals({ totals }: InvoiceTotalsProps) {
  return (
    <div className={styles.invoiceTotals}>
      <div className={styles.invoiceTotalsRow}>
        <span>Sub-Total</span>
        <strong>{formatCurrency(totals.subtotal)}</strong>
      </div>
      <div className={styles.invoiceTotalsRow}>
        <span>Labour</span>
        <strong>-</strong>
      </div>
      <div className={styles.invoiceTotalsRow}>
        <span>Transportation</span>
        <strong>-</strong>
      </div>
      <div className={styles.invoiceTotalsRow}>
        <span>Tax <em>({totals.taxRate}%)</em></span>
        <strong>{formatCurrency(totals.tax)}</strong>
      </div>
      <div className={styles.invoiceGrandTotal}>
        <strong>Grand Total</strong>
        <span>{formatCurrency(totals.total)}</span>
      </div>
    </div>
  );
}

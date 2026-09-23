'use client';

import React from 'react';
import type { DocumentTotals } from '../types';
import { formatCurrency } from '../types';
import styles from '../DocumentEngine.module.scss';

export default function DocumentTotals({ totals }: { totals: DocumentTotals }) {
  const discountLabel = totals.discountType === 'percentage'
    ? `${totals.discount}%`
    : formatCurrency(totals.discount);

  return (
    <div className={styles.totals}>
      <div className={styles.totalsRow}>
        <span className={styles.totalsLabel}>Subtotal</span>
        <span className={styles.totalsValue}>{formatCurrency(totals.subtotal)}</span>
      </div>
      {totals.discount > 0 && (
        <div className={styles.totalsRow}>
          <span className={styles.totalsLabel}>Discount</span>
          <span className={styles.totalsValue}>-{discountLabel}</span>
        </div>
      )}
      {totals.tax > 0 && (
        <div className={styles.totalsRow}>
          <span className={styles.totalsLabel}>Tax ({totals.taxRate}%)</span>
          <span className={styles.totalsValue}>{formatCurrency(totals.tax)}</span>
        </div>
      )}
      <div className={`${styles.totalsRow} ${styles.totalsGrand}`}>
        <span className={styles.totalsLabel}>Total</span>
        <span className={styles.totalsValue}>{formatCurrency(totals.total)}</span>
      </div>
      {totals.balance !== undefined && totals.balance > 0 && (
        <div className={`${styles.totalsRow} ${styles.totalsBalance}`}>
          <span className={styles.totalsLabel}>Balance Due</span>
          <span className={styles.totalsValue}>{formatCurrency(totals.balance)}</span>
        </div>
      )}
    </div>
  );
}

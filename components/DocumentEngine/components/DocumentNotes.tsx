'use client';

import React from 'react';
import { formatCurrency } from '../types';
import styles from '../DocumentEngine.module.scss';

interface DocumentNotesProps {
  notes?: string;
  amount?: number;
  paymentMethod?: string;
}

export default function DocumentNotes({ notes, amount, paymentMethod }: DocumentNotesProps) {
  return (
    <div className={styles.notesSection}>
      {amount !== undefined && (
        <div className={styles.amountBox}>
          <p className={styles.amountLabel}>Amount Received</p>
          <p className={styles.amountValue}>{formatCurrency(amount)}</p>
          {paymentMethod && <p className={styles.amountMethod}>via {paymentMethod}</p>}
        </div>
      )}
      {notes && (
        <div className={styles.notesBlock}>
          <p className={styles.notesLabel}>Notes</p>
          <p className={styles.notesText}>{notes}</p>
        </div>
      )}
    </div>
  );
}

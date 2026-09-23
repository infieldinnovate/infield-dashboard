'use client';

import React from 'react';
import styles from '../DocumentEngine.module.scss';

export default function DocumentSignatureSection() {
  return (
    <div className={styles.signatureSection}>
      <div className={styles.signatureBlock}>
        <div className={styles.signatureLine} />
        <p className={styles.signatureLabel}>Customer Signature</p>
      </div>
      <div className={styles.signatureBlock}>
        <div className={styles.signatureLine} />
        <p className={styles.signatureLabel}>Authorized Signature</p>
      </div>
    </div>
  );
}

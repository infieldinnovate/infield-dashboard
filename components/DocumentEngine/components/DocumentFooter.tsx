'use client';

import React from 'react';
import { getSettings } from '../types';
import styles from '../DocumentEngine.module.scss';

export default function DocumentFooter() {
  const settings = getSettings();
  const { businessName, phone, email } = settings.business;
  const footerText = settings.print.footerText || 'Thank you for your business!';

  return (
    <div className={styles.footer}>
      <div className={styles.footerContact}>
        {businessName} | {phone} | {email}
      </div>
      <div className={styles.footerText}>{footerText}</div>
    </div>
  );
}

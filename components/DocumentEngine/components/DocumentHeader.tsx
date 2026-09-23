'use client';

import React from 'react';
import { getSettings } from '../types';
import styles from '../DocumentEngine.module.scss';

interface DocumentHeaderProps {
  title: string;
  documentNumber: string;
  date: string;
  dateLabel: string;
  variant?: 'full' | 'compact';
}

export default function DocumentHeader({
  title, documentNumber, date, dateLabel, variant = 'full',
}: DocumentHeaderProps) {
  const settings = getSettings();
  const { businessName, address, phone, email } = settings.business;

  if (variant === 'compact') {
    return (
      <div className={styles.compactHeader}>
        <div className={styles.compactCompany}>{businessName}</div>
        <div className={styles.compactDocInfo}>
          <span className={styles.compactTitle}>{title}</span>
          <span className={styles.compactNumber}>{documentNumber}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.header}>
      <div className={styles.companyBlock}>
        <h2 className={styles.companyName}>{businessName}</h2>
        <p className={styles.companyAddress}>{address}</p>
        <p className={styles.companyContact}>{phone} | {email}</p>
      </div>
      <div className={styles.docTitleBlock}>
        <h1 className={styles.docTitle}>{title}</h1>
        <p className={styles.docNumber}>{documentNumber}</p>
        <p className={styles.docDate}>{dateLabel}: {date}</p>
      </div>
    </div>
  );
}

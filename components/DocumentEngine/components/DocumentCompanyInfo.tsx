'use client';

import React from 'react';
import { getSettings } from '../types';
import styles from '../DocumentEngine.module.scss';

export default function DocumentCompanyInfo() {
  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const { taxId } = settings.tax;

  return (
    <div className={styles.companyInfo}>
      <h3 className={styles.companyInfoName}>{businessName}</h3>
      <p className={styles.companyInfoText}>{address}</p>
      <p className={styles.companyInfoText}>{phone} | {email}</p>
      {website && <p className={styles.companyInfoText}>{website}</p>}
      {taxId && <p className={styles.companyInfoText}>Tax ID: {taxId}</p>}
    </div>
  );
}

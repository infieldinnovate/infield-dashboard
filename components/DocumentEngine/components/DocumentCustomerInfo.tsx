'use client';

import React from 'react';
import type { DocumentParty } from '../types';
import styles from '../DocumentEngine.module.scss';

interface DocumentCustomerInfoProps {
  party: DocumentParty;
  label?: string;
  recipient?: DocumentParty;
}

export default function DocumentCustomerInfo({
  party, label = 'Bill To', recipient,
}: DocumentCustomerInfoProps) {
  if (recipient) {
    return (
      <div className={styles.partyGrid}>
        <div className={styles.partyBlock}>
          <p className={styles.partyLabel}>{label}</p>
          <p className={styles.partyName}>{party.name}</p>
          {party.address && <p className={styles.partyText}>{party.address}</p>}
          {party.phone && <p className={styles.partyText}>{party.phone}</p>}
        </div>
        <div className={styles.partyBlock}>
          <p className={styles.partyLabel}>Recipient</p>
          <p className={styles.partyName}>{recipient.name}</p>
          {recipient.phone && <p className={styles.partyText}>{recipient.phone}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.customerInfo}>
      <p className={styles.partyLabel}>{label}</p>
      <p className={styles.partyName}>{party.name}</p>
      {party.address && <p className={styles.partyText}>{party.address}</p>}
      {party.phone && <p className={styles.partyText}>{party.phone}</p>}
      {party.email && <p className={styles.partyText}>{party.email}</p>}
    </div>
  );
}

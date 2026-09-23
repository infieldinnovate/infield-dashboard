'use client';

import React from 'react';
import styles from '../DocumentEngine.module.scss';

interface DocumentMetadataProps {
  entries: { label: string; value: string }[];
}

export default function DocumentMetadata({ entries }: DocumentMetadataProps) {
  if (entries.length === 0) return null;
  return (
    <div className={styles.metadata}>
      {entries.map((entry, i) => (
        <div key={i} className={styles.metadataRow}>
          <span className={styles.metadataLabel}>{entry.label}</span>
          <span className={styles.metadataValue}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

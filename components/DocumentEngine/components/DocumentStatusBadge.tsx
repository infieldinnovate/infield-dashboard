'use client';

import React from 'react';
import { DocumentConfig, statusLabels, statusColors } from '../types';
import styles from '../DocumentEngine.module.scss';

export default function DocumentStatusBadge({ status }: { status: DocumentConfig['status'] }) {
  const label = statusLabels[status] || status;
  const color = statusColors[status] || '#6b7280';
  return (
    <span className={styles.statusBadge} style={{ backgroundColor: color }}>
      {label}
    </span>
  );
}

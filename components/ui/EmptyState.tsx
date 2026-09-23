'use client';

import React from 'react';
import styles from './EmptyState.module.scss';
import Icon from './Icon';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title = 'No data found',
  message = 'There is nothing to display here yet.',
  icon = 'Inbox',
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.iconWrapper}>
        <Icon name={icon} size={40} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

'use client';

import React from 'react';
import styles from './LoadingSpinner.module.scss';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'neutral' | 'light';
  className?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={`${styles.wrapper} ${className}`} role="status">
      <div className={`${styles.spinner} ${styles[size]} ${styles[color]}`} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

'use client';

import React from 'react';
import styles from './Checkbox.module.scss';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <label className={`${styles.wrapper} ${className}`}>
        <input ref={ref} type="checkbox" className={styles.input} {...props} />
        <span className={styles.checkmark}>
          <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        {label && <span className={styles.label}>{label}</span>}
        {error && <span className={styles.error}>{error}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;

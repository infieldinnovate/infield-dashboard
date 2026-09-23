'use client';

import React from 'react';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: string;
}

export default function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleSection}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

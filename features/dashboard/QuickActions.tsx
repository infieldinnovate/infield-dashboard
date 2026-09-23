'use client';

import React from 'react';
import Link from 'next/link';
import styles from './QuickActions.module.scss';
import Card from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';

const actions = [
  { label: 'New Sale', href: '/pos', icon: 'ShoppingCart', color: 'primary' },
  { label: 'Add Product', href: '/products', icon: 'PackagePlus', color: 'success' },
  { label: 'New Invoice', href: '/invoices', icon: 'FileSpreadsheet', color: 'info' },
  { label: 'New Quotation', href: '/quotations', icon: 'FileText', color: 'secondary' },
];

export default function QuickActions() {
  return (
    <Card className={styles.card} padding="lg">
      <h2 className={styles.title}>Quick Actions</h2>
      <div className={styles.grid}>
        {actions.map((action) => (
          <Link key={action.label} href={action.href} className={`${styles.action} ${styles[action.color]}`}>
            <span className={styles.icon}>
              <Icon name={action.icon} size={22} />
            </span>
            <span className={styles.label}>{action.label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

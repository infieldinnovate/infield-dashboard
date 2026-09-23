'use client';

import React from 'react';
import styles from './RecentActivity.module.scss';
import Card from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';

interface Activity {
  id: string;
  type: 'invoice' | 'payment' | 'quotation' | 'delivery' | 'user';
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  { id: 'act-1', type: 'payment', title: 'Payment received', description: 'Fresh Foods Inc paid $2,143.35', time: '2 hours ago' },
  { id: 'act-2', type: 'invoice', title: 'Invoice created', description: 'INV-2026-0006 for Acme Corporation', time: '4 hours ago' },
  { id: 'act-3', type: 'quotation', title: 'Quotation accepted', description: 'QT-001 accepted by Acme Corp ($1,434.95)', time: '1 day ago' },
  { id: 'act-4', type: 'delivery', title: 'Delivery shipped', description: 'DN-2026-0002 via DHL to Bright Solutions', time: '2 days ago' },
  { id: 'act-5', type: 'user', title: 'New user login', description: 'Priya Sharma logged in from Sales', time: '3 days ago' },
  { id: 'act-6', type: 'invoice', title: 'Invoice overdue', description: 'INV-2026-0004 for Elena Rossi', time: '4 days ago' },
];

const typeConfig: Record<string, { icon: string; color: string }> = {
  invoice: { icon: 'FileSpreadsheet', color: 'invoice' },
  payment: { icon: 'Receipt', color: 'payment' },
  quotation: { icon: 'FileText', color: 'quotation' },
  delivery: { icon: 'Truck', color: 'delivery' },
  user: { icon: 'User', color: 'user' },
};

export default function RecentActivity() {
  return (
    <Card className={styles.card} padding="lg">
      <h2 className={styles.title}>Recent Activity</h2>
      <div className={styles.list}>
        {activities.map((act) => {
          const config = typeConfig[act.type];
          return (
            <div key={act.id} className={styles.item}>
              <div className={`${styles.icon} ${styles[config.color]}`}>
                <Icon name={config.icon} size={16} />
              </div>
              <div className={styles.content}>
                <span className={styles.itemTitle}>{act.title}</span>
                <span className={styles.itemDesc}>{act.description}</span>
              </div>
              <span className={styles.time}>{act.time}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

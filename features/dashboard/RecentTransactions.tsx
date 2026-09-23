'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './RecentTransactions.module.scss';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatCurrency } from '../../components/DocumentEngine';
import { recentTransactions } from '../../data/dashboard';
import type { RecentTransaction } from '../../types';

const statusVariant: Record<string, 'success' | 'warning' | 'error'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'error',
};

export default function RecentTransactions() {
  const [selectedItem, setSelectedItem] = useState<RecentTransaction | null>(null);

  return (
    <Card className={styles.card} padding="none">
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Transactions</h2>
        <Link href="/transactions" className={styles.viewAll}>View all</Link>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((tx) => (
              <tr key={tx.id} onClick={() => setSelectedItem(tx)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className={styles.txnId}>{tx.id}</span>
                  <span className={styles.txnDate}>{tx.date}</span>
                </td>
                <td className={styles.customer}>{tx.customer}</td>
                <td className={styles.items}>{tx.items} items</td>
                <td className={styles.amount}>{formatCurrency(tx.amount)}</td>
                <td>
                  <Badge variant={statusVariant[tx.status]} size="sm">{tx.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Transaction ${selectedItem.id}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{selectedItem.customer}</span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Transaction ID: {selectedItem.id}</span>
              </div>
              <Badge variant={statusVariant[selectedItem.status]} size="md">{selectedItem.status}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatCurrency(selectedItem.amount)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</span>
                <span style={{ fontSize: '0.9rem' }}>{selectedItem.status}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</span>
                <span style={{ fontSize: '0.9rem' }}>{selectedItem.date}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Items</span>
                <span style={{ fontSize: '0.9rem' }}>{selectedItem.items} items</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}

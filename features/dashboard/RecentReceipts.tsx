'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './RecentReceipts.module.scss';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../components/DocumentEngine';
import { receipts } from '../../data/receipts';
import type { Receipt } from '../../types';

const methodLabel: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  check: 'Check',
  mobile_money: 'Mobile Money',
};

const methodVariant: Record<string, 'success' | 'primary' | 'secondary' | 'info'> = {
  cash: 'success',
  card: 'primary',
  bank_transfer: 'secondary',
  check: 'info',
  mobile_money: 'primary',
};

export default function RecentReceipts() {
  const recent = receipts.slice(0, 5);
  const [selectedItem, setSelectedItem] = useState<Receipt | null>(null);

  return (
    <Card className={styles.card} padding="none">
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Receipts</h2>
        <Link href="/receipts" className={styles.viewAll}>View all</Link>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((rcpt) => (
              <tr key={rcpt.id} onClick={() => setSelectedItem(rcpt)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className={styles.rcptId}>{rcpt.receiptNumber}</span>
                  <span className={styles.rcptDate}>{rcpt.date}</span>
                </td>
                <td className={styles.customer}>{rcpt.customerName}</td>
                <td className={styles.amount}>{formatCurrency(rcpt.amount)}</td>
                <td>
                  <Badge variant={methodVariant[rcpt.paymentMethod]} size="sm">{methodLabel[rcpt.paymentMethod]}</Badge>
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
          title={`Receipt ${selectedItem.receiptNumber}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{selectedItem.customerName}</span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Receipt #{selectedItem.receiptNumber}</span>
              </div>
              <Badge variant={methodVariant[selectedItem.paymentMethod]} size="md">{methodLabel[selectedItem.paymentMethod]}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</span>
                <span style={{ fontSize: '0.9rem' }}>{formatDate(selectedItem.date)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payment Method</span>
                <span style={{ fontSize: '0.9rem' }}>{methodLabel[selectedItem.paymentMethod]}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatCurrency(selectedItem.amount)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reference</span>
                <span style={{ fontSize: '0.9rem' }}>{selectedItem.reference}</span>
              </div>
            </div>

            {selectedItem.notes && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</span>
                <span style={{ fontSize: '0.9rem' }}>{selectedItem.notes}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Card>
  );
}

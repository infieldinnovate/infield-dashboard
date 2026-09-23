'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './RecentQuotations.module.scss';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../components/DocumentEngine';
import { quotations } from '../../data/quotations';
import type { Quotation } from '../../types';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'primary' | 'secondary'> = {
  draft: 'secondary',
  sent: 'primary',
  accepted: 'success',
  rejected: 'error',
  expired: 'warning',
};

export default function RecentQuotations() {
  const recent = quotations.slice(0, 5);
  const [selectedItem, setSelectedItem] = useState<Quotation | null>(null);

  return (
    <Card className={styles.card} padding="none">
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Quotations</h2>
        <Link href="/quotations" className={styles.viewAll}>View all</Link>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Quote</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((qt) => (
              <tr key={qt.id} onClick={() => setSelectedItem(qt)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className={styles.qtId}>{qt.id}</span>
                  <span className={styles.qtDate}>{qt.createdAt}</span>
                </td>
                <td className={styles.customer}>{qt.customerName}</td>
                <td className={styles.amount}>{formatCurrency(qt.total)}</td>
                <td>
                  <Badge variant={statusVariant[qt.status]} size="sm">{qt.status}</Badge>
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
          title={`Quotation ${selectedItem.id}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{selectedItem.customerName}</span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Quotation ID: {selectedItem.id}</span>
              </div>
              <Badge variant={statusVariant[selectedItem.status]} size="md">{selectedItem.status}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created Date</span>
                <span style={{ fontSize: '0.9rem' }}>{formatDate(selectedItem.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Valid Until</span>
                <span style={{ fontSize: '0.9rem' }}>{formatDate(selectedItem.validUntil)}</span>
              </div>
            </div>

            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.5rem 0.5rem 0' }}>Product</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '0.5rem 0 0.5rem 0.5rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItem.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.5rem 0.5rem 0.5rem 0' }}>{item.productName}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ padding: '0.5rem 0 0.5rem 0.5rem', textAlign: 'right' }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '240px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6b7280' }}>Subtotal</span>
                  <span>{formatCurrency(selectedItem.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6b7280' }}>Discount</span>
                  <span>{formatCurrency(selectedItem.discount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: '#6b7280' }}>Tax ({selectedItem.taxRate}%)</span>
                  <span>{formatCurrency(selectedItem.tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, paddingTop: '0.4rem', borderTop: '2px solid #e5e7eb' }}>
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedItem.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}

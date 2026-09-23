'use client';

import React from 'react';
import type { DocumentItem } from '../types';
import { formatCurrency } from '../types';
import styles from '../DocumentEngine.module.scss';

interface DocumentItemsTableProps {
  items: DocumentItem[];
  showPrices: boolean;
  isDeliveryNote?: boolean;
}

export default function DocumentItemsTable({
  items, showPrices, isDeliveryNote = false,
}: DocumentItemsTableProps) {
  if (isDeliveryNote) {
    return (
      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th className={styles.colItem}>Item</th>
            <th className={styles.colNum}>Qty Ordered</th>
            <th className={styles.colNum}>Qty Delivered</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const complete = (item.quantityDelivered ?? 0) === item.quantity;
            const partial = (item.quantityDelivered ?? 0) > 0 && (item.quantityDelivered ?? 0) < item.quantity;
            return (
              <tr key={i} className={styles.itemRow}>
                <td className={styles.cellItem}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.itemDesc}>Product ID: {item.productId}</span>
                </td>
                <td className={styles.cellNum}>{item.quantity}</td>
                <td className={styles.cellNum}>
                  <span className={
                    complete ? styles.qtyComplete : partial ? styles.qtyPartial : styles.qtyPending
                  }>
                    {item.quantityDelivered}
                    {complete && <span className={styles.qtyLabel}> Complete</span>}
                    {partial && <span className={styles.qtyLabel}> Partial</span>}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <table className={styles.itemsTable}>
      <thead>
        <tr>
          <th className={styles.colItem}>Item</th>
          <th className={styles.colDesc}>Description</th>
          <th className={styles.colNum}>Qty</th>
          {showPrices && <th className={styles.colNum}>Price</th>}
          {showPrices && <th className={styles.colNum}>Total</th>}
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} className={styles.itemRow}>
            <td className={styles.cellItem}>
              <span className={styles.itemName}>{item.productName}</span>
            </td>
            <td className={styles.cellDesc}>
              {item.description || `Product ID: ${item.productId}`}
            </td>
            <td className={styles.cellNum}>{item.quantity}</td>
            {showPrices && <td className={styles.cellNum}>{formatCurrency(item.unitPrice)}</td>}
            {showPrices && <td className={styles.cellNum}>{formatCurrency(item.total)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

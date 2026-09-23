'use client';

import React from 'react';
import Link from 'next/link';
import styles from './LowStockProducts.module.scss';
import Card from '../../components/ui/Card';
import { products } from '../../data/products';

export default function LowStockProducts() {
  const lowStock = products.filter((p) => p.stock <= 10);

  return (
    <Card className={styles.card} padding="lg">
      <div className={styles.header}>
        <h2 className={styles.title}>Low Stock Alert</h2>
        <Link href="/products" className={styles.viewAll}>Manage</Link>
      </div>
      <div className={styles.list}>
        {lowStock.length === 0 ? (
          <p className={styles.empty}>All products are well stocked.</p>
        ) : (
          lowStock.map((product) => (
            <div key={product.id} className={styles.item}>
              <div className={styles.info}>
                <span className={styles.name}>{product.name}</span>
                <span className={styles.sku}>{product.sku}</span>
              </div>
              <div className={styles.stockInfo}>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${product.stock <= 5 ? styles.critical : styles.warning}`}
                    style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
                  />
                </div>
                <span className={`${styles.count} ${product.stock <= 5 ? styles.criticalText : ''}`}>
                  {product.stock} left
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

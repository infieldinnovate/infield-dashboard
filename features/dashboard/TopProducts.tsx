'use client';

import React from 'react';
import styles from './TopProducts.module.scss';
import Card from '../../components/ui/Card';
import { products } from '../../data/products';

export default function TopProducts() {
  const topProducts = products.slice(0, 5);

  return (
    <Card className={styles.card} padding="none">
      <div className={styles.header}>
        <h2 className={styles.title}>Top Products</h2>
        <button className={styles.viewAll}>View all</button>
      </div>
      <div className={styles.list}>
        {topProducts.map((product, index) => (
          <div key={product.id} className={styles.item}>
            <div className={styles.rank}>{index + 1}</div>
            <div className={styles.info}>
              <span className={styles.name}>{product.name}</span>
              <span className={styles.category}>{product.category}</span>
            </div>
            <div className={styles.sales}>
              <span className={styles.salesValue}>${(product.price * (8 - index)).toFixed(0)}</span>
              <span className={styles.salesLabel}>sold</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

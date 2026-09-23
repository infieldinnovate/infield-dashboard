'use client';

import React from 'react';
import styles from './StatCard.module.scss';
import Icon from '../../components/ui/Icon';
import Card from '../../components/ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: string;
}

export default function StatCard({ title, value, change, icon }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className={styles.card} padding="lg">
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Icon name={icon} size={22} />
        </div>
        <div className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
          <Icon name={isPositive ? 'TrendingUp' : 'TrendingDown'} size={14} />
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <div className={styles.body}>
        <span className={styles.value}>{value}</span>
        <span className={styles.title}>{title}</span>
      </div>
    </Card>
  );
}

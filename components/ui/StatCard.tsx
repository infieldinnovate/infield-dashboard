'use client';

import React from 'react';
import styles from './StatCard.module.scss';
import Icon from './Icon';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: string;
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  className?: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  iconColor = 'primary',
  className = '',
}: StatCardProps) {
  const isPositive = change !== undefined ? change >= 0 : undefined;

  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.header}>
        <div className={`${styles.iconWrapper} ${styles[iconColor]}`}>
          <Icon name={icon} size={22} />
        </div>
        {isPositive !== undefined && (
          <div className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
            <Icon name={isPositive ? 'TrendingUp' : 'TrendingDown'} size={14} />
            <span>{change !== undefined ? Math.abs(change) : 0}%</span>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <span className={styles.value}>{value}</span>
        <span className={styles.title}>{title}</span>
      </div>
    </div>
  );
}

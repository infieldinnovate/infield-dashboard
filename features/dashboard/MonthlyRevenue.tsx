'use client';

import React from 'react';
import styles from './MonthlyRevenue.module.scss';
import Card from '../../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', revenue: 42000 },
  { month: 'Feb', revenue: 38000 },
  { month: 'Mar', revenue: 51000 },
  { month: 'Apr', revenue: 47000 },
  { month: 'May', revenue: 62000 },
  { month: 'Jun', revenue: 58000 },
];

export default function MonthlyRevenue() {
  return (
    <Card className={styles.card} padding="lg">
      <div className={styles.header}>
        <h2 className={styles.title}>Monthly Revenue</h2>
        <span className={styles.subtitle}>YTD 2026</span>
      </div>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary-500)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--primary-500)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid var(--neutral-200)', fontSize: 13 }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="var(--primary-500)" strokeWidth={2} fill="url(#revenueGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

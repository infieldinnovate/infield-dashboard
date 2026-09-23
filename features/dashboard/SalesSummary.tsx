'use client';

import React from 'react';
import styles from './SalesSummary.module.scss';
import Card from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'Mon', sales: 4200 },
  { day: 'Tue', sales: 3800 },
  { day: 'Wed', sales: 5100 },
  { day: 'Thu', sales: 4700 },
  { day: 'Fri', sales: 6200 },
  { day: 'Sat', sales: 7500 },
  { day: 'Sun', sales: 5800 },
];

export default function SalesSummary() {
  return (
    <Card className={styles.card} padding="lg">
      <div className={styles.header}>
        <h2 className={styles.title}>Sales Summary</h2>
        <span className={styles.subtitle}>This week</span>
      </div>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip
              cursor={{ fill: 'var(--neutral-100)', radius: 8 }}
              contentStyle={{ borderRadius: 10, border: '1px solid var(--neutral-200)', fontSize: 13 }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
            />
            <Bar dataKey="sales" fill="var(--primary-500)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

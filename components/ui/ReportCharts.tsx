'use client';

import React from 'react';
import Card from '../ui/Card';
import Icon from '../ui/Icon';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TimeSeriesPoint, CategoryBreakdown } from '../../types';
import { formatCompactCurrency } from '../../lib/reportUtils';
import { formatCurrency } from '../DocumentEngine';
import styles from './ReportCharts.module.scss';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, icon, children, className = '' }: ChartCardProps) {
  return (
    <Card className={`${styles.chartCard} ${className}`} padding="lg">
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {icon && <span className={styles.icon}><Icon name={icon} size={18} /></span>}
          <h3 className={styles.title}>{title}</h3>
        </div>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      <div className={styles.chartBody}>{children}</div>
    </Card>
  );
}

interface AreaTrendProps {
  data: TimeSeriesPoint[];
  label?: string;
  height?: number;
}

const CHART_COLORS = ['var(--primary-500)', 'var(--secondary-500)', 'var(--accent-500)', 'var(--success-500)', 'var(--warning-500)', 'var(--error-500)'];

export function AreaTrend({ data, label = 'Value', height = 280 }: AreaTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="reportAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-500)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--primary-500)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--neutral-200)', fontSize: 13 }} formatter={(value: number) => [formatCurrency(value), label]} />
        <Area type="monotone" dataKey="value" stroke="var(--primary-500)" strokeWidth={2} fill="url(#reportAreaGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface BarTrendProps {
  data: TimeSeriesPoint[];
  label?: string;
  height?: number;
  colorIndex?: number;
}

export function BarTrend({ data, label = 'Value', height = 280, colorIndex = 0 }: BarTrendProps) {
  const color = CHART_COLORS[colorIndex % CHART_COLORS.length];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} />
        <Tooltip cursor={{ fill: 'var(--neutral-100)', radius: 8 }} contentStyle={{ borderRadius: 10, border: '1px solid var(--neutral-200)', fontSize: 13 }} formatter={(value: number) => [formatCurrency(value), label]} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DualBarTrendProps {
  data: { month: string; revenue: number; profit: number }[];
  height?: number;
}

export function DualBarTrend({ data, height = 280 }: DualBarTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} />
        <Tooltip cursor={{ fill: 'var(--neutral-100)', radius: 8 }} contentStyle={{ borderRadius: 10, border: '1px solid var(--neutral-200)', fontSize: 13 }} formatter={(value: number) => formatCurrency(value)} />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="revenue" fill="var(--primary-500)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="profit" fill="var(--success-500)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface LineTrendProps {
  data: TimeSeriesPoint[];
  label?: string;
  height?: number;
}

export function LineTrend({ data, label = 'Value', height = 280 }: LineTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-200)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCompactCurrency(v)} />
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--neutral-200)', fontSize: 13 }} formatter={(value: number) => [formatCurrency(value), label]} />
        <Line type="monotone" dataKey="value" stroke="var(--secondary-500)" strokeWidth={2} dot={{ fill: 'var(--secondary-500)', r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface CategoryPieProps {
  data: CategoryBreakdown[];
  height?: number;
}

export function CategoryPie({ data, height = 280 }: CategoryPieProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--neutral-200)', fontSize: 13 }} formatter={(value: number, _name: string, entry: { payload?: CategoryBreakdown }) => [entry?.payload?.category ?? '', formatCurrency(value)]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

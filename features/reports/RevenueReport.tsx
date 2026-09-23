'use client';

import React from 'react';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { ChartCard, AreaTrend, DualBarTrend, CategoryPie } from '../../components/ui/ReportCharts';
import { formatCurrency } from '../../components/DocumentEngine';
import { revenueReportData, getTimeSeries } from '../../data/reports';
import { RevenueReportData, ReportPeriod } from '../../types';
import { downloadCSV, printReport, formatPercent } from '../../lib/reportUtils';
import styles from './RevenueReport.module.scss';

interface RevenueReportProps {
  period: ReportPeriod;
  onRegisterActions: (actions: { print: () => void; csv: () => void; pdf: () => void }) => void;
}

export default function RevenueReport({ period, onRegisterActions }: RevenueReportProps) {
  const data = revenueReportData;
  const timeSeries = getTimeSeries(period);

  const handlePrint = () => {
    const rows = data.monthlyComparison.map((m) => `<tr><td>${m.month}</td><td>${formatCurrency(m.revenue)}</td><td>${formatCurrency(m.profit)}</td></tr>`).join('');
    printReport('Revenue Report', `
      <div class="stat-row">
        <div class="stat"><div class="stat-label">Total Revenue</div><div class="stat-value">${formatCurrency(data.totalRevenue)}</div></div>
        <div class="stat"><div class="stat-label">Growth</div><div class="stat-value">${formatPercent(data.revenueGrowth)}</div></div>
        <div class="stat"><div class="stat-label">Gross Profit</div><div class="stat-value">${formatCurrency(data.grossProfit)}</div></div>
        <div class="stat"><div class="stat-label">Profit Margin</div><div class="stat-value">${formatPercent(data.profitMargin)}</div></div>
      </div>
      <table><thead><tr><th>Month</th><th>Revenue</th><th>Profit</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  };

  const handleCSV = () => {
    downloadCSV('revenue-report.csv',
      ['Month', 'Revenue', 'Profit'],
      data.monthlyComparison.map((m) => [m.month, m.revenue, m.profit]),
    );
  };

  React.useEffect(() => {
    onRegisterActions({ print: handlePrint, csv: handleCSV, pdf: handlePrint });
  }, [period]);

  const categoryColumns = [
    { key: 'category', header: 'Category', render: (row: RevenueReportData['byCategory'][0]) => <span className={styles.categoryName}>{row.category}</span> },
    { key: 'count', header: 'Orders', align: 'center' as const, render: (row: RevenueReportData['byCategory'][0]) => <Badge variant="primary" size="sm">{row.count}</Badge> },
    { key: 'value', header: 'Revenue', align: 'right' as const, render: (row: RevenueReportData['byCategory'][0]) => <span className={styles.amount}>{formatCurrency(row.value)}</span> },
    { key: 'share', header: 'Share', align: 'right' as const, render: (row: RevenueReportData['byCategory'][0]) => {
      const share = (row.value / data.byCategory.reduce((s, c) => s + c.value, 0)) * 100;
      return <span className={styles.share}>{formatPercent(share)}</span>;
    }},
  ];

  const monthlyColumns = [
    { key: 'month', header: 'Month', render: (row: RevenueReportData['monthlyComparison'][0]) => <span className={styles.monthLabel}>{row.month}</span> },
    { key: 'revenue', header: 'Revenue', align: 'right' as const, render: (row: RevenueReportData['monthlyComparison'][0]) => <span className={styles.amount}>{formatCurrency(row.revenue)}</span> },
    { key: 'profit', header: 'Profit', align: 'right' as const, render: (row: RevenueReportData['monthlyComparison'][0]) => <span className={styles.profit}>{formatCurrency(row.profit)}</span> },
  ];

  return (
    <div className={styles.report}>
      <div className={styles.statsGrid}>
        <StatCard title="Total Revenue" value={formatCurrency(data.totalRevenue)} change={data.revenueGrowth} icon="Banknote" iconColor="primary" />
        <StatCard title="Gross Profit" value={formatCurrency(data.grossProfit)} change={14.5} icon="TrendingUp" iconColor="success" />
        <StatCard title="Profit Margin" value={formatPercent(data.profitMargin)} change={2.1} icon="Percent" iconColor="info" />
        <StatCard title="Revenue Growth" value={formatPercent(data.revenueGrowth)} change={3.8} icon="ArrowUpRight" iconColor="secondary" />
      </div>

      <div className={styles.chartsGrid}>
        <ChartCard title="Revenue Trend" subtitle={period} icon="TrendingUp">
          <AreaTrend data={timeSeries} label="Revenue" />
        </ChartCard>
        <ChartCard title="Revenue by Category" icon="PieChart">
          <CategoryPie data={data.byCategory} />
        </ChartCard>
      </div>

      <ChartCard title="Revenue vs Profit" subtitle="Monthly comparison" icon="BarChart3">
        <DualBarTrend data={data.monthlyComparison} />
      </ChartCard>

      <div className={styles.tablesGrid}>
        <ChartCard title="Revenue by Category" icon="Layers">
          <Table columns={categoryColumns} data={data.byCategory} keyExtractor={(row) => row.category} />
        </ChartCard>
        <ChartCard title="Monthly Breakdown" icon="Calendar">
          <Table columns={monthlyColumns} data={data.monthlyComparison} keyExtractor={(row) => row.month} />
        </ChartCard>
      </div>
    </div>
  );
}

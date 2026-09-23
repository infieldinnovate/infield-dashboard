'use client';

import React from 'react';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { ChartCard, BarTrend, CategoryPie } from '../../components/ui/ReportCharts';
import { formatCurrency } from '../../components/DocumentEngine';
import { customerReportData } from '../../data/reports';
import { CustomerReportData } from '../../types';
import { downloadCSV, printReport, formatPercent } from '../../lib/reportUtils';
import styles from './CustomersReport.module.scss';

interface CustomersReportProps {
  onRegisterActions: (actions: { print: () => void; csv: () => void; pdf: () => void }) => void;
}

export default function CustomersReport({ onRegisterActions }: CustomersReportProps) {
  const data = customerReportData;

  const handlePrint = () => {
    const rows = data.topSpenders.map((c) => `<tr><td>${c.name}</td><td>${c.orders}</td><td>${formatCurrency(c.totalSpent)}</td><td>${c.type}</td></tr>`).join('');
    printReport('Customer Report', `
      <div class="stat-row">
        <div class="stat"><div class="stat-label">Total Customers</div><div class="stat-value">${data.totalCustomers}</div></div>
        <div class="stat"><div class="stat-label">Active</div><div class="stat-value">${data.activeCustomers}</div></div>
        <div class="stat"><div class="stat-label">New Customers</div><div class="stat-value">${data.newCustomers}</div></div>
        <div class="stat"><div class="stat-label">Avg Balance</div><div class="stat-value">${formatCurrency(data.averageBalance)}</div></div>
      </div>
      <table><thead><tr><th>Customer</th><th>Orders</th><th>Total Spent</th><th>Type</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  };

  const handleCSV = () => {
    downloadCSV('customer-report.csv',
      ['Customer', 'Orders', 'Total Spent', 'Type'],
      data.topSpenders.map((c) => [c.name, c.orders, c.totalSpent, c.type]),
    );
  };

  React.useEffect(() => {
    onRegisterActions({ print: handlePrint, csv: handleCSV, pdf: handlePrint });
  }, []);

  const spenderColumns = [
    { key: 'name', header: 'Customer', render: (row: CustomerReportData['topSpenders'][0]) => (
      <span className={styles.customerName}>{row.name}</span>
    )},
    { key: 'type', header: 'Type', render: (row: CustomerReportData['topSpenders'][0]) => <Badge variant={row.type === 'business' ? 'primary' : 'secondary'} size="sm">{row.type}</Badge> },
    { key: 'orders', header: 'Orders', align: 'center' as const, render: (row: CustomerReportData['topSpenders'][0]) => <Badge size="sm">{row.orders}</Badge> },
    { key: 'totalSpent', header: 'Total Spent', align: 'right' as const, render: (row: CustomerReportData['topSpenders'][0]) => <span className={styles.amount}>{formatCurrency(row.totalSpent)}</span> },
  ];

  const balanceColumns = [
    { key: 'name', header: 'Customer', render: (row: CustomerReportData['outstandingBalances'][0]) => <span className={styles.customerName}>{row.name}</span> },
    { key: 'balance', header: 'Balance', align: 'right' as const, render: (row: CustomerReportData['outstandingBalances'][0]) => <span className={styles.amount}>{formatCurrency(row.balance)}</span> },
    { key: 'creditLimit', header: 'Credit Limit', align: 'right' as const, render: (row: CustomerReportData['outstandingBalances'][0]) => <span className={styles.limit}>{formatCurrency(row.creditLimit)}</span> },
    { key: 'utilization', header: 'Utilization', align: 'center' as const, render: (row: CustomerReportData['outstandingBalances'][0]) => {
      const pct = (row.balance / row.creditLimit) * 100;
      return <Badge variant={pct > 80 ? 'error' : pct > 50 ? 'warning' : 'success'} size="sm">{formatPercent(pct)}</Badge>;
    }},
  ];

  return (
    <div className={styles.report}>
      <div className={styles.statsGrid}>
        <StatCard title="Total Customers" value={String(data.totalCustomers)} change={7.3} icon="Users" iconColor="primary" />
        <StatCard title="Active Customers" value={String(data.activeCustomers)} change={5.0} icon="UserCheck" iconColor="success" />
        <StatCard title="New Customers" value={String(data.newCustomers)} change={50.0} icon="UserPlus" iconColor="secondary" />
        <StatCard title="Avg Balance" value={formatCurrency(data.averageBalance)} change={-3.2} icon="Wallet" iconColor="warning" />
      </div>

      <div className={styles.chartsGrid}>
        <ChartCard title="Customer Types" icon="Users">
          <CategoryPie data={data.byType} />
        </ChartCard>
        <ChartCard title="Top Spenders" subtitle="By total spent" icon="TrendingUp">
          <BarTrend data={data.topSpenders.map((c) => ({ label: c.name.split(' ').slice(0, 2).join(' '), value: c.totalSpent }))} label="Spent" colorIndex={2} />
        </ChartCard>
      </div>

      <ChartCard title="Outstanding Balances" subtitle="Customers with unpaid balances" icon="AlertCircle">
        <Table columns={balanceColumns} data={data.outstandingBalances} keyExtractor={(row) => row.name} />
      </ChartCard>
    </div>
  );
}

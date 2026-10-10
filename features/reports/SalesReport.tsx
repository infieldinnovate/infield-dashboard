'use client';

import React from 'react';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { formatCurrency } from '../../lib/documentUtils';
import { salesReportData } from '../../data/reports';
import { ReportPeriod, SalesReportData } from '../../types';
import { downloadCSV, printReport, formatPercent } from '../../lib/reportUtils';
import styles from './SalesReport.module.scss';

interface SalesReportProps {
  period: ReportPeriod;
  onRegisterActions: (actions: { print: () => void; csv: () => void; pdf: () => void }) => void;
}

export default function SalesReport({ period, onRegisterActions }: SalesReportProps) {
  const data = salesReportData;

  const handlePrint = () => {
    const statsHtml = data.topCustomers.map((c) => `<tr><td>${c.name}</td><td>${c.orders}</td><td>${formatCurrency(c.totalSpent)}</td></tr>`).join('');
    printReport('Sales Report', `
      <div class="stat-row">
        <div class="stat"><div class="stat-label">Total Sales</div><div class="stat-value">${formatCurrency(data.totalSales)}</div></div>
        <div class="stat"><div class="stat-label">Transactions</div><div class="stat-value">${data.totalTransactions}</div></div>
        <div class="stat"><div class="stat-label">Avg Order Value</div><div class="stat-value">${formatCurrency(data.averageOrderValue)}</div></div>
        <div class="stat"><div class="stat-label">Growth</div><div class="stat-value">${formatPercent(data.salesGrowth)}</div></div>
      </div>
      <table><thead><tr><th>Customer</th><th>Orders</th><th>Total Spent</th></tr></thead><tbody>${statsHtml}</tbody></table>
    `);
  };

  const handleCSV = () => {
    downloadCSV('sales-report.csv',
      ['Customer', 'Orders', 'Total Spent'],
      data.topCustomers.map((c) => [c.name, c.orders, c.totalSpent]),
    );
  };

  React.useEffect(() => {
    onRegisterActions({ print: handlePrint, csv: handleCSV, pdf: handlePrint });
  }, [period]);

  const topCustomerColumns = [
    { key: 'name', header: 'Customer', render: (row: SalesReportData['topCustomers'][0]) => (
      <span className={styles.customerName}>{row.name}</span>
    )},
    { key: 'orders', header: 'Orders', align: 'center' as const, render: (row: SalesReportData['topCustomers'][0]) => <Badge size="sm">{row.orders}</Badge> },
    { key: 'totalSpent', header: 'Total Spent', align: 'right' as const, render: (row: SalesReportData['topCustomers'][0]) => <span className={styles.amount}>{formatCurrency(row.totalSpent)}</span> },
  ];

  return (
    <div className={styles.report}>
      <div className={styles.statsGrid}>
        <StatCard title="Total Sales" value={formatCurrency(data.totalSales)} change={data.salesGrowth} icon="Banknote" iconColor="primary" />
        <StatCard title="Transactions" value={String(data.totalTransactions)} change={0} icon="ShoppingCart" iconColor="secondary" />
        <StatCard title="Avg Order Value" value={formatCurrency(data.averageOrderValue)} change={5.2} icon="TrendingUp" iconColor="success" />
        <StatCard title="Payment Methods" value={String(data.byPaymentMethod.length)} icon="CreditCard" iconColor="info" />
      </div>

      <Card padding="none">
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Top Customers</h3>
          <span className={styles.cardSubtitle}>By total spent</span>
        </div>
        <Table
          columns={topCustomerColumns}
          data={data.topCustomers}
          keyExtractor={(row) => row.name}
        />
      </Card>
    </div>
  );
}

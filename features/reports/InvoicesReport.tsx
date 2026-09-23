'use client';

import React from 'react';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import { ChartCard, AreaTrend, BarTrend } from '../../components/ui/ReportCharts';
import { formatCurrency, formatDateShort } from '../../components/DocumentEngine';
import { invoiceReportData, getTimeSeries } from '../../data/reports';
import { InvoiceReportData, ReportPeriod } from '../../types';
import { downloadCSV, printReport } from '../../lib/reportUtils';
import styles from './InvoicesReport.module.scss';

interface InvoicesReportProps {
  period: ReportPeriod;
  onRegisterActions: (actions: { print: () => void; csv: () => void; pdf: () => void }) => void;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  paid: 'success',
  unpaid: 'warning',
  overdue: 'error',
  partial: 'info',
};

export default function InvoicesReport({ period, onRegisterActions }: InvoicesReportProps) {
  const data = invoiceReportData;
  const timeSeries = getTimeSeries(period);

  const handlePrint = () => {
    const rows = data.recentInvoices.map((inv) => `<tr><td>${inv.number}</td><td>${inv.customer}</td><td>${formatCurrency(inv.amount)}</td><td>${inv.status}</td><td>${inv.date}</td></tr>`).join('');
    printReport('Invoice Report', `
      <div class="stat-row">
        <div class="stat"><div class="stat-label">Total Invoiced</div><div class="stat-value">${formatCurrency(data.totalInvoiced)}</div></div>
        <div class="stat"><div class="stat-label">Collected</div><div class="stat-value">${formatCurrency(data.totalCollected)}</div></div>
        <div class="stat"><div class="stat-label">Outstanding</div><div class="stat-value">${formatCurrency(data.outstandingAmount)}</div></div>
        <div class="stat"><div class="stat-label">Overdue</div><div class="stat-value">${formatCurrency(data.overdueAmount)}</div></div>
      </div>
      <table><thead><tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  };

  const handleCSV = () => {
    downloadCSV('invoice-report.csv',
      ['Invoice #', 'Customer', 'Amount', 'Status', 'Date'],
      data.recentInvoices.map((inv) => [inv.number, inv.customer, inv.amount, inv.status, inv.date]),
    );
  };

  React.useEffect(() => {
    onRegisterActions({ print: handlePrint, csv: handleCSV, pdf: handlePrint });
  }, [period]);

  const statusColumns = [
    { key: 'category', header: 'Status', render: (row: InvoiceReportData['byStatus'][0]) => <span className={styles.statusLabel}>{row.category}</span> },
    { key: 'value', header: 'Count', align: 'center' as const, render: (row: InvoiceReportData['byStatus'][0]) => <Badge variant={statusVariantMap[row.category.toLowerCase()] || 'default'} size="sm">{row.value}</Badge> },
  ];

  const invoiceColumns = [
    { key: 'number', header: 'Invoice #', render: (row: InvoiceReportData['recentInvoices'][0]) => <span className={styles.invoiceNumber}>{row.number}</span> },
    { key: 'customer', header: 'Customer', render: (row: InvoiceReportData['recentInvoices'][0]) => <span className={styles.customerName}>{row.customer}</span> },
    { key: 'amount', header: 'Amount', align: 'right' as const, render: (row: InvoiceReportData['recentInvoices'][0]) => <span className={styles.amount}>{formatCurrency(row.amount)}</span> },
    { key: 'status', header: 'Status', align: 'center' as const, render: (row: InvoiceReportData['recentInvoices'][0]) => <Badge variant={statusVariantMap[row.status] || 'default'} size="sm">{row.status}</Badge> },
    { key: 'date', header: 'Date', render: (row: InvoiceReportData['recentInvoices'][0]) => <span className={styles.date}>{formatDateShort(row.date)}</span> },
  ];

  return (
    <div className={styles.report}>
      <div className={styles.statsGrid}>
        <StatCard title="Total Invoiced" value={formatCurrency(data.totalInvoiced)} change={15.2} icon="FileSpreadsheet" iconColor="primary" />
        <StatCard title="Collected" value={formatCurrency(data.totalCollected)} change={18.5} icon="CheckCircle2" iconColor="success" />
        <StatCard title="Outstanding" value={formatCurrency(data.outstandingAmount)} change={-5.3} icon="Clock" iconColor="warning" />
        <StatCard title="Overdue" value={formatCurrency(data.overdueAmount)} change={-2.1} icon="AlertCircle" iconColor="error" />
      </div>

      <div className={styles.chartsGrid}>
        <ChartCard title="Invoice Trend" subtitle={period} icon="TrendingUp">
          <AreaTrend data={timeSeries} label="Invoiced" />
        </ChartCard>
        <ChartCard title="Invoices by Status" icon="BarChart3">
          <BarTrend data={data.byStatus.map((s) => ({ label: s.category, value: s.value }))} label="Count" colorIndex={3} />
        </ChartCard>
      </div>

      <ChartCard title="Status Summary" icon="PieChart">
        <Table columns={statusColumns} data={data.byStatus} keyExtractor={(row) => row.category} />
      </ChartCard>

      <ChartCard title="Recent Invoices" subtitle="All invoices" icon="FileSpreadsheet">
        <Table columns={invoiceColumns} data={data.recentInvoices} keyExtractor={(row) => row.number} />
      </ChartCard>
    </div>
  );
}

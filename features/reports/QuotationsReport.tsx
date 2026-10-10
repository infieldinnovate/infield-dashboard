'use client';

import React from 'react';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { formatCurrency, formatDateShort } from '../../lib/documentUtils';
import { quotationReportData } from '../../data/reports';
import { QuotationReportData, ReportPeriod } from '../../types';
import { downloadCSV, printReport, formatPercent } from '../../lib/reportUtils';
import styles from './QuotationsReport.module.scss';

interface QuotationsReportProps {
  period: ReportPeriod;
  onRegisterActions: (actions: { print: () => void; csv: () => void; pdf: () => void }) => void;
}

const statusVariantMap: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  accepted: 'success',
  sent: 'info',
  draft: 'default',
  rejected: 'error',
  expired: 'warning',
};

export default function QuotationsReport({ period, onRegisterActions }: QuotationsReportProps) {
  const data = quotationReportData;

  const handlePrint = () => {
    const rows = data.recentQuotations.map((q) => `<tr><td>${q.id}</td><td>${q.customer}</td><td>${formatCurrency(q.amount)}</td><td>${q.status}</td><td>${q.date}</td></tr>`).join('');
    printReport('Quotation Report', `
      <div class="stat-row">
        <div class="stat"><div class="stat-label">Total Quotations</div><div class="stat-value">${data.totalQuotations}</div></div>
        <div class="stat"><div class="stat-label">Accepted</div><div class="stat-value">${data.acceptedCount}</div></div>
        <div class="stat"><div class="stat-label">Acceptance Rate</div><div class="stat-value">${formatPercent(data.acceptanceRate)}</div></div>
        <div class="stat"><div class="stat-label">Total Quoted</div><div class="stat-value">${formatCurrency(data.totalQuotedValue)}</div></div>
      </div>
      <table><thead><tr><th>Quote #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  };

  const handleCSV = () => {
    downloadCSV('quotation-report.csv',
      ['Quote #', 'Customer', 'Amount', 'Status', 'Date'],
      data.recentQuotations.map((q) => [q.id, q.customer, q.amount, q.status, q.date]),
    );
  };

  React.useEffect(() => {
    onRegisterActions({ print: handlePrint, csv: handleCSV, pdf: handlePrint });
  }, [period]);

  const statusColumns = [
    { key: 'category', header: 'Status', render: (row: QuotationReportData['byStatus'][0]) => <span className={styles.statusLabel}>{row.category}</span> },
    { key: 'value', header: 'Count', align: 'center' as const, render: (row: QuotationReportData['byStatus'][0]) => <Badge variant={statusVariantMap[row.category.toLowerCase()] || 'default'} size="sm">{row.value}</Badge> },
  ];

  const quotationColumns = [
    { key: 'id', header: 'Quote #', render: (row: QuotationReportData['recentQuotations'][0]) => <span className={styles.quoteId}>{row.id}</span> },
    { key: 'customer', header: 'Customer', render: (row: QuotationReportData['recentQuotations'][0]) => <span className={styles.customerName}>{row.customer}</span> },
    { key: 'amount', header: 'Amount', align: 'right' as const, render: (row: QuotationReportData['recentQuotations'][0]) => <span className={styles.amount}>{formatCurrency(row.amount)}</span> },
    { key: 'status', header: 'Status', align: 'center' as const, render: (row: QuotationReportData['recentQuotations'][0]) => <Badge variant={statusVariantMap[row.status] || 'default'} size="sm">{row.status}</Badge> },
    { key: 'date', header: 'Date', render: (row: QuotationReportData['recentQuotations'][0]) => <span className={styles.date}>{formatDateShort(row.date)}</span> },
  ];

  return (
    <div className={styles.report}>
      <div className={styles.statsGrid}>
        <StatCard title="Total Quotations" value={String(data.totalQuotations)} change={3.0} icon="FileText" iconColor="primary" />
        <StatCard title="Accepted" value={String(data.acceptedCount)} change={20.0} icon="CheckCircle2" iconColor="success" />
        <StatCard title="Acceptance Rate" value={formatPercent(data.acceptanceRate)} change={5.2} icon="Percent" iconColor="info" />
        <StatCard title="Total Quoted Value" value={formatCurrency(data.totalQuotedValue)} change={12.8} icon="Banknote" iconColor="secondary" />
      </div>

      <Card padding="none">
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Status Summary</h3>
        </div>
        <Table columns={statusColumns} data={data.byStatus} keyExtractor={(row) => row.category} />
      </Card>

      <Card padding="none">
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Recent Quotations</h3>
          <span className={styles.cardSubtitle}>All quotations</span>
        </div>
        <Table columns={quotationColumns} data={data.recentQuotations} keyExtractor={(row) => row.id} />
      </Card>
    </div>
  );
}

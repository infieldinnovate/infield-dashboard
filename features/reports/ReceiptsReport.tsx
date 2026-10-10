'use client';

import React from 'react';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { formatCurrency, formatDateShort } from '../../lib/documentUtils';
import { receiptReportData } from '../../data/reports';
import { ReceiptReportData, ReportPeriod } from '../../types';
import { downloadCSV, printReport } from '../../lib/reportUtils';
import { paymentMethodLabels } from '../../lib/documentUtils';
import styles from './ReceiptsReport.module.scss';

interface ReceiptsReportProps {
  period: ReportPeriod;
  onRegisterActions: (actions: { print: () => void; csv: () => void; pdf: () => void }) => void;
}

export default function ReceiptsReport({ period, onRegisterActions }: ReceiptsReportProps) {
  const data = receiptReportData;

  const handlePrint = () => {
    const rows = data.recentReceipts.map((r) => `<tr><td>${r.number}</td><td>${r.customer}</td><td>${formatCurrency(r.amount)}</td><td>${paymentMethodLabels[r.method] || r.method}</td><td>${r.date}</td></tr>`).join('');
    printReport('Receipt Report', `
      <div class="stat-row">
        <div class="stat"><div class="stat-label">Total Collected</div><div class="stat-value">${formatCurrency(data.totalCollected)}</div></div>
        <div class="stat"><div class="stat-label">Receipts</div><div class="stat-value">${data.receiptCount}</div></div>
        <div class="stat"><div class="stat-label">Avg Receipt</div><div class="stat-value">${formatCurrency(data.averageReceipt)}</div></div>
      </div>
      <table><thead><tr><th>Receipt #</th><th>Customer</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  };

  const handleCSV = () => {
    downloadCSV('receipt-report.csv',
      ['Receipt #', 'Customer', 'Amount', 'Method', 'Date'],
      data.recentReceipts.map((r) => [r.number, r.customer, r.amount, r.method, r.date]),
    );
  };

  React.useEffect(() => {
    onRegisterActions({ print: handlePrint, csv: handleCSV, pdf: handlePrint });
  }, [period]);

  const receiptColumns = [
    { key: 'number', header: 'Receipt #', render: (row: ReceiptReportData['recentReceipts'][0]) => <span className={styles.receiptNumber}>{row.number}</span> },
    { key: 'customer', header: 'Customer', render: (row: ReceiptReportData['recentReceipts'][0]) => <span className={styles.customerName}>{row.customer}</span> },
    { key: 'amount', header: 'Amount', align: 'right' as const, render: (row: ReceiptReportData['recentReceipts'][0]) => <span className={styles.amount}>{formatCurrency(row.amount)}</span> },
    { key: 'method', header: 'Method', align: 'center' as const, render: (row: ReceiptReportData['recentReceipts'][0]) => <Badge variant="primary" size="sm">{paymentMethodLabels[row.method] || row.method}</Badge> },
    { key: 'date', header: 'Date', render: (row: ReceiptReportData['recentReceipts'][0]) => <span className={styles.date}>{formatDateShort(row.date)}</span> },
  ];

  return (
    <div className={styles.report}>
      <div className={styles.statsGrid}>
        <StatCard title="Total Collected" value={formatCurrency(data.totalCollected)} change={18.5} icon="Banknote" iconColor="success" />
        <StatCard title="Receipts" value={String(data.receiptCount)} change={3.0} icon="Receipt" iconColor="primary" />
        <StatCard title="Avg Receipt" value={formatCurrency(data.averageReceipt)} change={5.2} icon="TrendingUp" iconColor="info" />
        <StatCard title="Payment Methods" value={String(data.byPaymentMethod.length)} icon="CreditCard" iconColor="secondary" />
      </div>

      <Card padding="none">
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Recent Receipts</h3>
          <span className={styles.cardSubtitle}>All receipts</span>
        </div>
        <Table columns={receiptColumns} data={data.recentReceipts} keyExtractor={(row) => row.number} />
      </Card>
    </div>
  );
}

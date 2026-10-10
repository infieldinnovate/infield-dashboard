'use client';

import React from 'react';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { formatCurrency } from '../../lib/documentUtils';
import { inventoryReportData } from '../../data/reports';
import { InventoryReportData } from '../../types';
import { downloadCSV, printReport } from '../../lib/reportUtils';
import styles from './InventoryReport.module.scss';

interface InventoryReportProps {
  onRegisterActions: (actions: { print: () => void; csv: () => void; pdf: () => void }) => void;
}

export default function InventoryReport({ onRegisterActions }: InventoryReportProps) {
  const data = inventoryReportData;

  const handlePrint = () => {
    const rows = data.stockLevels.slice(0, 15).map((s) => `<tr><td>${s.name}</td><td>${s.category}</td><td>${s.stock}</td><td>${formatCurrency(s.value)}</td><td>${s.status}</td></tr>`).join('');
    printReport('Inventory Report', `
      <div class="stat-row">
        <div class="stat"><div class="stat-label">Stock Value</div><div class="stat-value">${formatCurrency(data.totalStockValue)}</div></div>
        <div class="stat"><div class="stat-label">Total Items</div><div class="stat-value">${data.totalItems}</div></div>
        <div class="stat"><div class="stat-label">Low Stock</div><div class="stat-value">${data.lowStockCount}</div></div>
        <div class="stat"><div class="stat-label">Out of Stock</div><div class="stat-value">${data.outOfStockCount}</div></div>
      </div>
      <table><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Value</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  };

  const handleCSV = () => {
    downloadCSV('inventory-report.csv',
      ['Product', 'Category', 'Stock', 'Value', 'Status'],
      data.stockLevels.map((s) => [s.name, s.category, s.stock, s.value, s.status]),
    );
  };

  React.useEffect(() => {
    onRegisterActions({ print: handlePrint, csv: handleCSV, pdf: handlePrint });
  }, []);

  const statusVariant = (status: 'in_stock' | 'low' | 'out'): 'success' | 'warning' | 'error' => {
    if (status === 'in_stock') return 'success';
    if (status === 'low') return 'warning';
    return 'error';
  };

  const statusLabel = (status: 'in_stock' | 'low' | 'out'): string => {
    if (status === 'in_stock') return 'In Stock';
    if (status === 'low') return 'Low Stock';
    return 'Out of Stock';
  };

  const categoryColumns = [
    { key: 'category', header: 'Category', render: (row: InventoryReportData['byCategory'][0]) => <span className={styles.categoryName}>{row.category}</span> },
    { key: 'items', header: 'Items', align: 'center' as const, render: (row: InventoryReportData['byCategory'][0]) => <Badge variant="primary" size="sm">{row.items}</Badge> },
    { key: 'stock', header: 'Total Stock', align: 'center' as const, render: (row: InventoryReportData['byCategory'][0]) => <span>{row.stock.toLocaleString()}</span> },
    { key: 'value', header: 'Stock Value', align: 'right' as const, render: (row: InventoryReportData['byCategory'][0]) => <span className={styles.amount}>{formatCurrency(row.value)}</span> },
  ];

  const stockLevelColumns = [
    { key: 'name', header: 'Product', render: (row: InventoryReportData['stockLevels'][0]) => <span className={styles.productName}>{row.name}</span> },
    { key: 'category', header: 'Category', render: (row: InventoryReportData['stockLevels'][0]) => <Badge size="sm">{row.category}</Badge> },
    { key: 'stock', header: 'Stock', align: 'center' as const, render: (row: InventoryReportData['stockLevels'][0]) => <Badge variant={statusVariant(row.status)} size="sm">{row.stock}</Badge> },
    { key: 'value', header: 'Value', align: 'right' as const, render: (row: InventoryReportData['stockLevels'][0]) => <span className={styles.amount}>{formatCurrency(row.value)}</span> },
    { key: 'status', header: 'Status', align: 'center' as const, render: (row: InventoryReportData['stockLevels'][0]) => <Badge variant={statusVariant(row.status)} size="sm">{statusLabel(row.status)}</Badge> },
  ];

  return (
    <div className={styles.report}>
      <div className={styles.statsGrid}>
        <StatCard title="Stock Value" value={formatCurrency(data.totalStockValue)} change={12.3} icon="Warehouse" iconColor="primary" />
        <StatCard title="Total Items" value={String(data.totalItems)} change={5.0} icon="Package" iconColor="secondary" />
        <StatCard title="Low Stock" value={String(data.lowStockCount)} change={-8.5} icon="AlertTriangle" iconColor="warning" />
        <StatCard title="Out of Stock" value={String(data.outOfStockCount)} icon="XCircle" iconColor="error" />
      </div>

      <Card padding="none">
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Inventory by Category</h3>
        </div>
        <Table columns={categoryColumns} data={data.byCategory} keyExtractor={(row) => row.category} />
      </Card>

      <Card padding="none">
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Stock Levels</h3>
          <span className={styles.cardSubtitle}>All products</span>
        </div>
        <Table columns={stockLevelColumns} data={data.stockLevels.slice(0, 10)} keyExtractor={(row) => row.name} />
      </Card>
    </div>
  );
}

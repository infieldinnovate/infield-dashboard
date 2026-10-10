'use client';

import React from 'react';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { formatCurrency } from '../../lib/documentUtils';
import { productReportData } from '../../data/reports';
import { ProductReportData } from '../../types';
import { downloadCSV, printReport } from '../../lib/reportUtils';
import styles from './ProductsReport.module.scss';

interface ProductsReportProps {
  onRegisterActions: (actions: { print: () => void; csv: () => void; pdf: () => void }) => void;
}

export default function ProductsReport({ onRegisterActions }: ProductsReportProps) {
  const data = productReportData;

  const handlePrint = () => {
    const rows = data.topProducts.map((p) => `<tr><td>${p.name}</td><td>${p.category}</td><td>${p.sold}</td><td>${formatCurrency(p.revenue)}</td><td>${p.stock}</td></tr>`).join('');
    printReport('Product Report', `
      <div class="stat-row">
        <div class="stat"><div class="stat-label">Inventory Value</div><div class="stat-value">${formatCurrency(data.inventoryValue)}</div></div>
        <div class="stat"><div class="stat-label">Total Products</div><div class="stat-value">${data.totalProducts}</div></div>
        <div class="stat"><div class="stat-label">Low Stock Items</div><div class="stat-value">${data.lowStock.length}</div></div>
      </div>
      <table><thead><tr><th>Product</th><th>Category</th><th>Sold</th><th>Revenue</th><th>Stock</th></tr></thead><tbody>${rows}</tbody></table>
    `);
  };

  const handleCSV = () => {
    downloadCSV('product-report.csv',
      ['Product', 'Category', 'Sold', 'Revenue', 'Stock'],
      data.topProducts.map((p) => [p.name, p.category, p.sold, p.revenue, p.stock]),
    );
  };

  React.useEffect(() => {
    onRegisterActions({ print: handlePrint, csv: handleCSV, pdf: handlePrint });
  }, []);

  const stockVariant = (stock: number): 'success' | 'warning' | 'error' => {
    if (stock > 20) return 'success';
    if (stock > 10) return 'warning';
    return 'error';
  };

  const topProductColumns = [
    { key: 'name', header: 'Product', render: (row: ProductReportData['topProducts'][0]) => (
      <div className={styles.productCell}>
        <div className={styles.productAvatar}>{row.name.charAt(0)}</div>
        <div className={styles.productInfo}>
          <span className={styles.productName}>{row.name}</span>
          <span className={styles.productCategory}>{row.category}</span>
        </div>
      </div>
    )},
    { key: 'sold', header: 'Units Sold', align: 'center' as const, render: (row: ProductReportData['topProducts'][0]) => <Badge variant="primary" size="sm">{row.sold.toLocaleString()}</Badge> },
    { key: 'revenue', header: 'Revenue', align: 'right' as const, render: (row: ProductReportData['topProducts'][0]) => <span className={styles.amount}>{formatCurrency(row.revenue)}</span> },
    { key: 'stock', header: 'Stock', align: 'center' as const, render: (row: ProductReportData['topProducts'][0]) => <Badge variant={stockVariant(row.stock)} size="sm">{row.stock}</Badge> },
  ];

  const lowStockColumns = [
    { key: 'name', header: 'Product', render: (row: ProductReportData['lowStock'][0]) => <span className={styles.productName}>{row.name}</span> },
    { key: 'category', header: 'Category', render: (row: ProductReportData['lowStock'][0]) => <Badge size="sm">{row.category}</Badge> },
    { key: 'stock', header: 'Stock', align: 'center' as const, render: (row: ProductReportData['lowStock'][0]) => <Badge variant="error" size="sm">{row.stock}</Badge> },
  ];

  return (
    <div className={styles.report}>
      <div className={styles.statsGrid}>
        <StatCard title="Inventory Value" value={formatCurrency(data.inventoryValue)} change={12.3} icon="Warehouse" iconColor="primary" />
        <StatCard title="Total Products" value={String(data.totalProducts)} change={5.0} icon="Package" iconColor="secondary" />
        <StatCard title="Low Stock Items" value={String(data.lowStock.length)} change={-8.5} icon="AlertTriangle" iconColor="warning" />
        <StatCard title="Categories" value={String(data.categoryPerformance.length)} icon="Layers" iconColor="info" />
      </div>

      <Card padding="none">
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Top Products</h3>
          <span className={styles.cardSubtitle}>By revenue</span>
        </div>
        <Table columns={topProductColumns} data={data.topProducts} keyExtractor={(row) => row.name} />
      </Card>

      <Card padding="none">
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Low Stock Alert</h3>
          <span className={styles.cardSubtitle}>Items needing restock</span>
        </div>
        <Table columns={lowStockColumns} data={data.lowStock} keyExtractor={(row) => row.name} />
      </Card>
    </div>
  );
}

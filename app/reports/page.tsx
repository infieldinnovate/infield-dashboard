'use client';

import React, { useState, useCallback, useRef } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import ReportToolbar from '../../components/ui/ReportToolbar';
import { ReportPeriod, ReportTabId } from '../../types';
import SalesReport from '../../features/reports/SalesReport';
import ProductsReport from '../../features/reports/ProductsReport';
import CustomersReport from '../../features/reports/CustomersReport';
import InventoryReport from '../../features/reports/InventoryReport';
import InvoicesReport from '../../features/reports/InvoicesReport';
import QuotationsReport from '../../features/reports/QuotationsReport';
import ReceiptsReport from '../../features/reports/ReceiptsReport';
import RevenueReport from '../../features/reports/RevenueReport';
import styles from './page.module.scss';

interface ReportActions {
  print: () => void;
  csv: () => void;
  pdf: () => void;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTabId>('sales');
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const actionsRef = useRef<ReportActions>({ print: () => {}, csv: () => {}, pdf: () => {} });

  const handleRegisterActions = useCallback((actions: ReportActions) => {
    actionsRef.current = actions;
  }, []);

  const tabs = [
    { id: 'sales' as ReportTabId, label: 'Sales', icon: 'Banknote', content: <SalesReport period={period} onRegisterActions={handleRegisterActions} /> },
    { id: 'products' as ReportTabId, label: 'Products', icon: 'Package', content: <ProductsReport onRegisterActions={handleRegisterActions} /> },
    { id: 'customers' as ReportTabId, label: 'Customers', icon: 'Users', content: <CustomersReport onRegisterActions={handleRegisterActions} /> },
    { id: 'inventory' as ReportTabId, label: 'Inventory', icon: 'Warehouse', content: <InventoryReport onRegisterActions={handleRegisterActions} /> },
    { id: 'invoices' as ReportTabId, label: 'Invoices', icon: 'FileSpreadsheet', content: <InvoicesReport period={period} onRegisterActions={handleRegisterActions} /> },
    { id: 'quotations' as ReportTabId, label: 'Quotations', icon: 'FileText', content: <QuotationsReport period={period} onRegisterActions={handleRegisterActions} /> },
    { id: 'receipts' as ReportTabId, label: 'Receipts', icon: 'Receipt', content: <ReceiptsReport period={period} onRegisterActions={handleRegisterActions} /> },
    { id: 'revenue' as ReportTabId, label: 'Revenue', icon: 'TrendingUp', content: <RevenueReport period={period} onRegisterActions={handleRegisterActions} /> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Reports"
        subtitle="Comprehensive business analytics and insights"
      />
      <ReportToolbar
        period={period}
        onPeriodChange={setPeriod}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onPrint={() => actionsRef.current.print()}
        onExportCSV={() => actionsRef.current.csv()}
        onExportPDF={() => actionsRef.current.pdf()}
      />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(tabId) => setActiveTab(tabId as ReportTabId)} />
    </div>
  );
}

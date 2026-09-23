import React from 'react';
import styles from './page.module.scss';
import StatCard from '../components/ui/StatCard';
import SalesSummary from '../features/dashboard/SalesSummary';
import MonthlyRevenue from '../features/dashboard/MonthlyRevenue';
import RecentTransactions from '../features/dashboard/RecentTransactions';
import RecentInvoices from '../features/dashboard/RecentInvoices';
import RecentQuotations from '../features/dashboard/RecentQuotations';
import RecentReceipts from '../features/dashboard/RecentReceipts';
import QuickActions from '../features/dashboard/QuickActions';
import LowStockProducts from '../features/dashboard/LowStockProducts';
import RecentActivity from '../features/dashboard/RecentActivity';
import { statCards } from '../data/dashboard';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <StatCard
            key={card.id}
            title={card.title}
            value={card.value}
            change={card.change}
            icon={card.icon}
          />
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <SalesSummary />
        <MonthlyRevenue />
      </div>

      <div className={styles.tablesGrid}>
        <RecentInvoices />
        <RecentQuotations />
        <RecentReceipts />
      </div>

      <RecentTransactions />

      <div className={styles.bottomGrid}>
        <RecentActivity />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <QuickActions />
          <LowStockProducts />
        </div>
      </div>
    </div>
  );
}

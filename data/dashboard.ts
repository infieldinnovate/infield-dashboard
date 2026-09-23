import { StatCard, RecentTransaction } from '../types';

export const statCards: StatCard[] = [
  {
    id: '1',
    title: 'Total Sales',
    value: 'KSh 1,384,200',
    change: 18.5,
    icon: 'Banknote',
  },
  {
    id: '2',
    title: 'Active Quotations',
    value: '12',
    change: 3.0,
    icon: 'FileText',
  },
  {
    id: '3',
    title: 'Projects Completed',
    value: '8',
    change: 14.2,
    icon: 'CheckCircle2',
  },
  {
    id: '4',
    title: 'Customers',
    value: '48',
    change: 7.3,
    icon: 'Users',
  },
];

export const recentTransactions: RecentTransaction[] = [
  {
    id: 'TXN-001',
    customer: 'Meru Teachers Sacco',
    amount: 549840,
    status: 'completed',
    date: '2026-07-15 14:32',
    items: 2,
  },
  {
    id: 'TXN-002',
    customer: 'Tigania Farmers Cooperative',
    amount: 200000,
    status: 'completed',
    date: '2026-07-10 13:15',
    items: 3,
  },
  {
    id: 'TXN-003',
    customer: 'Grace Wanja',
    amount: 30000,
    status: 'pending',
    date: '2026-07-01 12:48',
    items: 1,
  },
  {
    id: 'TXN-004',
    customer: 'Ruiri Rural Electrification CBO',
    amount: 309720,
    status: 'completed',
    date: '2026-07-18 11:20',
    items: 3,
  },
  {
    id: 'TXN-005',
    customer: 'John Mwenda',
    amount: 45000,
    status: 'completed',
    date: '2026-07-14 10:55',
    items: 3,
  },
  {
    id: 'TXN-006',
    customer: 'Tigania Farmers Cooperative',
    amount: 100000,
    status: 'completed',
    date: '2026-07-22 09:40',
    items: 2,
  },
];

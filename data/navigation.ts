import { NavItem } from '../types';

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { id: 'pos', label: 'Point of Sale', href: '/pos', icon: 'ShoppingCart' },
  { id: 'products', label: 'Products & Materials', href: '/products', icon: 'Package' },
  { id: 'customers', label: 'Customers', href: '/customers', icon: 'Users' },
  { id: 'suppliers', label: 'Suppliers', href: '/suppliers', icon: 'Truck' },
  { id: 'templates', label: 'Quote Templates', href: '/quote-templates', icon: 'LayoutTemplate' },
  { id: 'quotations', label: 'Quotations', href: '/quotations', icon: 'FileText' },
  { id: 'invoices', label: 'Invoices', href: '/invoices', icon: 'FileSpreadsheet' },
  { id: 'receipts', label: 'Receipts', href: '/receipts', icon: 'Receipt' },
  { id: 'delivery', label: 'Delivery Notes', href: '/delivery-notes', icon: 'PackageCheck' },
  { id: 'inbox', label: 'Inbox', href: '/inbox', icon: 'Inbox' },
  { id: 'users', label: 'Users', href: '/users', icon: 'UserCog' },
  { id: 'leads', label: 'Lead Portfolios', href: '/leads', icon: 'UserPlus' },
  { id: 'reports', label: 'Reports', href: '/reports', icon: 'BarChart3' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
];

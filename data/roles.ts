import { Role, ActivityLog } from '../types';

export const roles: Role[] = [
  {
    id: 'role-admin',
    name: 'Administrator',
    description: 'Full access to all modules, settings, and user management',
    members: 1,
    color: 'primary',
    permissions: ['all'],
  },
  {
    id: 'role-manager',
    name: 'Manager',
    description: 'Manage sales, inventory, reports, and customer relations',
    members: 1,
    color: 'secondary',
    permissions: [
      'sales.view',
      'sales.manage',
      'inventory.view',
      'inventory.manage',
      'reports.view',
      'customers.view',
      'customers.manage',
      'quotations.view',
      'quotations.manage',
      'invoices.view',
      'invoices.manage',
    ],
  },
  {
    id: 'role-sales',
    name: 'Sales Representative',
    description: 'Handle quotations, customer orders, and customer accounts',
    members: 1,
    color: 'info',
    permissions: [
      'sales.view',
      'quotations.view',
      'quotations.manage',
      'customers.view',
      'customers.manage',
      'invoices.view',
    ],
  },
  {
    id: 'role-cashier',
    name: 'Cashier',
    description: 'Process point-of-sale transactions and issue receipts',
    members: 2,
    color: 'success',
    permissions: [
      'pos.access',
      'receipts.view',
      'receipts.manage',
    ],
  },
];

export interface PermissionGroup {
  module: string;
  icon: string;
  permissions: { id: string; label: string; description: string }[];
}

export const permissionGroups: PermissionGroup[] = [
  {
    module: 'Dashboard',
    icon: 'LayoutDashboard',
    permissions: [
      { id: 'dashboard.view', label: 'View Dashboard', description: 'Access the main dashboard and stats' },
    ],
  },
  {
    module: 'Point of Sale',
    icon: 'ShoppingCart',
    permissions: [
      { id: 'pos.access', label: 'Use POS', description: 'Process sales transactions at the counter' },
      { id: 'pos.refund', label: 'Process Refunds', description: 'Issue refunds and void transactions' },
    ],
  },
  {
    module: 'Products',
    icon: 'Package',
    permissions: [
      { id: 'products.view', label: 'View Products', description: 'See product catalog and details' },
      { id: 'products.manage', label: 'Manage Products', description: 'Add, edit, and delete products' },
    ],
  },
  {
    module: 'Inventory',
    icon: 'Boxes',
    permissions: [
      { id: 'inventory.view', label: 'View Inventory', description: 'See stock levels and movements' },
      { id: 'inventory.manage', label: 'Manage Inventory', description: 'Adjust stock and create purchase orders' },
    ],
  },
  {
    module: 'Customers',
    icon: 'Users',
    permissions: [
      { id: 'customers.view', label: 'View Customers', description: 'See customer list and profiles' },
      { id: 'customers.manage', label: 'Manage Customers', description: 'Add, edit, and delete customers' },
    ],
  },
  {
    module: 'Sales & Documents',
    icon: 'FileText',
    permissions: [
      { id: 'sales.view', label: 'View Sales', description: 'See sales records and analytics' },
      { id: 'sales.manage', label: 'Manage Sales', description: 'Create and edit sales records' },
      { id: 'quotations.view', label: 'View Quotations', description: 'See all quotations' },
      { id: 'quotations.manage', label: 'Manage Quotations', description: 'Create, edit, and send quotations' },
      { id: 'invoices.view', label: 'View Invoices', description: 'See all invoices' },
      { id: 'invoices.manage', label: 'Manage Invoices', description: 'Create, edit, and send invoices' },
      { id: 'receipts.view', label: 'View Receipts', description: 'See all receipts' },
      { id: 'receipts.manage', label: 'Manage Receipts', description: 'Create and edit receipts' },
    ],
  },
  {
    module: 'Reports',
    icon: 'BarChart3',
    permissions: [
      { id: 'reports.view', label: 'View Reports', description: 'Access sales and inventory reports' },
      { id: 'reports.export', label: 'Export Reports', description: 'Download reports as PDF or CSV' },
    ],
  },
  {
    module: 'Settings',
    icon: 'Settings',
    permissions: [
      { id: 'settings.view', label: 'View Settings', description: 'See application settings' },
      { id: 'settings.manage', label: 'Manage Settings', description: 'Edit business, tax, and system settings' },
      { id: 'users.manage', label: 'Manage Users', description: 'Add, edit, and remove users and roles' },
    ],
  },
];

export const activityLogs: ActivityLog[] = [
  {
    id: 'log-001',
    userId: 'usr-001',
    userName: 'Alex Morgan',
    action: 'Logged in',
    category: 'auth',
    detail: 'Signed in from Chrome on macOS',
    timestamp: '2026-07-28 08:30:12',
    ip: '192.168.1.10',
  },
  {
    id: 'log-002',
    userId: 'usr-002',
    userName: 'Sarah Chen',
    action: 'Updated product',
    category: 'inventory',
    detail: 'Changed price of "Organic Coffee Beans" from $13.99 to $14.99',
    timestamp: '2026-07-28 09:22:45',
    ip: '192.168.1.24',
  },
  {
    id: 'log-003',
    userId: 'usr-004',
    userName: 'Priya Sharma',
    action: 'Created quotation',
    category: 'documents',
    detail: 'Created quotation QT-005 for Hassan Al-Fayed ($332.54)',
    timestamp: '2026-07-28 10:05:30',
    ip: '192.168.1.31',
  },
  {
    id: 'log-004',
    userId: 'usr-003',
    userName: 'Marcus Johnson',
    action: 'Completed sale',
    category: 'sales',
    detail: 'POS transaction #8472 - $54.94 (cash)',
    timestamp: '2026-07-27 18:45:00',
    ip: '192.168.1.18',
  },
  {
    id: 'log-005',
    userId: 'usr-001',
    userName: 'Alex Morgan',
    action: 'Changed settings',
    category: 'settings',
    detail: 'Updated tax rate from 8% to 10%',
    timestamp: '2026-07-27 16:12:18',
    ip: '192.168.1.10',
  },
  {
    id: 'log-006',
    userId: 'usr-002',
    userName: 'Sarah Chen',
    action: 'Added customer',
    category: 'customers',
    detail: 'Created new customer profile for "Fresh Foods Inc"',
    timestamp: '2026-07-26 14:30:00',
    ip: '192.168.1.24',
  },
  {
    id: 'log-007',
    userId: 'usr-004',
    userName: 'Priya Sharma',
    action: 'Sent invoice',
    category: 'documents',
    detail: 'Emailed invoice INV-2026-0006 to Acme Corporation',
    timestamp: '2026-07-26 11:15:22',
    ip: '192.168.1.31',
  },
  {
    id: 'log-008',
    userId: 'usr-003',
    userName: 'Marcus Johnson',
    action: 'Issued receipt',
    category: 'documents',
    detail: 'Cash receipt RCP-2026-0006 for Elena Rossi ($54.94)',
    timestamp: '2026-07-01 12:00:00',
    ip: '192.168.1.18',
  },
  {
    id: 'log-009',
    userId: 'usr-001',
    userName: 'Alex Morgan',
    action: 'Updated user role',
    category: 'settings',
    detail: 'Changed Priya Sharma from "cashier" to "sales" role',
    timestamp: '2026-06-15 10:00:00',
    ip: '192.168.1.10',
  },
  {
    id: 'log-010',
    userId: 'usr-005',
    userName: 'Tom Bradley',
    action: 'Logged in',
    category: 'auth',
    detail: 'Failed login attempt - incorrect password',
    timestamp: '2026-05-15 14:20:00',
    ip: '192.168.1.45',
  },
];

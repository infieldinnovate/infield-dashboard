export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  sku: string;
  cost: number;
  description: string;
  unit: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  tax: number;
  subtotal: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  paymentMethod: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

export interface StatCard {
  id: string;
  title: string;
  value: string;
  change: number;
  icon: string;
}

export interface RecentTransaction {
  id: string;
  customer: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  items: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  creditLimit: number;
  balance: number;
  status: 'active' | 'inactive';
  createdAt: string;
  type: 'individual' | 'business';
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  paymentTerms: string;
  leadTime: number;
  status: 'active' | 'inactive';
  rating: number;
  categories: string[];
}

export interface Quotation {
  id: string;
  customerId: string;
  customerName: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  taxRate: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  createdAt: string;
  notes: string;
}

export interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  items: QuotationItem[];
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  notes: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  taxRate: number;
  total: number;
  paid: number;
  balance: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Receipt {
  id: string;
  invoiceId: string;
  receiptNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check' | 'mobile_money';
  date: string;
  reference: string;
  notes: string;
}

export interface DeliveryNote {
  id: string;
  invoiceId: string;
  deliveryNumber: string;
  customerName: string;
  customerAddress: string;
  recipient: string;
  recipientPhone: string;
  items: DeliveryItem[];
  status: 'pending' | 'shipped' | 'delivered' | 'returned';
  shipDate: string;
  deliveryDate?: string;
  carrier: string;
  trackingNumber: string;
  notes: string;
}

export interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  quantityDelivered: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'sales';
  avatar?: string;
  phone: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
  icon: string;
}

export interface BusinessInfo {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
}

export interface DocumentNumbering {
  quotationPrefix: string;
  quotationNextNumber: number;
  invoicePrefix: string;
  invoiceNextNumber: number;
  receiptPrefix: string;
  receiptNextNumber: number;
  deliveryPrefix: string;
  deliveryNextNumber: number;
}

export interface TaxSettings {
  taxRate: number;
  taxId: string;
  taxInclusive: boolean;
}

export interface CurrencySettings {
  currency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
}

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'blue' | 'teal' | 'green' | 'amber' | 'rose' | 'violet';

export interface ThemeSettings {
  mode: ThemeMode;
  color: ThemeColor;
  fontSize: 'small' | 'medium' | 'large';
}

export interface PrintSettings {
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  showLogo: boolean;
  showBusinessInfo: boolean;
  showTaxId: boolean;
  footerText: string;
  accentColor: boolean;
}

export interface AppSettings {
  business: BusinessInfo;
  numbering: DocumentNumbering;
  tax: TaxSettings;
  currency: CurrencySettings;
  theme: ThemeSettings;
  print: PrintSettings;
}

/* ---------- Inbox ---------- */

export type InboxPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface QuotationRequest {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  estimatedValue: number;
  items: string;
  status: 'new' | 'in_review' | 'quoted' | 'closed';
  priority: InboxPriority;
  createdAt: string;
}

export interface CallRequest {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  reason: string;
  preferredTime: string;
  status: 'pending' | 'scheduled' | 'completed' | 'missed';
  priority: InboxPriority;
  createdAt: string;
}

export interface Review {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'published' | 'pending' | 'flagged';
  createdAt: string;
}

export interface Subscription {
  id: string;
  customerName: string;
  email: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'trialing' | 'cancelled' | 'expired';
  startDate: string;
  renewalDate: string;
  amount: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  audience: 'all' | 'staff' | 'customers';
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publishedAt: string;
  pinned: boolean;
}

/* ---------- Users: roles, permissions, activity ---------- */

export interface Role {
  id: string;
  name: string;
  description: string;
  members: number;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  permissions: string[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  category: 'auth' | 'sales' | 'inventory' | 'customers' | 'settings' | 'documents';
  detail: string;
  timestamp: string;
  ip: string;
}

/* ---------- Reports ---------- */

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ReportDateFilter {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
}

export interface TimeSeriesPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface CategoryBreakdown {
  category: string;
  value: number;
  count: number;
}

export interface SalesReportData {
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  salesGrowth: number;
  timeSeries: TimeSeriesPoint[];
  byPaymentMethod: CategoryBreakdown[];
  topCustomers: { name: string; totalSpent: number; orders: number }[];
}

export interface ProductReportData {
  topProducts: { name: string; category: string; sold: number; revenue: number; stock: number }[];
  categoryPerformance: CategoryBreakdown[];
  lowStock: { name: string; stock: number; category: string }[];
  inventoryValue: number;
  totalProducts: number;
}

export interface CustomerReportData {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  averageBalance: number;
  topSpenders: { name: string; totalSpent: number; orders: number; type: string }[];
  byType: CategoryBreakdown[];
  outstandingBalances: { name: string; balance: number; creditLimit: number }[];
}

export interface InventoryReportData {
  totalStockValue: number;
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  byCategory: { category: string; items: number; value: number; stock: number }[];
  stockLevels: { name: string; category: string; stock: number; value: number; status: 'in_stock' | 'low' | 'out' }[];
}

export interface InvoiceReportData {
  totalInvoiced: number;
  totalCollected: number;
  outstandingAmount: number;
  overdueAmount: number;
  byStatus: CategoryBreakdown[];
  timeSeries: TimeSeriesPoint[];
  recentInvoices: { number: string; customer: string; amount: number; status: string; date: string }[];
}

export interface QuotationReportData {
  totalQuotations: number;
  acceptedCount: number;
  acceptanceRate: number;
  totalQuotedValue: number;
  acceptedValue: number;
  byStatus: CategoryBreakdown[];
  timeSeries: TimeSeriesPoint[];
  recentQuotations: { id: string; customer: string; amount: number; status: string; date: string }[];
}

export interface ReceiptReportData {
  totalCollected: number;
  receiptCount: number;
  averageReceipt: number;
  byPaymentMethod: CategoryBreakdown[];
  timeSeries: TimeSeriesPoint[];
  recentReceipts: { number: string; customer: string; amount: number; method: string; date: string }[];
}

export interface RevenueReportData {
  totalRevenue: number;
  revenueGrowth: number;
  grossProfit: number;
  profitMargin: number;
  timeSeries: TimeSeriesPoint[];
  byCategory: CategoryBreakdown[];
  monthlyComparison: { month: string; revenue: number; profit: number }[];
}

export type ReportTabId =
  | 'sales'
  | 'products'
  | 'customers'
  | 'inventory'
  | 'invoices'
  | 'quotations'
  | 'receipts'
  | 'revenue';

/* ---------- Leads (Client Portfolios) ---------- */

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'quoted' | 'won' | 'lost';
export type LeadService = 'Solar' | 'Electrical' | 'Boreholes' | 'Irrigation' | 'Plumbing' | 'Other';

export interface Lead {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  location: string;
  interested_service: string;
  lead_source: string;
  status: LeadStatus;
  last_contact_date: string | null;
  follow_up_date: string | null;
  notes: string;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

import type {
  SalesReportData,
  ProductReportData,
  CustomerReportData,
  InventoryReportData,
  InvoiceReportData,
  QuotationReportData,
  ReceiptReportData,
  RevenueReportData,
  TimeSeriesPoint,
  ReportPeriod,
} from '../types';
import { products } from './products';
import { customers } from './customers';
import { invoices } from './invoices';
import { quotations } from './quotations';
import { receipts } from './receipts';

export const reportPeriodOptions: { value: ReportPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const dailyTimeSeries: TimeSeriesPoint[] = [
  { label: 'Mon', value: 42000, secondary: 28000 },
  { label: 'Tue', value: 38000, secondary: 25000 },
  { label: 'Wed', value: 51000, secondary: 34000 },
  { label: 'Thu', value: 47000, secondary: 31000 },
  { label: 'Fri', value: 62000, secondary: 41000 },
  { label: 'Sat', value: 75000, secondary: 50000 },
  { label: 'Sun', value: 58000, secondary: 39000 },
];

const weeklyTimeSeries: TimeSeriesPoint[] = [
  { label: 'Week 1', value: 285000, secondary: 190000 },
  { label: 'Week 2', value: 320000, secondary: 215000 },
  { label: 'Week 3', value: 295000, secondary: 198000 },
  { label: 'Week 4', value: 410000, secondary: 275000 },
];

const monthlyTimeSeries: TimeSeriesPoint[] = [
  { label: 'Jan', value: 420000, secondary: 280000 },
  { label: 'Feb', value: 380000, secondary: 255000 },
  { label: 'Mar', value: 510000, secondary: 340000 },
  { label: 'Apr', value: 470000, secondary: 315000 },
  { label: 'May', value: 620000, secondary: 415000 },
  { label: 'Jun', value: 580000, secondary: 390000 },
  { label: 'Jul', value: 695000, secondary: 465000 },
  { label: 'Aug', value: 720000, secondary: 482000 },
  { label: 'Sep', value: 640000, secondary: 430000 },
];

const yearlyTimeSeries: TimeSeriesPoint[] = [
  { label: '2022', value: 4200000, secondary: 2800000 },
  { label: '2023', value: 5100000, secondary: 3400000 },
  { label: '2024', value: 6300000, secondary: 4200000 },
  { label: '2025', value: 7800000, secondary: 5200000 },
  { label: '2026', value: 9200000, secondary: 6150000 },
];

export function getTimeSeries(period: ReportPeriod): TimeSeriesPoint[] {
  switch (period) {
    case 'daily': return dailyTimeSeries;
    case 'weekly': return weeklyTimeSeries;
    case 'monthly': return monthlyTimeSeries;
    case 'yearly': return yearlyTimeSeries;
  }
}

export const salesReportData: SalesReportData = {
  totalSales: 1384200,
  totalTransactions: 6,
  averageOrderValue: 230700,
  salesGrowth: 18.5,
  timeSeries: monthlyTimeSeries,
  byPaymentMethod: [
    { category: 'Bank Transfer', value: 859560, count: 2 },
    { category: 'Mobile Money', value: 345000, count: 3 },
    { category: 'Cash', value: 30000, count: 1 },
  ],
  topCustomers: [
    { name: 'Meru Teachers Sacco', totalSpent: 549840, orders: 1 },
    { name: 'Ruiri Rural Electrification CBO', totalSpent: 309720, orders: 1 },
    { name: 'Tigania Farmers Cooperative', totalSpent: 300000, orders: 2 },
    { name: 'John Mwenda', totalSpent: 45000, orders: 1 },
    { name: 'Grace Wanja', totalSpent: 30000, orders: 1 },
  ],
};

export const productReportData: ProductReportData = {
  topProducts: [
    { name: 'Monocrystalline Solar Panel 400W', category: 'Solar Solutions', sold: 20, revenue: 370000, stock: 60 },
    { name: 'Solar Inverter 5KVA Pure Sine Wave', category: 'Solar Solutions', sold: 2, revenue: 104000, stock: 18 },
    { name: 'Drip Irrigation Tape 16mm (per metre)', category: 'Irrigation Systems', sold: 5000, revenue: 225000, stock: 2000 },
    { name: '2.5mm² Electrical Cable (per metre)', category: 'Electrical Installations', sold: 1500, revenue: 180000, stock: 800 },
    { name: 'PVC Irrigation Pipe 50mm (per metre)', category: 'Irrigation Systems', sold: 300, revenue: 84000, stock: 500 },
  ],
  categoryPerformance: [
    { category: 'Solar Solutions', value: 474000, count: 22 },
    { category: 'Electrical Installations', value: 277000, count: 1555 },
    { category: 'Irrigation Systems', value: 326000, count: 5302 },
    { category: 'Plumbing Services', value: 56500, count: 203 },
    { category: 'Borehole Solutions', value: 78700, count: 122 },
  ],
  lowStock: products
    .filter((p) => p.stock <= 15)
    .map((p) => ({ name: p.name, stock: p.stock, category: p.category }))
    .slice(0, 5),
  inventoryValue: products.reduce((sum, p) => sum + p.cost * p.stock, 0),
  totalProducts: products.length,
};

export const customerReportData: CustomerReportData = {
  totalCustomers: customers.length,
  activeCustomers: customers.filter((c) => c.status === 'active').length,
  newCustomers: 3,
  averageBalance: customers.reduce((sum, c) => sum + c.balance, 0) / customers.length,
  topSpenders: [
    { name: 'Meru Teachers Sacco', totalSpent: 549840, orders: 1, type: 'business' },
    { name: 'Ruiri Rural Electrification CBO', totalSpent: 309720, orders: 1, type: 'business' },
    { name: 'Tigania Farmers Cooperative', totalSpent: 300000, orders: 2, type: 'business' },
    { name: 'John Mwenda', totalSpent: 45000, orders: 1, type: 'individual' },
    { name: 'Grace Wanja', totalSpent: 30000, orders: 1, type: 'individual' },
  ],
  byType: [
    { category: 'Business', value: customers.filter((c) => c.type === 'business').length, count: 5 },
    { category: 'Individual', value: customers.filter((c) => c.type === 'individual').length, count: 3 },
  ],
  outstandingBalances: customers
    .filter((c) => c.balance > 0)
    .map((c) => ({ name: c.name, balance: c.balance, creditLimit: c.creditLimit }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5),
};

export const inventoryReportData: InventoryReportData = {
  totalStockValue: products.reduce((sum, p) => sum + p.cost * p.stock, 0),
  totalItems: products.length,
  lowStockCount: products.filter((p) => p.stock > 0 && p.stock <= 15).length,
  outOfStockCount: products.filter((p) => p.stock === 0).length,
  byCategory: products.reduce((acc, p) => {
    const existing = acc.find((a) => a.category === p.category);
    if (existing) {
      existing.items += 1;
      existing.value += p.cost * p.stock;
      existing.stock += p.stock;
    } else {
      acc.push({ category: p.category, items: 1, value: p.cost * p.stock, stock: p.stock });
    }
    return acc;
  }, [] as { category: string; items: number; value: number; stock: number }[]),
  stockLevels: products.map((p) => ({
    name: p.name,
    category: p.category,
    stock: p.stock,
    value: p.cost * p.stock,
    status: p.stock === 0 ? 'out' as const : p.stock <= 15 ? 'low' as const : 'in_stock' as const,
  })),
};

export const invoiceReportData: InvoiceReportData = {
  totalInvoiced: invoices.reduce((sum, inv) => sum + inv.total, 0),
  totalCollected: invoices.reduce((sum, inv) => sum + inv.paid, 0),
  outstandingAmount: invoices.reduce((sum, inv) => sum + inv.balance, 0),
  overdueAmount: invoices.filter((inv) => inv.status === 'overdue').reduce((sum, inv) => sum + inv.balance, 0),
  byStatus: [
    { category: 'Paid', value: invoices.filter((i) => i.status === 'paid').length, count: 2 },
    { category: 'Unpaid', value: invoices.filter((i) => i.status === 'unpaid').length, count: 2 },
    { category: 'Partial', value: invoices.filter((i) => i.status === 'partial').length, count: 1 },
    { category: 'Overdue', value: invoices.filter((i) => i.status === 'overdue').length, count: 1 },
  ],
  timeSeries: monthlyTimeSeries,
  recentInvoices: invoices.map((inv) => ({
    number: inv.invoiceNumber,
    customer: inv.customerName,
    amount: inv.total,
    status: inv.status,
    date: inv.issueDate,
  })),
};

export const quotationReportData: QuotationReportData = {
  totalQuotations: quotations.length,
  acceptedCount: quotations.filter((q) => q.status === 'accepted').length,
  acceptanceRate: (quotations.filter((q) => q.status === 'accepted').length / quotations.length) * 100,
  totalQuotedValue: quotations.reduce((sum, q) => sum + q.total, 0),
  acceptedValue: quotations.filter((q) => q.status === 'accepted').reduce((sum, q) => sum + q.total, 0),
  byStatus: [
    { category: 'Accepted', value: quotations.filter((q) => q.status === 'accepted').length, count: 1 },
    { category: 'Sent', value: quotations.filter((q) => q.status === 'sent').length, count: 1 },
    { category: 'Draft', value: quotations.filter((q) => q.status === 'draft').length, count: 1 },
    { category: 'Rejected', value: quotations.filter((q) => q.status === 'rejected').length, count: 1 },
    { category: 'Expired', value: quotations.filter((q) => q.status === 'expired').length, count: 1 },
  ],
  timeSeries: monthlyTimeSeries,
  recentQuotations: quotations.map((q) => ({
    id: q.id.toUpperCase(),
    customer: q.customerName,
    amount: q.total,
    status: q.status,
    date: q.createdAt,
  })),
};

export const receiptReportData: ReceiptReportData = {
  totalCollected: receipts.reduce((sum, r) => sum + r.amount, 0),
  receiptCount: receipts.length,
  averageReceipt: receipts.reduce((sum, r) => sum + r.amount, 0) / receipts.length,
  byPaymentMethod: [
    { category: 'Bank Transfer', value: receipts.filter((r) => r.paymentMethod === 'bank_transfer').reduce((s, r) => s + r.amount, 0), count: 2 },
    { category: 'Mobile Money', value: receipts.filter((r) => r.paymentMethod === 'mobile_money').reduce((s, r) => s + r.amount, 0), count: 3 },
    { category: 'Cash', value: receipts.filter((r) => r.paymentMethod === 'cash').reduce((s, r) => s + r.amount, 0), count: 1 },
  ],
  timeSeries: monthlyTimeSeries,
  recentReceipts: receipts.map((r) => ({
    number: r.receiptNumber,
    customer: r.customerName,
    amount: r.amount,
    method: r.paymentMethod,
    date: r.date,
  })),
};

export const revenueReportData: RevenueReportData = {
  totalRevenue: 9200000,
  revenueGrowth: 17.9,
  grossProfit: 6150000,
  profitMargin: 66.8,
  timeSeries: yearlyTimeSeries,
  byCategory: [
    { category: 'Solar Solutions', value: 2800000, count: 120 },
    { category: 'Electrical Installations', value: 1900000, count: 340 },
    { category: 'Irrigation Systems', value: 2200000, count: 280 },
    { category: 'Plumbing Services', value: 1100000, count: 180 },
    { category: 'Borehole Solutions', value: 1200000, count: 90 },
  ],
  monthlyComparison: [
    { month: 'Jan', revenue: 420000, profit: 280000 },
    { month: 'Feb', revenue: 380000, profit: 255000 },
    { month: 'Mar', revenue: 510000, profit: 340000 },
    { month: 'Apr', revenue: 470000, profit: 315000 },
    { month: 'May', revenue: 620000, profit: 415000 },
    { month: 'Jun', revenue: 580000, profit: 390000 },
    { month: 'Jul', revenue: 695000, profit: 465000 },
    { month: 'Aug', revenue: 720000, profit: 482000 },
    { month: 'Sep', revenue: 640000, profit: 430000 },
  ],
};

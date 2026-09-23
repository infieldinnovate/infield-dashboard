'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import RowActions from '../../components/ui/RowActions';
import { invoices as initialInvoices } from '../../data/invoices';
import { customers } from '../../data/customers';
import { products } from '../../data/products';
import { Invoice, InvoiceItem } from '../../types';
import { DocumentEngine, toDocumentConfig, printDocumentA4, downloadDocumentPDF, formatCurrency } from '../../components/DocumentEngine';
import { toast } from 'sonner';

const statusVariant: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'secondary'> = {
  paid: 'success',
  unpaid: 'warning',
  partial: 'primary',
  overdue: 'error',
};

const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));
const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

interface FormState {
  customerId: string;
  items: InvoiceItem[];
  discount: string;
  discountType: 'percentage' | 'fixed';
  taxRate: string;
  issueDate: string;
  dueDate: string;
  notes: string;
}

const emptyForm: FormState = {
  customerId: '',
  items: [],
  discount: '0',
  discountType: 'percentage',
  taxRate: '10',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  notes: '',
};

function calcTotals(items: InvoiceItem[], discount: number, discountType: 'percentage' | 'fixed', taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + tax;
  return { subtotal, discountAmount, tax, total };
}

function generateInvoiceNumber(existingInvoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const numbers = existingInvoices
    .map((inv) => inv.invoiceNumber)
    .filter((num) => num.includes(`INV-${year}`))
    .map((num) => parseInt(num.split('-').pop() || '0', 10))
    .filter((n) => !isNaN(n));
  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `INV-${year}-${String(nextNum).padStart(4, '0')}`;
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [invoiceList, setInvoiceList] = useState<Invoice[]>(initialInvoices);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [paymentModal, setPaymentModal] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const filtered = useMemo(() => {
    let data = [...invoiceList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (inv) =>
          inv.id.toLowerCase().includes(q) ||
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      data = data.filter((inv) => inv.status === statusFilter);
    }
    return data.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [invoiceList, search, statusFilter]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const openCreate = () => {
    setEditInvoice(null);
    setForm({
      ...emptyForm,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });
    setIsFormOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    const discountPercent = inv.discountType === 'percentage' ? inv.discount : 0;
    const discountFixed = inv.discountType === 'fixed' ? inv.discount : 0;
    setForm({
      customerId: inv.customerId,
      items: inv.items.map((i) => ({ ...i })),
      discount: inv.discountType === 'percentage' ? String(discountPercent) : String(discountFixed),
      discountType: inv.discountType || 'percentage',
      taxRate: String(inv.taxRate || 10),
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      notes: inv.notes,
    });
    setIsFormOpen(true);
  };

  const duplicateInvoice = (inv: Invoice) => {
    const newInvoice: Invoice = {
      ...inv,
      id: `inv-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(invoiceList),
      status: 'unpaid',
      paid: 0,
      balance: inv.total,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paidDate: undefined,
    };
    setInvoiceList((prev) => [newInvoice, ...prev]);
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', productName: '', description: '', quantity: 1, unitPrice: 0, total: 0 }],
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      const item = { ...items[index] };
      if (field === 'productId') {
        const product = products.find((p) => p.id === value);
        item.productId = value as string;
        item.productName = product?.name || '';
        item.unitPrice = product?.price || 0;
      } else {
        (item as Record<keyof InvoiceItem, unknown>)[field] = value;
      }
      item.total = item.quantity * item.unitPrice;
      items[index] = item;
      return { ...prev, items };
    });
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const totals = useMemo(() => {
    return calcTotals(form.items, parseFloat(form.discount) || 0, form.discountType, parseFloat(form.taxRate) || 0);
  }, [form]);

  const handleSave = () => {
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer || form.items.length === 0) return;

    const invData: Invoice = {
      id: editInvoice?.id || `inv-${Date.now()}`,
      customerId: form.customerId,
      customerName: customer.name,
      invoiceNumber: editInvoice?.invoiceNumber || generateInvoiceNumber(invoiceList),
      items: form.items,
      subtotal: totals.subtotal,
      discount: parseFloat(form.discount) || 0,
      discountType: form.discountType,
      tax: totals.tax,
      taxRate: parseFloat(form.taxRate) || 0,
      total: totals.total,
      paid: editInvoice?.paid || 0,
      balance: totals.total - (editInvoice?.paid || 0),
      status: editInvoice?.status || 'unpaid',
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      paidDate: editInvoice?.paidDate,
      notes: form.notes,
    };

    if (editInvoice) {
      setInvoiceList((prev) => prev.map((inv) => (inv.id === editInvoice.id ? invData : inv)));
    } else {
      setInvoiceList((prev) => [invData, ...prev]);
    }
    setIsFormOpen(false);
    setForm(emptyForm);
    setEditInvoice(null);
    toast.success(editInvoice ? 'Invoice updated successfully' : 'Invoice created successfully');
  };

  const handleDeleteConfirm = () => {
    if (deleteInvoice) {
      setInvoiceList((prev) => prev.filter((inv) => inv.id !== deleteInvoice.id));
      setDeleteInvoice(null);
      toast.success('Invoice deleted successfully');
    }
  };

  const openPaymentModal = (inv: Invoice) => {
    setPaymentModal(inv);
    setPaymentAmount(String(inv.balance));
  };

  const handlePayment = () => {
    if (!paymentModal) return;
    const amount = parseFloat(paymentAmount) || 0;
    const newPaid = paymentModal.paid + amount;
    const newBalance = paymentModal.total - newPaid;
    const newStatus = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    setInvoiceList((prev) =>
      prev.map((inv) =>
        inv.id === paymentModal.id
          ? {
              ...inv,
              paid: newPaid,
              balance: Math.max(0, newBalance),
              status: newStatus,
              paidDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : inv.paidDate,
            }
          : inv
      )
    );
    setPaymentModal(null);
    setPaymentAmount('');
  };

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (row: Invoice) => <span className={styles.invId}>{row.invoiceNumber}</span>,
    },
    { key: 'customerName', header: 'Customer', render: (row: Invoice) => <span className={styles.customerName}>{row.customerName}</span> },
    { key: 'issueDate', header: 'Issue Date', render: (row: Invoice) => <span className={styles.date}>{row.issueDate}</span> },
    { key: 'dueDate', header: 'Due Date', render: (row: Invoice) => <span className={styles.date}>{row.dueDate}</span> },
    {
      key: 'total',
      header: 'Amount',
      align: 'right' as const,
      render: (row: Invoice) => <span className={styles.amount}>${row.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right' as const,
      render: (row: Invoice) => (
        <span className={`${styles.amount} ${row.balance > 0 ? styles.balanceDue : styles.balancePaid}`}>
          ${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center' as const,
      render: (row: Invoice) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (row: Invoice) => {
        const actions: { icon: string; label: string; onClick: (e: React.MouseEvent) => void; variant?: 'danger' }[] = [
          { icon: 'Eye', label: 'Preview', onClick: (e: React.MouseEvent) => { e.stopPropagation(); setPreviewInvoice(row); } },
          { icon: 'Printer', label: 'Print', onClick: (e: React.MouseEvent) => { e.stopPropagation(); printDocumentA4(toDocumentConfig(row)); } },
          { icon: 'Download', label: 'Download PDF', onClick: (e: React.MouseEvent) => { e.stopPropagation(); downloadDocumentPDF(toDocumentConfig(row)); } },
          { icon: 'Pencil', label: 'Edit', onClick: (e: React.MouseEvent) => { e.stopPropagation(); openEdit(row); } },
          { icon: 'Copy', label: 'Duplicate', onClick: (e: React.MouseEvent) => { e.stopPropagation(); duplicateInvoice(row); } },
        ];
        if (row.balance > 0) {
          actions.push({ icon: 'CreditCard', label: 'Record Payment', onClick: (e: React.MouseEvent) => { e.stopPropagation(); openPaymentModal(row); } });
        }
        actions.push({ icon: 'Trash2', label: 'Delete', variant: 'danger' as const, onClick: (e: React.MouseEvent) => { e.stopPropagation(); setDeleteInvoice(row); } });
        return <RowActions actions={actions} />;
      },
    },
  ];

  const statusFilterOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partial', label: 'Partial' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const summaryStats = useMemo(() => {
    const totalAmount = invoiceList.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoiceList.reduce((sum, inv) => sum + inv.paid, 0);
    const totalBalance = invoiceList.reduce((sum, inv) => sum + inv.balance, 0);
    const paidCount = invoiceList.filter((inv) => inv.status === 'paid').length;
    return { totalAmount, totalPaid, totalBalance, paidCount, totalCount: invoiceList.length };
  }, [invoiceList]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Invoices"
        subtitle="Create and track customer invoices"
        actions={<Button leftIcon={<Icon name="Plus" size={16} />} onClick={openCreate}>Create Invoice</Button>}
      />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Billed</span>
          <span className={styles.statValue}>${summaryStats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Collected</span>
          <span className={`${styles.statValue} ${styles.statSuccess}`}>${summaryStats.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Outstanding</span>
          <span className={`${styles.statValue} ${styles.statWarning}`}>${summaryStats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Paid Invoices</span>
          <span className={styles.statValue}>
            {summaryStats.paidCount}/{summaryStats.totalCount}
          </span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchBar placeholder="Search invoices..." value={search} onChange={handleSearch} className={styles.search} />
          <Select options={statusFilterOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filter} />
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} onRowClick={(row) => setPreviewInvoice(row)} />
      </div>

      <div className={styles.results}>{filtered.length} invoices found</div>

      {/* Preview Modal */}
      <Modal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} title="Invoice Preview" size="xl">
        {previewInvoice && (
          <DocumentEngine
            document={previewInvoice}
            actions={{
              onEdit: () => { const inv = previewInvoice; setPreviewInvoice(null); openEdit(inv); },
              onDuplicate: () => { const inv = previewInvoice; setPreviewInvoice(null); duplicateInvoice(inv); },
              onDelete: () => { const inv = previewInvoice; setPreviewInvoice(null); setDeleteInvoice(inv); },
            }}
          />
        )}
      </Modal>

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditInvoice(null);
        }}
        title={editInvoice ? 'Edit Invoice' : 'Create Invoice'}
        size="xl"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsFormOpen(false);
                setEditInvoice(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>{editInvoice ? 'Save Changes' : 'Create Invoice'}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className={styles.formTop}>
            <Select label="Customer" required options={customerOptions} placeholder="Select customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
            <Input label="Issue Date" type="date" required value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            <Input label="Due Date" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>

          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4 className={styles.sectionTitle}>Items</h4>
              <Button size="sm" variant="ghost" leftIcon={<Icon name="Plus" size={14} />} onClick={addItem}>
                Add Item
              </Button>
            </div>
            {form.items.length === 0 ? (
              <div className={styles.emptyItems}>
                <Icon name="FileText" size={24} />
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {form.items.map((item, index) => (
                  <div key={index} className={styles.itemRow}>
                    <div className={styles.itemProduct}>
                      <Select options={productOptions} placeholder="Select product" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} />
                    </div>
                    <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} className={styles.itemDesc} />
                    <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} className={styles.itemQty} />
                    <Input type="number" placeholder="Price" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} className={styles.itemPrice} />
                    <div className={styles.itemTotal}>{formatCurrency(item.total)}</div>
                    <button className={styles.removeItem} onClick={() => removeItem(index)}>
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formBottom}>
            <div className={styles.calcFields}>
              <div className={styles.calcRow}>
                <Select
                  label="Discount Type"
                  options={[
                    { value: 'percentage', label: 'Percentage (%)' },
                    { value: 'fixed', label: 'Fixed Amount' },
                  ]}
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                />
                <Input label="Discount" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                <Input label="Tax Rate (%)" type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
              </div>
            </div>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Discount</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax ({form.taxRate || 0}%)</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Grand Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add any notes for the customer..." />
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title="Record Payment" size="md" footer={
        <>
          <Button variant="ghost" onClick={() => setPaymentModal(null)}>Cancel</Button>
          <Button onClick={handlePayment}>Record Payment</Button>
        </>
      }>
        {paymentModal && (
          <div className={styles.paymentForm}>
            <div className={styles.paymentInfo}>
              <div className={styles.paymentRow}>
                <span>Invoice</span>
                <span className={styles.paymentValue}>{paymentModal.invoiceNumber}</span>
              </div>
              <div className={styles.paymentRow}>
                <span>Total Amount</span>
                <span className={styles.paymentValue}>{formatCurrency(paymentModal.total)}</span>
              </div>
              <div className={styles.paymentRow}>
                <span>Already Paid</span>
                <span className={styles.paymentValue}>{formatCurrency(paymentModal.paid)}</span>
              </div>
              <div className={styles.paymentRow}>
                <span>Balance Due</span>
                <span className={styles.paymentValue}>{formatCurrency(paymentModal.balance)}</span>
              </div>
            </div>
            <Input
              label="Payment Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter payment amount"
            />
            <div className={styles.paymentActions}>
              <Button size="sm" variant="ghost" onClick={() => setPaymentAmount(String(paymentModal.balance))}>
                Pay Full Balance
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteInvoice}
        onClose={() => setDeleteInvoice(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        message={deleteInvoice ? `Are you sure you want to delete invoice "${deleteInvoice.invoiceNumber}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />

    </div>
  );
}

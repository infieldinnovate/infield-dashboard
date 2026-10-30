'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import SelectField from '../../components/forms/form_elements/select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import RowActions from '../../components/ui/RowActions';
import InvoiceForm from '../../components/forms/InvoiceForm';
import PaymentForm from '../../components/forms/PaymentForm';
import { invoices as initialInvoices } from '../../data/invoices';
import { customers } from '../../data/customers';
import { products } from '../../data/products';
import { Invoice } from '../../types';
import InvoiceDocument, { printInvoice, downloadInvoicePDF } from '../../components/InvoiceDocument';
import { InvoiceFormData } from '../../schema/formSchema';
import { generatePrefixedId } from '../../lib/generateCode';
import { toast } from 'sonner';

const statusVariant: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'secondary'> = {
  paid: 'success',
  unpaid: 'warning',
  partial: 'primary',
  overdue: 'error',
};

const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));
const productOptions = products.map((p) => ({ value: p.id, label: `${p.productName} (${p.size})` }));

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
  const [paymentModal, setPaymentModal] = useState<Invoice | null>(null);

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
    setIsFormOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    setIsFormOpen(true);
  };

  const duplicateInvoice = (inv: Invoice) => {
    const newInvoice: Invoice = {
      ...inv,
      id: generatePrefixedId('inv'),
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

  const onSubmit = (data: InvoiceFormData) => {
    const customer = customers.find((c) => c.id === data.customerId);
    if (!customer) return;

    const items = data.items;
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const discountAmount =
      data.discountType === 'percentage'
        ? (subtotal * (parseFloat(data.discount) || 0)) / 100
        : parseFloat(data.discount) || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxRate = parseFloat(data.taxRate) || 0;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + tax;

    const invData: Invoice = {
      id: editInvoice?.id || generatePrefixedId('inv'),
      customerId: data.customerId,
      customerName: customer.name,
      invoiceNumber: editInvoice?.invoiceNumber || generateInvoiceNumber(invoiceList),
      items,
      subtotal,
      discount: parseFloat(data.discount) || 0,
      discountType: data.discountType,
      tax,
      taxRate,
      total,
      paid: editInvoice?.paid || 0,
      balance: total - (editInvoice?.paid || 0),
      status: editInvoice?.status || 'unpaid',
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      paidDate: editInvoice?.paidDate,
      notes: data.notes,
    };

    if (editInvoice) {
      setInvoiceList((prev) => prev.map((inv) => (inv.id === editInvoice.id ? invData : inv)));
    } else {
      setInvoiceList((prev) => [invData, ...prev]);
    }
    setIsFormOpen(false);
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
  };

  const handlePayment = (amount: number) => {
    if (!paymentModal) return;
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
          { icon: 'Printer', label: 'Print', onClick: (e: React.MouseEvent) => { e.stopPropagation(); printInvoice(row); } },
          { icon: 'Download', label: 'Download PDF', onClick: (e: React.MouseEvent) => { e.stopPropagation(); downloadInvoicePDF(row); } },
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
          <SelectField options={statusFilterOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filter} />
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} onRowClick={(row) => setPreviewInvoice(row)} />
      </div>

      <div className={styles.results}>{filtered.length} invoices found</div>

      {/* Preview Modal */}
      <Modal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} title="Invoice Preview" size="xl">
        {previewInvoice && (
          <InvoiceDocument
            invoice={previewInvoice}
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
      >
        <InvoiceForm
          mode={editInvoice ? 'edit' : 'create'}
          initialValues={editInvoice}
          onSubmit={onSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditInvoice(null);
          }}
          customerOptions={customerOptions}
          productOptions={productOptions}
          products={products}
        />
      </Modal>

      {/* Payment Modal */}
      <PaymentForm
        invoice={paymentModal}
        onConfirm={(amount) => handlePayment(amount)}
        onClose={() => setPaymentModal(null)}
      />

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

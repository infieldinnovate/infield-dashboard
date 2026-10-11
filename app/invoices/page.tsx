'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import SelectField from '../../components/forms/form_elements/select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import InputField from '../../components/forms/form_elements/input';
import TextareaField from '../../components/forms/form_elements/textarea';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import RowActions from '../../components/ui/RowActions';
import { invoices as initialInvoices } from '../../data/invoices';
import { customers } from '../../data/customers';
import { products } from '../../data/products';
import { Invoice, InvoiceItem } from '../../types';
import InvoiceDocument, { printInvoice, downloadInvoicePDF } from '../../components/InvoiceDocument';
import { formatCurrency } from '../../lib/documentUtils';
import { invoiceFormSchema, InvoiceFormData } from '../../schema/formSchema';
import { toast } from 'sonner';

const statusVariant: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'secondary'> = {
  paid: 'success',
  unpaid: 'warning',
  partial: 'primary',
  overdue: 'error',
};

const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));
const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

const discountTypeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount' },
];

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

function getDefaultValues(): InvoiceFormData {
  return {
    customerId: '',
    items: [],
    discount: '0',
    discountType: 'percentage',
    taxRate: '10',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '',
  };
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
  const [paymentAmount, setPaymentAmount] = useState('');

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } =
    useForm<InvoiceFormData>({
      resolver: zodResolver(invoiceFormSchema),
      defaultValues: getDefaultValues(),
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount');
  const watchedDiscountType = watch('discountType');
  const watchedTaxRate = watch('taxRate');

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

  const totals = useMemo(() => {
    const items = (watchedItems || []) as InvoiceItem[];
    return calcTotals(
      items,
      parseFloat(watchedDiscount) || 0,
      (watchedDiscountType ?? 'percentage') as 'percentage' | 'fixed',
      parseFloat(watchedTaxRate) || 0,
    );
  }, [watchedItems, watchedDiscount, watchedDiscountType, watchedTaxRate]);

  const openCreate = () => {
    setEditInvoice(null);
    reset(getDefaultValues());
    setIsFormOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    const discountPercent = inv.discountType === 'percentage' ? inv.discount : 0;
    const discountFixed = inv.discountType === 'fixed' ? inv.discount : 0;
    reset({
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
    append({ productId: '', productName: '', description: '', quantity: 1, unitPrice: 0, total: 0 });
  };

  const onProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setValue(`items.${index}.productName`, product?.name || '');
    const unitPrice = product?.price || 0;
    setValue(`items.${index}.unitPrice`, unitPrice);
    const qty = watchedItems?.[index]?.quantity ?? 0;
    setValue(`items.${index}.total`, unitPrice * qty);
  };

  const onQtyChange = (index: number, rawValue: string) => {
    const qty = parseInt(rawValue) || 0;
    const price = watchedItems?.[index]?.unitPrice ?? 0;
    setValue(`items.${index}.total`, qty * price);
    return qty;
  };

  const onPriceChange = (index: number, rawValue: string) => {
    const price = parseFloat(rawValue) || 0;
    const qty = watchedItems?.[index]?.quantity ?? 0;
    setValue(`items.${index}.total`, qty * price);
    return price;
  };

  const onSubmit = (data: InvoiceFormData) => {
    const customer = customers.find((c) => c.id === data.customerId);
    if (!customer) return;

    const invData: Invoice = {
      id: editInvoice?.id || `inv-${Date.now()}`,
      customerId: data.customerId,
      customerName: customer.name,
      invoiceNumber: editInvoice?.invoiceNumber || generateInvoiceNumber(invoiceList),
      items: data.items,
      subtotal: totals.subtotal,
      discount: parseFloat(data.discount) || 0,
      discountType: data.discountType,
      tax: totals.tax,
      taxRate: parseFloat(data.taxRate) || 0,
      total: totals.total,
      paid: editInvoice?.paid || 0,
      balance: totals.total - (editInvoice?.paid || 0),
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
            <Button onClick={handleSubmit(onSubmit)}>{editInvoice ? 'Save Changes' : 'Create Invoice'}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className={styles.formTop}>
            <SelectField
              label="Customer"
              required
              options={customerOptions}
              placeholder="Select customer"
              register={register}
              name="customerId"
              error={errors.customerId ?? null}
            />
            <InputField
              label="Issue Date"
              type="date"
              required
              register={register}
              name="issueDate"
              error={errors.issueDate ?? null}
            />
            <InputField
              label="Due Date"
              type="date"
              required
              register={register}
              name="dueDate"
              error={errors.dueDate ?? null}
            />
          </div>

          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4 className={styles.sectionTitle}>Items</h4>
              <Button size="sm" variant="ghost" leftIcon={<Icon name="Plus" size={14} />} onClick={addItem}>
                Add Item
              </Button>
            </div>
            {errors.items?.message && (
              <p style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>{String(errors.items.message)}</p>
            )}
            {fields.length === 0 ? (
              <div className={styles.emptyItems}>
                <Icon name="FileText" size={24} />
                <p>No items added yet. Click &ldquo;Add Item&rdquo; to get started.</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {fields.map((item, index) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemProduct}>
                      <Controller
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field, fieldState }) => (
                          <SelectField
                            options={productOptions}
                            placeholder="Select product"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              onProductChange(index, e.target.value);
                            }}
                            error={fieldState.error ?? null}
                          />
                        )}
                      />
                    </div>
                    <InputField
                      placeholder="Description"
                      register={register}
                      name={`items.${index}.description`}
                      className={styles.itemDesc}
                    />
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      render={({ field, fieldState }) => (
                        <InputField
                          type="number"
                          placeholder="Qty"
                          value={field.value}
                          onChange={(e) => field.onChange(onQtyChange(index, e.target.value))}
                          error={fieldState.error ?? null}
                          className={styles.itemQty}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name={`items.${index}.unitPrice`}
                      render={({ field, fieldState }) => (
                        <InputField
                          type="number"
                          placeholder="Price"
                          value={field.value}
                          onChange={(e) => field.onChange(onPriceChange(index, e.target.value))}
                          error={fieldState.error ?? null}
                          className={styles.itemPrice}
                        />
                      )}
                    />
                    <div className={styles.itemTotal}>
                      {formatCurrency(watchedItems?.[index]?.total ?? 0)}
                    </div>
                    <button className={styles.removeItem} onClick={() => remove(index)}>
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
                <SelectField
                  label="Discount Type"
                  options={discountTypeOptions}
                  register={register}
                  name="discountType"
                  error={errors.discountType ?? null}
                />
                <InputField
                  label="Discount"
                  type="number"
                  register={register}
                  name="discount"
                  error={errors.discount ?? null}
                />
                <InputField
                  label="Tax Rate (%)"
                  type="number"
                  register={register}
                  name="taxRate"
                  error={errors.taxRate ?? null}
                />
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
                <span>Tax ({watchedTaxRate || 0}%)</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Grand Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          <TextareaField
            label="Notes"
            register={register}
            name="notes"
            error={errors.notes ?? null}
            placeholder="Add any notes for the customer..."
          />
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
            <InputField
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

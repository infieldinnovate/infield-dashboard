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
import { deliveryNotes as initialDeliveryNotes } from '../../data/deliveryNotes';
import { invoices } from '../../data/invoices';
import { products } from '../../data/products';
import { DeliveryNote } from '../../types';
import DeliveryNoteDocument, { printDeliveryNote, downloadDeliveryNotePDF } from '../../components/DeliveryNoteDocument';
import { deliveryNoteFormSchema, DeliveryNoteFormData } from '../../schema/formSchema';
import { toast } from 'sonner';

const statusVariant: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'secondary'> = {
  pending: 'warning',
  shipped: 'primary',
  delivered: 'success',
  returned: 'error',
};

const statusIcon: Record<string, string> = {
  pending: 'Clock',
  shipped: 'Truck',
  delivered: 'PackageCheck',
  returned: 'PackageX',
};

const carrierOptions = [
  { value: 'FedEx', label: 'FedEx' },
  { value: 'UPS Ground', label: 'UPS Ground' },
  { value: 'DHL Express', label: 'DHL Express' },
  { value: 'DHL Freight', label: 'DHL Freight' },
  { value: 'GLS Italy', label: 'GLS Italy' },
  { value: 'USPS', label: 'USPS' },
  { value: 'Other', label: 'Other' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
];

function generateDeliveryNumber(existingNotes: DeliveryNote[]): string {
  const year = new Date().getFullYear();
  const numbers = existingNotes
    .map((dn) => dn.deliveryNumber)
    .filter((num) => num.includes(`DN-${year}`))
    .map((num) => parseInt(num.split('-').pop() || '0', 10))
    .filter((n) => !isNaN(n));
  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `DN-${year}-${String(nextNum).padStart(4, '0')}`;
}

function getDefaultValues(): DeliveryNoteFormData {
  return {
    invoiceId: '',
    customerName: '',
    customerAddress: '',
    recipient: '',
    recipientPhone: '',
    items: [],
    status: 'pending',
    shipDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    carrier: '',
    trackingNumber: '',
    notes: '',
  };
}

export default function DeliveryNotesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryNoteList, setDeliveryNoteList] = useState<DeliveryNote[]>(initialDeliveryNotes);
  const [previewNote, setPreviewNote] = useState<DeliveryNote | null>(null);
  const [editNote, setEditNote] = useState<DeliveryNote | null>(null);
  const [deleteNote, setDeleteNote] = useState<DeliveryNote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } =
    useForm<DeliveryNoteFormData>({
      resolver: zodResolver(deliveryNoteFormSchema),
      defaultValues: getDefaultValues(),
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const filtered = useMemo(() => {
    let data = [...deliveryNoteList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (dn) =>
          dn.id.toLowerCase().includes(q) ||
          dn.deliveryNumber.toLowerCase().includes(q) ||
          dn.customerName.toLowerCase().includes(q) ||
          dn.trackingNumber.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      data = data.filter((dn) => dn.status === statusFilter);
    }
    return data.sort((a, b) => new Date(b.shipDate).getTime() - new Date(a.shipDate).getTime());
  }, [deliveryNoteList, search, statusFilter]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const invoiceOptions = invoices.map((inv) => ({
    value: inv.id,
    label: `${inv.invoiceNumber} - ${inv.customerName}`,
  }));

  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  const openCreate = () => {
    setEditNote(null);
    reset(getDefaultValues());
    setIsFormOpen(true);
  };

  const openEdit = (dn: DeliveryNote) => {
    setEditNote(dn);
    reset({
      invoiceId: dn.invoiceId,
      customerName: dn.customerName,
      customerAddress: dn.customerAddress,
      recipient: dn.recipient,
      recipientPhone: dn.recipientPhone,
      items: dn.items.map((i) => ({ ...i })),
      status: dn.status,
      shipDate: dn.shipDate,
      deliveryDate: dn.deliveryDate || '',
      carrier: dn.carrier,
      trackingNumber: dn.trackingNumber,
      notes: dn.notes,
    });
    setIsFormOpen(true);
  };

  const duplicateNote = (dn: DeliveryNote) => {
    setEditNote(null);
    reset({
      invoiceId: dn.invoiceId,
      customerName: dn.customerName,
      customerAddress: dn.customerAddress,
      recipient: dn.recipient,
      recipientPhone: dn.recipientPhone,
      items: dn.items.map((i) => ({ ...i })),
      status: dn.status,
      shipDate: dn.shipDate,
      deliveryDate: dn.deliveryDate || '',
      carrier: dn.carrier,
      trackingNumber: dn.trackingNumber,
      notes: dn.notes,
    });
    setIsFormOpen(true);
    toast.info('Delivery note duplicated - review and save to create');
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setValue('invoiceId', invoiceId);
      setValue('customerName', invoice.customerName);
      setValue(
        'customerAddress',
        invoice.customerName === 'Acme Corporation' ? '123 Industrial Parkway, Suite 400, Austin, USA' :
          invoice.customerName === 'Bright Solutions Ltd' ? '45 Baker Street, London, UK' :
            invoice.customerName === 'Delta Logistics GmbH' ? 'Industriestraße 12, Munich, Germany' :
              invoice.customerName === 'Fresh Foods Inc' ? '890 Market Street, San Francisco, USA' :
                invoice.customerName === 'Elena Rossi' ? 'Via Roma 15, Milan, Italy' : 'Unknown Address'
      );
      setValue('items', invoice.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        quantityDelivered: 0,
      })));
    }
  };

  const onProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setValue(`items.${index}.productName`, product?.name || '');
  };

  const addItem = () => {
    append({ productId: '', productName: '', quantity: 1, quantityDelivered: 0 });
  };

  const onSubmit = (data: DeliveryNoteFormData) => {
    const noteData: DeliveryNote = {
      id: editNote?.id || `dn-${Date.now()}`,
      invoiceId: data.invoiceId,
      deliveryNumber: editNote?.deliveryNumber || generateDeliveryNumber(deliveryNoteList),
      customerName: data.customerName,
      customerAddress: data.customerAddress,
      recipient: data.recipient,
      recipientPhone: data.recipientPhone,
      items: data.items,
      status: data.status,
      shipDate: data.shipDate,
      deliveryDate: data.deliveryDate || undefined,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber || 'PENDING',
      notes: data.notes,
    };

    if (editNote) {
      setDeliveryNoteList((prev) => prev.map((dn) => (dn.id === editNote.id ? noteData : dn)));
    } else {
      setDeliveryNoteList((prev) => [noteData, ...prev]);
    }
    setIsFormOpen(false);
    setEditNote(null);
    toast.success(editNote ? 'Delivery note updated successfully' : 'Delivery note created successfully');
  };

  const updateStatus = (dn: DeliveryNote, newStatus: 'pending' | 'shipped' | 'delivered' | 'returned') => {
    setDeliveryNoteList((prev) =>
      prev.map((note) =>
        note.id === dn.id
          ? {
            ...note,
            status: newStatus,
            deliveryDate: newStatus === 'delivered' ? new Date().toISOString().split('T')[0] : note.deliveryDate,
            items: newStatus === 'delivered' ? note.items.map((i) => ({ ...i, quantityDelivered: i.quantity })) : note.items,
          }
          : note
      )
    );
    setPreviewNote(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteNote) {
      setDeliveryNoteList((prev) => prev.filter((dn) => dn.id !== deleteNote.id));
      setDeleteNote(null);
      toast.success('Delivery note deleted successfully');
    }
  };

  const getInvoiceNumber = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    return invoice?.invoiceNumber || invoiceId;
  };

  const columns = [
    {
      key: 'deliveryNumber',
      header: 'Delivery #',
      render: (row: DeliveryNote) => <span className={styles.deliveryId}>{row.deliveryNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row: DeliveryNote) => <span className={styles.customerName}>{row.customerName}</span>,
    },
    {
      key: 'invoiceId',
      header: 'Invoice',
      render: (row: DeliveryNote) => (
        <span className={styles.invoiceRef}>
          <Icon name="FileSpreadsheet" size={14} />
          {getInvoiceNumber(row.invoiceId)}
        </span>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient',
      render: (row: DeliveryNote) => <span className={styles.recipient}>{row.recipient}</span>,
    },
    {
      key: 'shipDate',
      header: 'Ship Date',
      render: (row: DeliveryNote) => <span className={styles.date}>{row.shipDate}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      align: 'center' as const,
      render: (row: DeliveryNote) => (
        <span className={styles.itemCount}>
          {row.items.reduce((sum, i) => sum + i.quantityDelivered, 0)}/{row.items.reduce((sum, i) => sum + i.quantity, 0)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center' as const,
      render: (row: DeliveryNote) => (
        <Badge variant={statusVariant[row.status]}>
          <Icon name={statusIcon[row.status]} size={12} />
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (row: DeliveryNote) => (
        <RowActions actions={[
          { icon: 'Eye', label: 'Preview', onClick: (e) => { e.stopPropagation(); setPreviewNote(row); } },
          { icon: 'Printer', label: 'Print', onClick: (e) => { e.stopPropagation(); printDeliveryNote(row); } },
          { icon: 'Download', label: 'Download PDF', onClick: (e) => { e.stopPropagation(); downloadDeliveryNotePDF(row); } },
          { icon: 'Pencil', label: 'Edit', onClick: (e) => { e.stopPropagation(); openEdit(row); } },
          { icon: 'Trash2', label: 'Delete', variant: 'danger', onClick: (e) => { e.stopPropagation(); setDeleteNote(row); } },
        ]} />
      ),
    },
  ];

  const statusFilterOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'returned', label: 'Returned' },
  ];

  const summaryStats = useMemo(() => {
    const pending = deliveryNoteList.filter((dn) => dn.status === 'pending').length;
    const shipped = deliveryNoteList.filter((dn) => dn.status === 'shipped').length;
    const delivered = deliveryNoteList.filter((dn) => dn.status === 'delivered').length;
    const returned = deliveryNoteList.filter((dn) => dn.status === 'returned').length;
    return { pending, shipped, delivered, returned, total: deliveryNoteList.length };
  }, [deliveryNoteList]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Delivery Notes"
        subtitle="Track shipments and deliveries"
        actions={<Button leftIcon={<Icon name="Plus" size={16} />} onClick={openCreate}>Create Delivery Note</Button>}
      />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Pending</span>
          <span className={`${styles.statValue} ${styles.pendingColor}`}>{summaryStats.pending}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Shipped</span>
          <span className={`${styles.statValue} ${styles.shippedColor}`}>{summaryStats.shipped}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Delivered</span>
          <span className={`${styles.statValue} ${styles.deliveredColor}`}>{summaryStats.delivered}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Returned</span>
          <span className={`${styles.statValue} ${styles.returnedColor}`}>{summaryStats.returned}</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchBar placeholder="Search delivery notes..." value={search} onChange={handleSearch} className={styles.search} />
          <SelectField options={statusFilterOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filter} />
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} onRowClick={(row) => setPreviewNote(row)} />
      </div>

      <div className={styles.results}>{filtered.length} delivery notes found</div>

      {/* Preview Modal */}
      <Modal isOpen={!!previewNote} onClose={() => setPreviewNote(null)} title="Delivery Note Preview" size="xl">
        {previewNote && (
          <DeliveryNoteDocument
            note={previewNote}
            actions={{
              onEdit: () => { const n = previewNote; setPreviewNote(null); openEdit(n); },
              onDuplicate: () => { const n = previewNote; setPreviewNote(null); duplicateNote(n); },
              onDelete: () => { const n = previewNote; setPreviewNote(null); setDeleteNote(n); },
            }}
          />
        )}
      </Modal>

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditNote(null);
        }}
        title={editNote ? 'Edit Delivery Note' : 'Create Delivery Note'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setIsFormOpen(false); setEditNote(null); }}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)}>{editNote ? 'Save Changes' : 'Create Delivery Note'}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className={styles.formRow}>
            <Controller
              control={control}
              name="invoiceId"
              render={({ field }) => (
                <SelectField
                  label="Invoice (Optional)"
                  options={[{ value: '', label: 'Select invoice...' }, ...invoiceOptions]}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    handleInvoiceSelect(e.target.value);
                  }}
                  placeholder="Auto-fill from invoice"
                />
              )}
            />
          </div>

          <div className={styles.formGrid}>
            <InputField
              label="Customer Name"
              required
              register={register}
              name="customerName"
              error={errors.customerName ?? null}
            />
            <InputField
              label="Recipient"
              required
              register={register}
              name="recipient"
              error={errors.recipient ?? null}
            />
          </div>

          <InputField
            label="Delivery Address"
            required
            register={register}
            name="customerAddress"
            error={errors.customerAddress ?? null}
          />
          <InputField
            label="Recipient Phone"
            register={register}
            name="recipientPhone"
            error={errors.recipientPhone ?? null}
          />

          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4 className={styles.sectionTitle}>Items</h4>
              <Button size="sm" variant="ghost" leftIcon={<Icon name="Plus" size={14} />} onClick={addItem}>Add Item</Button>
            </div>
            {errors.items?.message && (
              <p style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>{String(errors.items.message)}</p>
            )}
            {fields.length === 0 ? (
              <div className={styles.emptyItems}>
                <Icon name="Package" size={24} />
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
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      render={({ field, fieldState }) => (
                        <InputField
                          type="number"
                          placeholder="Qty"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          error={fieldState.error ?? null}
                          className={styles.itemQty}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name={`items.${index}.quantityDelivered`}
                      render={({ field, fieldState }) => (
                        <InputField
                          type="number"
                          placeholder="Delivered"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          error={fieldState.error ?? null}
                          className={styles.itemQty}
                        />
                      )}
                    />
                    <button className={styles.removeItem} onClick={() => remove(index)}><Icon name="X" size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGrid}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <SelectField
                  label="Status"
                  options={statusOptions}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              control={control}
              name="carrier"
              render={({ field }) => (
                <SelectField
                  label="Carrier"
                  options={[{ value: '', label: 'Select carrier...' }, ...carrierOptions]}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>

          <div className={styles.formGrid}>
            <InputField
              type="date"
              label="Ship Date"
              required
              register={register}
              name="shipDate"
              error={errors.shipDate ?? null}
            />
            <InputField
              type="date"
              label="Delivery Date"
              register={register}
              name="deliveryDate"
              error={errors.deliveryDate ?? null}
            />
          </div>

          <InputField
            label="Tracking Number"
            register={register}
            name="trackingNumber"
            error={errors.trackingNumber ?? null}
            placeholder="Enter tracking number or leave as PENDING"
          />
          <TextareaField
            label="Notes"
            register={register}
            name="notes"
            error={errors.notes ?? null}
            placeholder="Add delivery instructions or notes..."
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteNote}
        onClose={() => setDeleteNote(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Delivery Note"
        message={deleteNote ? `Are you sure you want to delete delivery note "${deleteNote.deliveryNumber}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />

    </div>
  );
}

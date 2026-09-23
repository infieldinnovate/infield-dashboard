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
import { deliveryNotes as initialDeliveryNotes } from '../../data/deliveryNotes';
import { invoices } from '../../data/invoices';
import { products } from '../../data/products';
import { DeliveryNote, DeliveryItem } from '../../types';
import { DocumentEngine, toDocumentConfig, printDocumentA4, downloadDocumentPDF } from '../../components/DocumentEngine';
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

export default function DeliveryNotesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryNoteList, setDeliveryNoteList] = useState<DeliveryNote[]>(initialDeliveryNotes);
  const [previewNote, setPreviewNote] = useState<DeliveryNote | null>(null);
  const [editNote, setEditNote] = useState<DeliveryNote | null>(null);
  const [deleteNote, setDeleteNote] = useState<DeliveryNote | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [form, setForm] = useState({
    invoiceId: '',
    customerName: '',
    customerAddress: '',
    recipient: '',
    recipientPhone: '',
    items: [] as DeliveryItem[],
    status: 'pending' as 'pending' | 'shipped' | 'delivered' | 'returned',
    shipDate: '',
    deliveryDate: '',
    carrier: '',
    trackingNumber: '',
    notes: '',
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
    setForm({
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
    });
    setIsFormOpen(true);
  };

  const openEdit = (dn: DeliveryNote) => {
    setEditNote(dn);
    setForm({
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
    setForm({
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
      setForm((prev) => ({
        ...prev,
        invoiceId,
        customerName: invoice.customerName,
        customerAddress: invoice.customerName === 'Acme Corporation' ? '123 Industrial Parkway, Suite 400, Austin, USA' :
                         invoice.customerName === 'Bright Solutions Ltd' ? '45 Baker Street, London, UK' :
                         invoice.customerName === 'Delta Logistics GmbH' ? 'Industriestraße 12, Munich, Germany' :
                         invoice.customerName === 'Fresh Foods Inc' ? '890 Market Street, San Francisco, USA' :
                         invoice.customerName === 'Elena Rossi' ? 'Via Roma 15, Milan, Italy' : 'Unknown Address',
        items: invoice.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          quantityDelivered: 0,
        })),
      }));
    }
  };

  const updateItem = (index: number, field: keyof DeliveryItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', productName: '', quantity: 1, quantityDelivered: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    if (!form.customerName || form.items.length === 0) return;

    const noteData: DeliveryNote = {
      id: editNote?.id || `dn-${Date.now()}`,
      invoiceId: form.invoiceId,
      deliveryNumber: editNote?.deliveryNumber || generateDeliveryNumber(deliveryNoteList),
      customerName: form.customerName,
      customerAddress: form.customerAddress,
      recipient: form.recipient,
      recipientPhone: form.recipientPhone,
      items: form.items,
      status: form.status,
      shipDate: form.shipDate,
      deliveryDate: form.deliveryDate || undefined,
      carrier: form.carrier,
      trackingNumber: form.trackingNumber || 'PENDING',
      notes: form.notes,
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
          { icon: 'Printer', label: 'Print', onClick: (e) => { e.stopPropagation(); printDocumentA4(toDocumentConfig(row)); } },
          { icon: 'Download', label: 'Download PDF', onClick: (e) => { e.stopPropagation(); downloadDocumentPDF(toDocumentConfig(row)); } },
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
          <Select options={statusFilterOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filter} />
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} onRowClick={(row) => setPreviewNote(row)} />
      </div>

      <div className={styles.results}>{filtered.length} delivery notes found</div>

      {/* Preview Modal */}
      <Modal isOpen={!!previewNote} onClose={() => setPreviewNote(null)} title="Delivery Note Preview" size="xl">
        {previewNote && (
          <DocumentEngine
            document={previewNote}
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
            <Button onClick={handleSave}>{editNote ? 'Save Changes' : 'Create Delivery Note'}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className={styles.formRow}>
            <Select
              label="Invoice (Optional)"
              options={[{ value: '', label: 'Select invoice...' }, ...invoiceOptions]}
              value={form.invoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              placeholder="Auto-fill from invoice"
            />
          </div>

          <div className={styles.formGrid}>
            <Input label="Customer Name" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <Input label="Recipient" required value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
          </div>

          <Input label="Delivery Address" required value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} />
          <Input label="Recipient Phone" value={form.recipientPhone} onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })} />

          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4 className={styles.sectionTitle}>Items</h4>
              <Button size="sm" variant="ghost" leftIcon={<Icon name="Plus" size={14} />} onClick={addItem}>Add Item</Button>
            </div>
            {form.items.length === 0 ? (
              <div className={styles.emptyItems}>
                <Icon name="Package" size={24} />
                <p>No items added yet. Click "Add Item" to get started.</p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {form.items.map((item, index) => (
                  <div key={index} className={styles.itemRow}>
                    <div className={styles.itemProduct}>
                      <Select options={productOptions} placeholder="Select product" value={item.productId} onChange={(e) => {
                        const product = products.find((p) => p.id === e.target.value);
                        const updated = [...form.items];
                        updated[index] = { ...item, productId: e.target.value, productName: product?.name || '' };
                        setForm({ ...form, items: updated });
                      }} />
                    </div>
                    <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} className={styles.itemQty} />
                    <Input type="number" placeholder="Delivered" value={item.quantityDelivered} onChange={(e) => updateItem(index, 'quantityDelivered', parseInt(e.target.value) || 0)} className={styles.itemQty} />
                    <button className={styles.removeItem} onClick={() => removeItem(index)}><Icon name="X" size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGrid}>
            <Select label="Status" options={[{ value: 'pending', label: 'Pending' }, { value: 'shipped', label: 'Shipped' }, { value: 'delivered', label: 'Delivered' }, { value: 'returned', label: 'Returned' }]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DeliveryNote['status'] })} />
            <Select label="Carrier" options={[{ value: '', label: 'Select carrier...' }, ...carrierOptions]} value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />
          </div>

          <div className={styles.formGrid}>
            <Input type="date" label="Ship Date" required value={form.shipDate} onChange={(e) => setForm({ ...form, shipDate: e.target.value })} />
            <Input type="date" label="Delivery Date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
          </div>

          <Input label="Tracking Number" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} placeholder="Enter tracking number or leave as PENDING" />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add delivery instructions or notes..." />
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

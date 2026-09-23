'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Icon from '../../components/ui/Icon';
import RowActions from '../../components/ui/RowActions';
import PageHeader from '../../components/ui/PageHeader';
import { suppliers as initialSuppliers } from '../../data/suppliers';
import { products } from '../../data/products';
import { Supplier } from '../../types';
import { formatCurrency } from '../../components/DocumentEngine';
import { toast } from 'sonner';

const statusVariant: Record<string, 'success' | 'error'> = {
  active: 'success',
  inactive: 'error',
};

const paymentTermsOptions = [
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 45', label: 'Net 45' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Prepaid', label: 'Prepaid' },
  { value: 'COD', label: 'COD' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const emptyForm = { name: '', email: '', phone: '', address: '', city: '', country: '', taxId: '', paymentTerms: 'Net 30', leadTime: '', status: 'active', rating: '', categories: '' };

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [supplierList, setSupplierList] = useState<Supplier[]>(initialSuppliers);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    if (!search.trim()) return supplierList;
    const q = search.toLowerCase();
    return supplierList.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.categories.some((c) => c.toLowerCase().includes(q)));
  }, [supplierList, search]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const suppliedProducts = useMemo(() => {
    if (!detailSupplier) return [];
    return products.filter((p) => detailSupplier.categories.some((cat) => p.category === cat || p.category.includes(cat)));
  }, [detailSupplier]);

  const openEdit = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setEditForm({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      country: supplier.country,
      taxId: supplier.taxId,
      paymentTerms: supplier.paymentTerms,
      leadTime: String(supplier.leadTime),
      status: supplier.status,
      rating: String(supplier.rating),
      categories: supplier.categories.join(', '),
    });
  };

  const handleEditSave = () => {
    if (!editSupplier) return;
    setSupplierList((prev) =>
      prev.map((s) =>
        s.id === editSupplier.id
          ? {
              ...s,
              name: editForm.name,
              email: editForm.email,
              phone: editForm.phone,
              address: editForm.address,
              city: editForm.city,
              country: editForm.country,
              taxId: editForm.taxId,
              paymentTerms: editForm.paymentTerms,
              leadTime: parseInt(editForm.leadTime) || 0,
              status: editForm.status as 'active' | 'inactive',
              rating: parseFloat(editForm.rating) || 0,
              categories: editForm.categories.split(',').map((c) => c.trim()).filter(Boolean),
            }
          : s
      )
    );
    setEditSupplier(null);
    toast.success('Supplier updated successfully');
  };

  const handleAddSave = () => {
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: addForm.name,
      email: addForm.email,
      phone: addForm.phone,
      address: addForm.address,
      city: addForm.city,
      country: addForm.country,
      taxId: addForm.taxId,
      paymentTerms: addForm.paymentTerms,
      leadTime: parseInt(addForm.leadTime) || 0,
      status: addForm.status as 'active' | 'inactive',
      rating: parseFloat(addForm.rating) || 0,
      categories: addForm.categories.split(',').map((c) => c.trim()).filter(Boolean),
    };
    setSupplierList((prev) => [newSupplier, ...prev]);
    setAddForm(emptyForm);
    setIsAddOpen(false);
    toast.success('Supplier added successfully');
  };

  const handleDeleteConfirm = () => {
    if (deleteSupplier) {
      setSupplierList((prev) => prev.filter((s) => s.id !== deleteSupplier.id));
      setDeleteSupplier(null);
      toast.success('Supplier deleted successfully');
    }
  };

  const renderRating = (rating: number) => (
    <div className={styles.rating}>
      <Icon name="Star" size={14} className={styles.starIcon} />
      <span>{rating.toFixed(1)}</span>
    </div>
  );

  const columns = [
    { key: 'name', header: 'Supplier', render: (row: Supplier) => (
      <div className={styles.supplierCell}>
        <div className={styles.avatar}>{row.name.charAt(0)}</div>
        <div className={styles.supplierInfo}>
          <span className={styles.supplierName}>{row.name}</span>
          <span className={styles.supplierEmail}>{row.email}</span>
        </div>
      </div>
    )},
    { key: 'categories', header: 'Categories', render: (row: Supplier) => (
      <div className={styles.categoryBadges}>
        {row.categories.map((cat) => <Badge key={cat} size="sm" variant="secondary">{cat}</Badge>)}
      </div>
    )},
    { key: 'location', header: 'Location', render: (row: Supplier) => <span className={styles.location}>{row.city}, {row.country}</span> },
    { key: 'paymentTerms', header: 'Terms', render: (row: Supplier) => <span className={styles.terms}>{row.paymentTerms}</span> },
    { key: 'leadTime', header: 'Lead Time', align: 'center' as const, render: (row: Supplier) => <span className={styles.leadTime}>{row.leadTime} days</span> },
    { key: 'rating', header: 'Rating', align: 'center' as const, render: (row: Supplier) => renderRating(row.rating) },
    { key: 'status', header: 'Status', align: 'center' as const, render: (row: Supplier) => <Badge variant={statusVariant[row.status]} size="sm">{row.status}</Badge> },
    { key: 'actions', header: '', align: 'right' as const, render: (row: Supplier) => (
      <RowActions actions={[
        { icon: 'Eye', label: 'View', onClick: (e) => { e.stopPropagation(); setDetailSupplier(row); } },
        { icon: 'Pencil', label: 'Edit', onClick: (e) => { e.stopPropagation(); openEdit(row); } },
        { icon: 'Trash2', label: 'Delete', variant: 'danger', onClick: (e) => { e.stopPropagation(); setDeleteSupplier(row); } },
      ]} />
    )},
  ];

  const renderForm = (form: typeof emptyForm, setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>) => (
    <>
      <Input label="Supplier Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <div className={styles.formRow}>
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <div className={styles.formRow}>
        <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <Input label="Tax ID" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
        <Input label="Categories (comma-separated)" placeholder="Beverages, Food" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <Select label="Payment Terms" options={paymentTermsOptions} value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
        <Input label="Lead Time (days)" type="number" value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <Input label="Rating (0-5)" type="number" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
        <Select label="Status" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
      </div>
    </>
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Suppliers"
        subtitle="Manage vendor relationships and purchase terms"
        actions={<Button leftIcon={<Icon name="Plus" size={16} />} onClick={() => setIsAddOpen(true)}>Add Supplier</Button>}
      />
      <div className={styles.toolbar}>
        <SearchBar placeholder="Search suppliers..." value={search} onChange={handleSearch} className={styles.search} />
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} onRowClick={(row) => setDetailSupplier(row)} />
      </div>

      <div className={styles.results}>{filtered.length} suppliers found</div>

      {/* Detail Modal */}
      <Modal isOpen={!!detailSupplier} onClose={() => setDetailSupplier(null)} title="Supplier Details" size="lg">
        {detailSupplier && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>{detailSupplier.name.charAt(0)}</div>
              <div className={styles.detailInfo}>
                <h3 className={styles.detailName}>{detailSupplier.name}</h3>
                <div className={styles.detailBadges}>
                  <Badge variant={statusVariant[detailSupplier.status]} size="sm">{detailSupplier.status}</Badge>
                  {renderRating(detailSupplier.rating)}
                </div>
              </div>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}><span className={styles.detailLabel}>Email</span><span>{detailSupplier.email}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Phone</span><span>{detailSupplier.phone}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Tax ID</span><span>{detailSupplier.taxId}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Address</span><span>{detailSupplier.address}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>City</span><span>{detailSupplier.city}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Country</span><span>{detailSupplier.country}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Payment Terms</span><span>{detailSupplier.paymentTerms}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Lead Time</span><span>{detailSupplier.leadTime} days</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Rating</span><span>{detailSupplier.rating.toFixed(1)} / 5</span></div>
            </div>
            <div className={styles.categoriesSection}>
              <span className={styles.detailLabel}>Supplied Categories</span>
              <div className={styles.categoryBadges}>
                {detailSupplier.categories.map((cat) => <Badge key={cat} variant="secondary">{cat}</Badge>)}
              </div>
            </div>

            <div className={styles.productsSection}>
              <h4 className={styles.historyTitle}>Products Supplied</h4>
              {suppliedProducts.length === 0 ? (
                <p className={styles.emptyHistory}>No matching products found in inventory.</p>
              ) : (
                <div className={styles.historyTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliedProducts.map((p) => (
                        <tr key={p.id}>
                          <td><span className={styles.productName}>{p.name}</span></td>
                          <td>{p.sku}</td>
                          <td><Badge size="sm">{p.category}</Badge></td>
                          <td className={styles.amount}>{formatCurrency(p.price)}</td>
                          <td>{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Supplier" size="md" footer={
        <>
          <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSave}>Save Supplier</Button>
        </>
      }>
        <div className={styles.form}>{renderForm(addForm, setAddForm)}</div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editSupplier} onClose={() => setEditSupplier(null)} title="Edit Supplier" size="md" footer={
        <>
          <Button variant="ghost" onClick={() => setEditSupplier(null)}>Cancel</Button>
          <Button onClick={handleEditSave}>Save Changes</Button>
        </>
      }>
        <div className={styles.form}>{renderForm(editForm, setEditForm)}</div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteSupplier}
        onClose={() => setDeleteSupplier(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier"
        message={deleteSupplier ? `Are you sure you want to delete "${deleteSupplier.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

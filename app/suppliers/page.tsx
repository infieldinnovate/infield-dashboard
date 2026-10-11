'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import InputField from '../../components/forms/form_elements/input';
import SelectField from '../../components/forms/form_elements/select';
import Icon from '../../components/ui/Icon';
import RowActions from '../../components/ui/RowActions';
import PageHeader from '../../components/ui/PageHeader';
import { suppliers as initialSuppliers } from '../../data/suppliers';
import { products } from '../../data/products';
import { Supplier } from '../../types';
import { formatCurrency } from '../../lib/documentUtils';
import { supplierFormSchema, SupplierFormData } from '../../schema/formSchema';
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

const emptyForm: SupplierFormData = { name: '', email: '', phone: '', address: '', city: '', country: '', taxId: '', paymentTerms: 'Net 30', leadTime: '', status: 'active', rating: '', categories: '' };

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [supplierList, setSupplierList] = useState<Supplier[]>(initialSuppliers);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: emptyForm,
  });

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
    reset({
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

  const openAdd = () => {
    reset(emptyForm);
    setIsAddOpen(true);
  };

  const onEditSubmit = (data: SupplierFormData) => {
    if (!editSupplier) return;
    setSupplierList((prev) =>
      prev.map((s) =>
        s.id === editSupplier.id
          ? {
              ...s,
              name: data.name,
              email: data.email,
              phone: data.phone,
              address: data.address,
              city: data.city,
              country: data.country,
              taxId: data.taxId,
              paymentTerms: data.paymentTerms,
              leadTime: parseInt(data.leadTime) || 0,
              status: data.status,
              rating: parseFloat(data.rating) || 0,
              categories: data.categories.split(',').map((c) => c.trim()).filter(Boolean),
            }
          : s
      )
    );
    setEditSupplier(null);
    toast.success('Supplier updated successfully');
  };

  const onAddSubmit = (data: SupplierFormData) => {
    const newSupplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      taxId: data.taxId,
      paymentTerms: data.paymentTerms,
      leadTime: parseInt(data.leadTime) || 0,
      status: data.status,
      rating: parseFloat(data.rating) || 0,
      categories: data.categories.split(',').map((c) => c.trim()).filter(Boolean),
    };
    setSupplierList((prev) => [newSupplier, ...prev]);
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

  const renderForm = () => (
    <>
      <InputField label="Supplier Name" required register={register} name="name" error={errors.name ?? null} />
      <div className={styles.formRow}>
        <InputField label="Email" type="email" required register={register} name="email" error={errors.email ?? null} />
        <InputField label="Phone" register={register} name="phone" error={errors.phone ?? null} />
      </div>
      <InputField label="Address" register={register} name="address" error={errors.address ?? null} />
      <div className={styles.formRow}>
        <InputField label="City" register={register} name="city" error={errors.city ?? null} />
        <InputField label="Country" register={register} name="country" error={errors.country ?? null} />
      </div>
      <div className={styles.formRow}>
        <InputField label="Tax ID" register={register} name="taxId" error={errors.taxId ?? null} />
        <InputField label="Categories (comma-separated)" placeholder="Beverages, Food" register={register} name="categories" error={errors.categories ?? null} />
      </div>
      <div className={styles.formRow}>
        <SelectField label="Payment Terms" options={paymentTermsOptions} register={register} name="paymentTerms" error={errors.paymentTerms ?? null} />
        <InputField label="Lead Time (days)" type="number" register={register} name="leadTime" error={errors.leadTime ?? null} />
      </div>
      <div className={styles.formRow}>
        <InputField label="Rating (0-5)" type="number" register={register} name="rating" error={errors.rating ?? null} />
        <SelectField label="Status" options={statusOptions} register={register} name="status" error={errors.status ?? null} />
      </div>
    </>
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Suppliers"
        subtitle="Manage vendor relationships and purchase terms"
        actions={<Button leftIcon={<Icon name="Plus" size={16} />} onClick={openAdd}>Add Supplier</Button>}
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
          <Button onClick={handleSubmit(onAddSubmit)}>Save Supplier</Button>
        </>
      }>
        <div className={styles.form}>{renderForm()}</div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editSupplier} onClose={() => setEditSupplier(null)} title="Edit Supplier" size="md" footer={
        <>
          <Button variant="ghost" onClick={() => setEditSupplier(null)}>Cancel</Button>
          <Button onClick={handleSubmit(onEditSubmit)}>Save Changes</Button>
        </>
      }>
        <div className={styles.form}>{renderForm()}</div>
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

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Icon from '../../components/ui/Icon';
import RowActions from '../../components/ui/RowActions';
import PageHeader from '../../components/ui/PageHeader';
import SupplierForm from '../../components/forms/SupplierForm';
import { suppliers as initialSuppliers } from '../../data/suppliers';
import { products } from '../../data/products';
import { Supplier } from '../../types';
import { formatCurrency } from '../../lib/documentUtils';
import { SupplierFormData } from '../../schema/formSchema';
import { toast } from 'sonner';

const statusVariant: Record<string, 'success' | 'error'> = {
  active: 'success',
  inactive: 'error',
};

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [supplierList, setSupplierList] = useState<Supplier[]>(initialSuppliers);
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

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
  };

  const openAdd = () => {
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Supplier" size="md">
        <SupplierForm mode="add" onSubmit={onAddSubmit} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editSupplier} onClose={() => setEditSupplier(null)} title="Edit Supplier" size="md">
        <SupplierForm mode="edit" initialValues={editSupplier} onSubmit={onEditSubmit} onCancel={() => setEditSupplier(null)} />
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

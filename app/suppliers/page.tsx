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
import { Supplier } from '../../types';
import { SupplierFormData } from '../../schema/formSchema';
import { generateCode } from '../../lib/generateCode';
import { toast } from 'sonner';

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
    return supplierList.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.categories.toLowerCase().includes(q));
  }, [supplierList, search]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

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
              phone2: data.phone2,
              address: data.address,
              city: data.city,
              country: data.country,
              categories: data.categories,
            }
          : s
      )
    );
    setEditSupplier(null);
    toast.success('Supplier updated successfully');
  };

  const onAddSubmit = (data: SupplierFormData) => {
    const newSupplier: Supplier = {
      id: generateCode(6, { prefix: 'sup' }),
      name: data.name,
      email: data.email,
      phone: data.phone,
      phone2: data.phone2,
      address: data.address,
      city: data.city,
      country: data.country,
      categories: data.categories,
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
    { key: 'phone', header: 'Phone', render: (row: Supplier) => (
      <div className={styles.phoneCell}>
        <span>{row.phone}</span>
        {row.phone2 && <span className={styles.phone2}>{row.phone2}</span>}
      </div>
    )},
    { key: 'categories', header: 'Categories', render: (row: Supplier) => (
      <div className={styles.categoriesText}>{row.categories}</div>
    )},
    { key: 'location', header: 'Location', render: (row: Supplier) => <span className={styles.location}>{row.city}, {row.country}</span> },
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
        subtitle="Manage vendor relationships and supplied categories"
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
      <Modal isOpen={!!detailSupplier} onClose={() => setDetailSupplier(null)} title="Supplier Details" size="md">
        {detailSupplier && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>{detailSupplier.name.charAt(0)}</div>
              <div className={styles.detailInfo}>
                <h3 className={styles.detailName}>{detailSupplier.name}</h3>
              </div>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}><span className={styles.detailLabel}>Email</span><span>{detailSupplier.email}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Phone</span><span>{detailSupplier.phone}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Phone 2</span><span>{detailSupplier.phone2 || '—'}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Address</span><span>{detailSupplier.address}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>City</span><span>{detailSupplier.city}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Country</span><span>{detailSupplier.country}</span></div>
            </div>
            <div className={styles.categoriesSection}>
              <span className={styles.detailLabel}>Categories</span>
              <span className={styles.categoriesDetail}>{detailSupplier.categories}</span>
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
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Icon from '../../components/ui/Icon';
import RowActions from '../../components/ui/RowActions';
import PageHeader from '../../components/ui/PageHeader';
import { products } from '../../data/products';
import { categories } from '../../data/categories';
import { Product } from '../../types';
import { formatCurrency } from '../../components/DocumentEngine';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 5;

const sortOptions = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'stock-asc', label: 'Stock (Low to High)' },
  { value: 'stock-desc', label: 'Stock (High to Low)' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  ...categories.map((c) => ({ value: c.name, label: c.name })),
];

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [productList, setProductList] = useState<Product[]>(products);

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [addForm, setAddForm] = useState({ name: '', price: '', cost: '', stock: '', category: '', sku: '', unit: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', price: '', cost: '', stock: '', category: '', sku: '', unit: '', description: '' });

  const filtered = useMemo(() => {
    let data = [...productList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (categoryFilter) {
      data = data.filter((p) => p.category === categoryFilter);
    }
    const [field, dir] = sortBy.split('-') as [keyof Product, string];
    data.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (typeof av === 'number' && typeof bv === 'number') {
        return dir === 'asc' ? av - bv : bv - av;
      }
      return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return data;
  }, [productList, search, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleDeleteConfirm = () => {
    if (deleteProduct) {
      setProductList((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
      toast.success('Product deleted successfully');
    }
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setEditForm({
      name: product.name,
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      category: product.category,
      sku: product.sku,
      unit: product.unit,
      description: product.description,
    });
  };

  const handleEditSave = () => {
    if (!editProduct) return;
    setProductList((prev) =>
      prev.map((p) =>
        p.id === editProduct.id
          ? {
              ...p,
              name: editForm.name,
              price: parseFloat(editForm.price) || 0,
              cost: parseFloat(editForm.cost) || 0,
              stock: parseInt(editForm.stock) || 0,
              category: editForm.category,
              sku: editForm.sku,
              unit: editForm.unit,
              description: editForm.description,
            }
          : p
      )
    );
    setEditProduct(null);
    toast.success('Product updated successfully');
  };

  const handleAddSave = () => {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: addForm.name,
      price: parseFloat(addForm.price) || 0,
      cost: parseFloat(addForm.cost) || 0,
      stock: parseInt(addForm.stock) || 0,
      category: addForm.category || 'Uncategorized',
      sku: addForm.sku,
      unit: addForm.unit,
      description: addForm.description,
      image: '/images/placeholder.jpg',
    };
    setProductList((prev) => [newProduct, ...prev]);
    setAddForm({ name: '', price: '', cost: '', stock: '', category: '', sku: '', unit: '', description: '' });
    setIsAddOpen(false);
    toast.success('Product added successfully');
  };

  const stockVariant = (stock: number): 'success' | 'warning' | 'error' => {
    if (stock > 20) return 'success';
    if (stock > 10) return 'warning';
    return 'error';
  };

  const columns = [
    { key: 'name', header: 'Product', render: (row: Product) => (
      <div className={styles.productCell}>
        <div className={styles.productAvatar}>{row.name.charAt(0)}</div>
        <div className={styles.productInfo}>
          <span className={styles.productName}>{row.name}</span>
          <span className={styles.productSku}>{row.sku}</span>
        </div>
      </div>
    )},
    { key: 'category', header: 'Category', render: (row: Product) => <Badge size="sm">{row.category}</Badge> },
    { key: 'price', header: 'Price', align: 'right' as const, render: (row: Product) => <span className={styles.price}>{formatCurrency(row.price)}</span> },
    { key: 'cost', header: 'Cost', align: 'right' as const, render: (row: Product) => <span className={styles.cost}>{formatCurrency(row.cost)}</span> },
    { key: 'stock', header: 'Stock', align: 'center' as const, render: (row: Product) => <Badge variant={stockVariant(row.stock)} size="sm">{row.stock}</Badge> },
    { key: 'actions', header: '', align: 'right' as const, render: (row: Product) => (
      <RowActions actions={[
        { icon: 'Eye', label: 'View', onClick: (e) => { e.stopPropagation(); setDetailProduct(row); } },
        { icon: 'Pencil', label: 'Edit', onClick: (e) => { e.stopPropagation(); openEdit(row); } },
        { icon: 'Trash2', label: 'Delete', variant: 'danger', onClick: (e) => { e.stopPropagation(); setDeleteProduct(row); } },
      ]} />
    )},
  ];

  const formFields = (
    <>
      <Input label="Product Name" required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
      <div className={styles.formRow}>
        <Input label="Price" type="number" required value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} />
        <Input label="Cost" type="number" required value={addForm.cost} onChange={(e) => setAddForm({ ...addForm, cost: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <Input label="Stock" type="number" required value={addForm.stock} onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })} />
        <Input label="Unit" required value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <Input label="SKU" required value={addForm.sku} onChange={(e) => setAddForm({ ...addForm, sku: e.target.value })} />
        <Select label="Category" options={categoryOptions.filter((o) => o.value !== '')} value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })} />
      </div>
      <Textarea label="Description" value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} />
    </>
  );

  const editFormFields = (
    <>
      <Input label="Product Name" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
      <div className={styles.formRow}>
        <Input label="Price" type="number" required value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
        <Input label="Cost" type="number" required value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <Input label="Stock" type="number" required value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} />
        <Input label="Unit" required value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} />
      </div>
      <div className={styles.formRow}>
        <Input label="SKU" required value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} />
        <Select label="Category" options={categoryOptions.filter((o) => o.value !== '')} value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
      </div>
      <Textarea label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
    </>
  );

  return (
    <div className={styles.page}>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog and inventory"
        actions={<Button leftIcon={<Icon name="Plus" size={16} />} onClick={() => setIsAddOpen(true)}>Add Product</Button>}
      />
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchBar placeholder="Search products..." value={search} onChange={handleSearch} className={styles.search} />
          <Select options={categoryOptions} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className={styles.filter} />
          <Select options={sortOptions} value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.filter} />
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={paginated} keyExtractor={(row) => row.id} onRowClick={(row) => setDetailProduct(row)} />
      </div>

      <div className={styles.pagination}>
        <span className={styles.results}>{filtered.length} products found</span>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detailProduct} onClose={() => setDetailProduct(null)} title="Product Details" size="md">
        {detailProduct && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>{detailProduct.name.charAt(0)}</div>
              <div className={styles.detailInfo}>
                <h3 className={styles.detailName}>{detailProduct.name}</h3>
                <Badge size="sm">{detailProduct.category}</Badge>
              </div>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}><span className={styles.detailLabel}>SKU</span><span>{detailProduct.sku}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Unit</span><span>{detailProduct.unit}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Price</span><span className={styles.price}>{formatCurrency(detailProduct.price)}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Cost</span><span className={styles.cost}>{formatCurrency(detailProduct.cost)}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Stock</span><Badge variant={stockVariant(detailProduct.stock)} size="sm">{detailProduct.stock}</Badge></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Margin</span><span>{(((detailProduct.price - detailProduct.cost) / detailProduct.price) * 100).toFixed(1)}%</span></div>
            </div>
            <div className={styles.detailDesc}>
              <span className={styles.detailLabel}>Description</span>
              <p>{detailProduct.description}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Product" size="md" footer={
        <>
          <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSave}>Save Product</Button>
        </>
      }>
        <div className={styles.form}>{formFields}</div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="md" footer={
        <>
          <Button variant="ghost" onClick={() => setEditProduct(null)}>Cancel</Button>
          <Button onClick={handleEditSave}>Save Changes</Button>
        </>
      }>
        <div className={styles.form}>{editFormFields}</div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={deleteProduct ? `Are you sure you want to delete "${deleteProduct.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

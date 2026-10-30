'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import SelectField from '../../components/forms/form_elements/select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import PaginationFooter from '../../components/ui/PaginationFooter';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Icon from '../../components/ui/Icon';
import RowActions from '../../components/ui/RowActions';
import PageHeader from '../../components/ui/PageHeader';
import ProductForm from '../../components/forms/ProductForm';
import { products } from '../../data/products';
import { categories } from '../../data/categories';
import { Product } from '../../types';
import { ProductFormData } from '../../schema/formSchema';
import { formatCurrency } from '../../lib/documentUtils';
import { generateCode } from '../../lib/generateCode';
import { toast } from 'sonner';


const sortOptions = [
  { value: 'productName-asc', label: 'Name (A-Z)' },
  { value: 'productName-desc', label: 'Name (Z-A)' },
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
  const [sortBy, setSortBy] = useState('productName-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [productList, setProductList] = useState<Product[]>(products);

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filtered = useMemo(() => {
    let data = [...productList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((p) => p.productName.toLowerCase().includes(q) || p.size.toLowerCase().includes(q));
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
  };

  const openAdd = () => {
    setIsAddOpen(true);
  };

  const onEditSubmit = (data: ProductFormData) => {
    if (!editProduct) return;
    setProductList((prev) =>
      prev.map((p) =>
        p.id === editProduct.id
          ? {
              ...p,
              productName: data.productName,
              size: data.size,
              price: parseFloat(data.price) || 0,
              stock: parseInt(data.stock) || 0,
              category: data.category,
              unit: data.unit,
            }
          : p
      )
    );
    setEditProduct(null);
    toast.success('Product updated successfully');
  };

  const onAddSubmit = (data: ProductFormData) => {
    const newProduct: Product = {
      id: generateCode(5),
      productName: data.productName,
      size: data.size,
      price: parseFloat(data.price) || 0,
      stock: parseInt(data.stock) || 0,
      category: data.category || 'Uncategorized',
      unit: data.unit,
    };
    setProductList((prev) => [newProduct, ...prev]);
    setIsAddOpen(false);
    toast.success('Product added successfully');
  };

  const stockVariant = (stock: number): 'success' | 'warning' | 'error' => {
    if (stock > 20) return 'success';
    if (stock > 10) return 'warning';
    return 'error';
  };

  const columns = [
    { key: 'productName', header: 'Product', render: (row: Product) => (
      <div className={styles.productCell}>
        <div className={styles.productAvatar}>{row.productName.charAt(0)}</div>
        <div className={styles.productInfo}>
          <span className={styles.productName}>{row.productName}</span>
          <span className={styles.productSku}>{row.size}</span>
        </div>
      </div>
    )},
    { key: 'category', header: 'Category', render: (row: Product) => <Badge size="sm">{row.category}</Badge> },
    { key: 'price', header: 'Price', align: 'right' as const, render: (row: Product) => <span className={styles.price}>{formatCurrency(row.price)}</span> },
    { key: 'stock', header: 'Stock', align: 'center' as const, render: (row: Product) => <Badge variant={stockVariant(row.stock)} size="sm">{row.stock}</Badge> },
    { key: 'actions', header: '', align: 'right' as const, render: (row: Product) => (
      <RowActions actions={[
        { icon: 'Eye', label: 'View', onClick: (e) => { e.stopPropagation(); setDetailProduct(row); } },
        { icon: 'Pencil', label: 'Edit', onClick: (e) => { e.stopPropagation(); openEdit(row); } },
        { icon: 'Trash2', label: 'Delete', variant: 'danger', onClick: (e) => { e.stopPropagation(); setDeleteProduct(row); } },
      ]} />
    )},
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog and inventory"
        actions={<Button leftIcon={<Icon name="Plus" size={16} />} onClick={openAdd}>Add Product</Button>}
      />
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchBar placeholder="Search products..." value={search} onChange={handleSearch} className={styles.search} />
          <SelectField options={categoryOptions} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className={styles.filter} />
          <SelectField options={sortOptions} value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.filter} />
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={paginated} keyExtractor={(row) => row.id} onRowClick={(row) => setDetailProduct(row)} />
      </div>

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
      />

      {/* Detail Modal */}
      <Modal isOpen={!!detailProduct} onClose={() => setDetailProduct(null)} title="Product Details" size="md">
        {detailProduct && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>{detailProduct.productName.charAt(0)}</div>
              <div className={styles.detailInfo}>
                <h3 className={styles.detailName}>{detailProduct.productName}</h3>
                <Badge size="sm">{detailProduct.category}</Badge>
              </div>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}><span className={styles.detailLabel}>Size</span><span>{detailProduct.size}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Unit</span><span>{detailProduct.unit}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Price</span><span className={styles.price}>{formatCurrency(detailProduct.price)}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Stock</span><Badge variant={stockVariant(detailProduct.stock)} size="sm">{detailProduct.stock}</Badge></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Product" size="md">
        <ProductForm mode="add" onSubmit={onAddSubmit} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="md">
        <ProductForm mode="edit" initialValues={editProduct} onSubmit={onEditSubmit} onCancel={() => setEditProduct(null)} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={deleteProduct ? `Are you sure you want to delete "${deleteProduct.productName}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

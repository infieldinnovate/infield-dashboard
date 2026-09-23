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
import { quoteTemplates as initialTemplates } from '../../data/quoteTemplates';
import { products } from '../../data/products';
import { QuoteTemplate, QuotationItem } from '../../types';
import { formatCurrency } from '../../components/DocumentEngine';
import { toast } from 'sonner';

const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

const categoryOptions = [
  { value: 'Solar Solutions', label: 'Solar Solutions' },
  { value: 'Electrical Installations', label: 'Electrical Installations' },
  { value: 'Plumbing Services', label: 'Plumbing Services' },
  { value: 'Borehole Solutions', label: 'Borehole Solutions' },
  { value: 'Irrigation Systems', label: 'Irrigation Systems' },
];

interface FormState {
  name: string;
  description: string;
  category: string;
  items: QuotationItem[];
  discount: string;
  discountType: 'percentage' | 'fixed';
  taxRate: string;
  notes: string;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  category: 'Solar Solutions',
  items: [],
  discount: '0',
  discountType: 'percentage',
  taxRate: '16',
  notes: '',
};

function calcTotals(items: QuotationItem[], discount: number, discountType: 'percentage' | 'fixed', taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + tax;
  return { subtotal, discountAmount, tax, total };
}

export default function QuoteTemplatesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [templateList, setTemplateList] = useState<QuoteTemplate[]>(initialTemplates);
  const [previewTemplate, setPreviewTemplate] = useState<QuoteTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<QuoteTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<QuoteTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = useMemo(() => {
    let data = [...templateList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      data = data.filter((t) => t.category === categoryFilter);
    }
    return data;
  }, [templateList, search, categoryFilter]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const templateTotal = (t: QuoteTemplate) => {
    return calcTotals(t.items, t.discount, t.discountType, t.taxRate).total;
  };

  const openCreate = () => {
    setEditTemplate(null);
    setForm({ ...emptyForm });
    setIsFormOpen(true);
  };

  const openEdit = (t: QuoteTemplate) => {
    setEditTemplate(t);
    setForm({
      name: t.name,
      description: t.description,
      category: t.category,
      items: t.items.map((i) => ({ ...i })),
      discount: String(t.discount),
      discountType: t.discountType,
      taxRate: String(t.taxRate),
      notes: t.notes,
    });
    setIsFormOpen(true);
  };

  const duplicateTemplate = (t: QuoteTemplate) => {
    const newT: QuoteTemplate = {
      ...t,
      id: `tmpl-${Date.now()}`,
      name: `${t.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
      items: t.items.map((i) => ({ ...i })),
    };
    setTemplateList((prev) => [newT, ...prev]);
    toast.success('Template duplicated successfully');
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0 }],
    }));
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      const item = { ...items[index] };
      if (field === 'productId') {
        const product = products.find((p) => p.id === value);
        item.productId = value as string;
        item.productName = product?.name || '';
        item.unitPrice = product?.price || 0;
      } else {
        (item as Record<keyof QuotationItem, unknown>)[field] = value;
      }
      item.total = item.quantity * item.unitPrice;
      items[index] = item;
      return { ...prev, items };
    });
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const totals = useMemo(() => {
    return calcTotals(form.items, parseFloat(form.discount) || 0, form.discountType, parseFloat(form.taxRate) || 0);
  }, [form]);

  const handleSave = () => {
    if (!form.name || form.items.length === 0) {
      toast.error('Template name and at least one item are required');
      return;
    }

    const tmplData: QuoteTemplate = {
      id: editTemplate?.id || `tmpl-${Date.now()}`,
      name: form.name,
      description: form.description,
      category: form.category,
      items: form.items,
      discount: parseFloat(form.discount) || 0,
      discountType: form.discountType,
      taxRate: parseFloat(form.taxRate) || 0,
      notes: form.notes,
      createdAt: editTemplate?.createdAt || new Date().toISOString().split('T')[0],
    };

    if (editTemplate) {
      setTemplateList((prev) => prev.map((t) => (t.id === editTemplate.id ? tmplData : t)));
    } else {
      setTemplateList((prev) => [tmplData, ...prev]);
    }
    setIsFormOpen(false);
    setForm(emptyForm);
    setEditTemplate(null);
    toast.success(editTemplate ? 'Template updated successfully' : 'Template created successfully');
  };

  const handleDeleteConfirm = () => {
    if (deleteTemplate) {
      setTemplateList((prev) => prev.filter((t) => t.id !== deleteTemplate.id));
      setDeleteTemplate(null);
      toast.success('Template deleted successfully');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Template Name',
      render: (row: QuoteTemplate) => (
        <div>
          <span className={styles.tmplName}>{row.name}</span>
          <div className={styles.tmplDesc}>{row.description}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row: QuoteTemplate) => <span className={styles.categoryTag}>{row.category}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      align: 'center' as const,
      render: (row: QuoteTemplate) => <span className={styles.itemsCount}>{row.items.length}</span>,
    },
    {
      key: 'total',
      header: 'Estimated Total',
      align: 'right' as const,
      render: (row: QuoteTemplate) => <span className={styles.amount}>{formatCurrency(templateTotal(row))}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: QuoteTemplate) => <span className={styles.date}>{row.createdAt}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (row: QuoteTemplate) => (
        <RowActions
          actions={[
            { icon: 'Eye', label: 'Preview', onClick: (e) => { e.stopPropagation(); setPreviewTemplate(row); } },
            { icon: 'Pencil', label: 'Edit', onClick: (e) => { e.stopPropagation(); openEdit(row); } },
            { icon: 'Copy', label: 'Duplicate', onClick: (e) => { e.stopPropagation(); duplicateTemplate(row); } },
            { icon: 'FileText', label: 'Generate Quotation', onClick: (e) => { e.stopPropagation(); generateFromTemplate(row); } },
            { icon: 'Trash2', label: 'Delete', variant: 'danger' as const, onClick: (e) => { e.stopPropagation(); setDeleteTemplate(row); } },
          ]}
        />
      ),
    },
  ];

  const generateFromTemplate = (t: QuoteTemplate) => {
    const quotationData = {
      items: t.items.map((i) => ({ ...i })),
      discount: String(t.discount),
      discountType: t.discountType,
      taxRate: String(t.taxRate),
      notes: t.notes,
      templateName: t.name,
    };
    sessionStorage.setItem('generateQuotationFromTemplate', JSON.stringify(quotationData));
    window.location.href = '/quotations';
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Quote Templates"
        subtitle="Reusable templates for common service quotations"
        actions={<Button leftIcon={<Icon name="Plus" size={16} />} onClick={openCreate}>Create Template</Button>}
      />
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchBar placeholder="Search templates..." value={search} onChange={handleSearch} className={styles.search} />
          <Select
            options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filter}
          />
        </div>
        <Button leftIcon={<Icon name="Plus" size={16} />} onClick={openCreate}>Create Template</Button>
      </div>

      <div className={styles.tableCard}>
        <Table
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setPreviewTemplate(row)}
        />
      </div>

      <div className={styles.results}>{filtered.length} templates found</div>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title="Template Preview"
        size="xl"
        footer={
          previewTemplate && (
            <>
              <Button variant="ghost" onClick={() => setPreviewTemplate(null)}>Close</Button>
              <Button leftIcon={<Icon name="FileText" size={16} />} onClick={() => generateFromTemplate(previewTemplate)}>
                Generate Quotation
              </Button>
            </>
          )
        }
      >
        {previewTemplate && (
          <div className={styles.preview}>
            <div className={styles.previewHeader}>
              <div>
                <span className={styles.previewLabel}>Template</span>
                <h3 className={styles.previewName}>{previewTemplate.name}</h3>
              </div>
              <Badge variant="primary" size="sm">{previewTemplate.category}</Badge>
            </div>

            <div className={styles.previewMeta}>
              <div>
                <span className={styles.previewLabel}>Items</span>
                <span className={styles.previewValue}>{previewTemplate.items.length}</span>
              </div>
              <div>
                <span className={styles.previewLabel}>Discount</span>
                <span className={styles.previewValue}>
                  {previewTemplate.discountType === 'percentage'
                    ? `${previewTemplate.discount}%`
                    : formatCurrency(previewTemplate.discount)}
                </span>
              </div>
              <div>
                <span className={styles.previewLabel}>Tax Rate</span>
                <span className={styles.previewValue}>{previewTemplate.taxRate}%</span>
              </div>
            </div>

            <div className={styles.previewItems}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className={styles.numCol}>Qty</th>
                    <th className={styles.numCol}>Unit Price</th>
                    <th className={styles.numCol}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {previewTemplate.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.productName}</td>
                      <td className={styles.numCol}>{item.quantity}</td>
                      <td className={styles.numCol}>{formatCurrency(item.unitPrice)}</td>
                      <td className={styles.numCol}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.previewTotals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(templateTotal(previewTemplate) - calcTotals(previewTemplate.items, previewTemplate.discount, previewTemplate.discountType, previewTemplate.taxRate).tax)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Tax ({previewTemplate.taxRate}%)</span>
                <span>{formatCurrency(calcTotals(previewTemplate.items, previewTemplate.discount, previewTemplate.discountType, previewTemplate.taxRate).tax)}</span>
              </div>
              <div className={styles.grandTotal}>
                <span>Estimated Total</span>
                <span>{formatCurrency(templateTotal(previewTemplate))}</span>
              </div>
            </div>

            {previewTemplate.description && (
              <div className={styles.previewNotes}>
                <span className={styles.previewLabel}>Description</span>
                <p>{previewTemplate.description}</p>
              </div>
            )}

            {previewTemplate.notes && (
              <div className={styles.previewNotes}>
                <span className={styles.previewLabel}>Notes</span>
                <p>{previewTemplate.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditTemplate(null); }}
        title={editTemplate ? 'Edit Template' : 'Create Template'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setIsFormOpen(false); setEditTemplate(null); }}>Cancel</Button>
            <Button onClick={handleSave}>{editTemplate ? 'Save Changes' : 'Create Template'}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className={styles.formTop}>
            <Input
              label="Template Name"
              required
              placeholder="e.g. Off-Grid Solar System"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Select
              label="Category"
              options={categoryOptions}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of what this template covers..."
            rows={2}
          />

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
                      <Select
                        options={productOptions}
                        placeholder="Select product"
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      />
                    </div>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className={styles.itemQty}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className={styles.itemPrice}
                    />
                    <div className={styles.itemTotal}>{formatCurrency(item.total)}</div>
                    <button className={styles.removeItem} onClick={() => removeItem(index)}>
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
                <Select
                  label="Discount Type"
                  options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed Amount' }]}
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                />
                <Input
                  label="Discount"
                  type="number"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                />
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.summary}>
              <div className={styles.summaryRow}><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
              <div className={styles.summaryRow}><span>Discount</span><span>-{formatCurrency(totals.discountAmount)}</span></div>
              <div className={styles.summaryRow}><span>Tax ({form.taxRate || 0}%)</span><span>{formatCurrency(totals.tax)}</span></div>
              <div className={styles.summaryTotal}><span>Grand Total</span><span>{formatCurrency(totals.total)}</span></div>
            </div>
          </div>

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Default notes to include when generating quotations from this template..."
            rows={2}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTemplate}
        onClose={() => setDeleteTemplate(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Template"
        message={deleteTemplate ? `Are you sure you want to delete template "${deleteTemplate.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

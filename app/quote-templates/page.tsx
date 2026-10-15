"use client";

import React, { useState, useMemo, useCallback } from "react";
import styles from "./page.module.scss";
import SearchBar from "../../components/ui/SearchBar";
import SelectField from "../../components/forms/form_elements/select";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import RowActions from "../../components/ui/RowActions";
import QuoteTemplateForm from "../../components/forms/QuoteTemplateForm";
import { quoteTemplates as initialTemplates } from "../../data/quoteTemplates";
import { products } from "../../data/products";
import { QuoteTemplate, QuotationItem } from "../../types";
import { formatCurrency } from "../../lib/documentUtils";
import { QuoteTemplateFormData } from "../../schema/formSchema";
import { toast } from "sonner";

const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

const categoryOptions = [
  { value: "Solar Solutions", label: "Solar Solutions" },
  { value: "Electrical Installations", label: "Electrical Installations" },
  { value: "Plumbing Services", label: "Plumbing Services" },
  { value: "Borehole Solutions", label: "Borehole Solutions" },
  { value: "Irrigation Systems", label: "Irrigation Systems" },
];

function calcTotals(items: QuotationItem[], discount: number, discountType: "percentage" | "fixed", taxRate: number) {
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const discountAmount = discountType === "percentage" ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + tax;
  return { subtotal, discountAmount, tax, total };
}

export default function QuoteTemplatesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [templateList, setTemplateList] = useState<QuoteTemplate[]>(initialTemplates);
  const [previewTemplate, setPreviewTemplate] = useState<QuoteTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<QuoteTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<QuoteTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filtered = useMemo(() => {
    let data = [...templateList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
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
    setIsFormOpen(true);
  };

  const openEdit = (t: QuoteTemplate) => {
    setEditTemplate(t);
    setIsFormOpen(true);
  };

  const duplicateTemplate = (t: QuoteTemplate) => {
    const newT: QuoteTemplate = {
      ...t,
      id: `tmpl-${Date.now()}`,
      name: `${t.name} (Copy)`,
      createdAt: new Date().toISOString().split("T")[0],
      items: t.items.map((i) => ({ ...i })),
    };
    setTemplateList((prev) => [newT, ...prev]);
    toast.success("Template duplicated successfully");
  };

  const generateFromTemplate = (t: QuoteTemplate) => {
    const quotationData = {
      items: t.items.map((i) => ({ ...i })),
      discount: String(t.discount),
      discountType: t.discountType,
      taxRate: String(t.taxRate),
      notes: t.notes,
      templateName: t.name,
      quoteFor: t.name,
    };
    sessionStorage.setItem("generateQuotationFromTemplate", JSON.stringify(quotationData));
    window.location.href = "/quotations";
  };

  const onSubmit = (data: QuoteTemplateFormData) => {
    const tmplData: QuoteTemplate = {
      id: editTemplate?.id || `tmpl-${Date.now()}`,
      name: data.name,
      description: data.description,
      category: data.category,
      items: data.items,
      discount: parseFloat(data.discount) || 0,
      discountType: data.discountType,
      taxRate: parseFloat(data.taxRate) || 0,
      notes: data.notes,
      createdAt: editTemplate?.createdAt || new Date().toISOString().split("T")[0],
    };

    if (editTemplate) {
      setTemplateList((prev) => prev.map((t) => (t.id === editTemplate.id ? tmplData : t)));
    } else {
      setTemplateList((prev) => [tmplData, ...prev]);
    }
    setIsFormOpen(false);
    setEditTemplate(null);
    toast.success(editTemplate ? "Template updated successfully" : "Template created successfully");
  };

  const handleDeleteConfirm = () => {
    if (deleteTemplate) {
      setTemplateList((prev) => prev.filter((t) => t.id !== deleteTemplate.id));
      setDeleteTemplate(null);
      toast.success("Template deleted successfully");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Template Name",
      render: (row: QuoteTemplate) => (
        <div>
          <span className={styles.tmplName}>{row.name}</span>
          <div className={styles.tmplDesc}>{row.description}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row: QuoteTemplate) => <span className={styles.categoryTag}>{row.category}</span>,
    },
    {
      key: "items",
      header: "Items",
      align: "center" as const,
      render: (row: QuoteTemplate) => <span className={styles.itemsCount}>{row.items.length}</span>,
    },
    {
      key: "total",
      header: "Estimated Total",
      align: "right" as const,
      render: (row: QuoteTemplate) => <span className={styles.amount}>{formatCurrency(templateTotal(row))}</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row: QuoteTemplate) => <span className={styles.date}>{row.createdAt}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right" as const,
      render: (row: QuoteTemplate) => (
        <RowActions
          actions={[
            { icon: "Eye", label: "Preview", onClick: (e) => { e.stopPropagation(); setPreviewTemplate(row); } },
            { icon: "Pencil", label: "Edit", onClick: (e) => { e.stopPropagation(); openEdit(row); } },
            { icon: "Copy", label: "Duplicate", onClick: (e) => { e.stopPropagation(); duplicateTemplate(row); } },
            { icon: "FileText", label: "Generate Quotation", onClick: (e) => { e.stopPropagation(); generateFromTemplate(row); } },
            { icon: "Trash2", label: "Delete", variant: "danger" as const, onClick: (e) => { e.stopPropagation(); setDeleteTemplate(row); } },
          ]}
        />
      ),
    },
  ];

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
          <SelectField
            options={[{ value: "", label: "All Categories" }, ...categoryOptions]}
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
                  {previewTemplate.discountType === "percentage"
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
        title={editTemplate ? "Edit Template" : "Create Template"}
        size="xl"
      >
        <QuoteTemplateForm
          mode={editTemplate ? "edit" : "create"}
          initialValues={editTemplate}
          onSubmit={onSubmit}
          onCancel={() => { setIsFormOpen(false); setEditTemplate(null); }}
          productOptions={productOptions}
          products={products}
          categoryOptions={categoryOptions}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTemplate}
        onClose={() => setDeleteTemplate(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Template"
        message={deleteTemplate ? `Are you sure you want to delete template "${deleteTemplate.name}"? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

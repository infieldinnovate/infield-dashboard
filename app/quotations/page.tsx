"use client";

import React, { useState, useMemo, useCallback } from "react";
import styles from "./page.module.scss";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import RowActions from "../../components/ui/RowActions";
import { quotations as initialQuotations } from "../../data/quotations";
import { customers } from "../../data/customers";
import { products } from "../../data/products";
import { Quotation, QuotationItem } from "../../types";
import {
  DocumentEngine,
  toDocumentConfig,
  printDocumentA4,
  downloadDocumentPDF,
  formatCurrency,
} from "../../components/DocumentEngine";
import { toast } from "sonner";

const statusVariant: Record<
  string,
  "primary" | "success" | "warning" | "error" | "secondary"
> = {
  draft: "secondary",
  sent: "primary",
  accepted: "success",
  rejected: "error",
  expired: "warning",
};

const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));
const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

interface FormState {
  customerId: string;
  items: QuotationItem[];
  discount: string;
  discountType: "percentage" | "fixed";
  taxRate: string;
  validUntil: string;
  notes: string;
}

const emptyForm: FormState = {
  customerId: "",
  items: [],
  discount: "0",
  discountType: "percentage",
  taxRate: "10",
  validUntil: "",
  notes: "",
};

function calcTotals(
  items: QuotationItem[],
  discount: number,
  discountType: "percentage" | "fixed",
  taxRate: number,
) {
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const discountAmount =
    discountType === "percentage" ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + tax;
  return { subtotal, discountAmount, tax, total };
}

export default function QuotationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [quotationList, setQuotationList] =
    useState<Quotation[]>(initialQuotations);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(
    null,
  );
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  const [deleteQuotation, setDeleteQuotation] = useState<Quotation | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  React.useEffect(() => {
    const pending = sessionStorage.getItem("generateQuotationFromTemplate");
    if (pending) {
      sessionStorage.removeItem("generateQuotationFromTemplate");
      try {
        const data = JSON.parse(pending);
        setEditQuotation(null);
        setForm({
          customerId: "",
          items: data.items || [],
          discount: data.discount || "0",
          discountType: data.discountType || "percentage",
          taxRate: data.taxRate || "16",
          validUntil: new Date(Date.now() + 14 * 86400000)
            .toISOString()
            .split("T")[0],
          notes: data.notes || "",
        });
        setIsFormOpen(true);
        toast.info(
          `Creating quotation from template: ${data.templateName || ""}`,
        );
      } catch {
        toast.error("Failed to load template data");
      }
    }
  }, []);

  const filtered = useMemo(() => {
    let data = [...quotationList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (qt) =>
          qt.id.toLowerCase().includes(q) ||
          qt.customerName.toLowerCase().includes(q),
      );
    }
    if (statusFilter) {
      data = data.filter((qt) => qt.status === statusFilter);
    }
    return data;
  }, [quotationList, search, statusFilter]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const openCreate = () => {
    setEditQuotation(null);
    setForm({
      ...emptyForm,
      validUntil: new Date(Date.now() + 14 * 86400000)
        .toISOString()
        .split("T")[0],
    });
    setIsFormOpen(true);
  };

  const openEdit = (qt: Quotation) => {
    setEditQuotation(qt);
    setForm({
      customerId: qt.customerId,
      items: qt.items.map((i) => ({ ...i })),
      discount: String(qt.discount),
      discountType: qt.discountType,
      taxRate: String(qt.taxRate),
      validUntil: qt.validUntil,
      notes: qt.notes,
    });
    setIsFormOpen(true);
  };

  const duplicateQuotation = (qt: Quotation) => {
    const newQt: Quotation = {
      ...qt,
      id: `qt-${Date.now()}`,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 14 * 86400000)
        .toISOString()
        .split("T")[0],
    };
    setQuotationList((prev) => [newQt, ...prev]);
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { productId: "", productName: "", quantity: 1, unitPrice: 0, total: 0 },
      ],
    }));
  };

  const updateItem = (
    index: number,
    field: keyof QuotationItem,
    value: string | number,
  ) => {
    setForm((prev) => {
      const items = [...prev.items];
      const item = { ...items[index] };
      if (field === "productId") {
        const product = products.find((p) => p.id === value);
        item.productId = value as string;
        item.productName = product?.name || "";
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
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const totals = useMemo(() => {
    return calcTotals(
      form.items,
      parseFloat(form.discount) || 0,
      form.discountType,
      parseFloat(form.taxRate) || 0,
    );
  }, [form]);

  const handleSave = () => {
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer || form.items.length === 0) return;

    const qtData: Quotation = {
      id: editQuotation?.id || `qt-${Date.now()}`,
      customerId: form.customerId,
      customerName: customer.name,
      items: form.items,
      subtotal: totals.subtotal,
      discount: parseFloat(form.discount) || 0,
      discountType: form.discountType,
      tax: totals.tax,
      taxRate: parseFloat(form.taxRate) || 0,
      total: totals.total,
      status: editQuotation?.status || "draft",
      validUntil: form.validUntil,
      createdAt:
        editQuotation?.createdAt || new Date().toISOString().split("T")[0],
      notes: form.notes,
    };

    if (editQuotation) {
      setQuotationList((prev) =>
        prev.map((q) => (q.id === editQuotation.id ? qtData : q)),
      );
    } else {
      setQuotationList((prev) => [qtData, ...prev]);
    }
    setIsFormOpen(false);
    setForm(emptyForm);
    setEditQuotation(null);
    toast.success(
      editQuotation
        ? "Quotation updated successfully"
        : "Quotation created successfully",
    );
  };

  const handleDeleteConfirm = () => {
    if (deleteQuotation) {
      setQuotationList((prev) =>
        prev.filter((q) => q.id !== deleteQuotation.id),
      );
      setDeleteQuotation(null);
      toast.success("Quotation deleted successfully");
    }
  };

  const columns = [
    {
      key: "id",
      header: "Quotation #",
      render: (row: Quotation) => (
        <span className={styles.qtId}>{row.id.toUpperCase()}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (row: Quotation) => (
        <span className={styles.customerName}>{row.customerName}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row: Quotation) => (
        <span className={styles.date}>{row.createdAt}</span>
      ),
    },
    {
      key: "validUntil",
      header: "Valid Until",
      render: (row: Quotation) => (
        <span className={styles.date}>{row.validUntil}</span>
      ),
    },
    {
      key: "total",
      header: "Amount",
      align: "right" as const,
      render: (row: Quotation) => (
        <span className={styles.amount}>{formatCurrency(row.total)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center" as const,
      render: (row: Quotation) => (
        <Badge variant={statusVariant[row.status]} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right" as const,
      render: (row: Quotation) => (
        <RowActions
          actions={[
            {
              icon: "Eye",
              label: "Preview",
              onClick: (e) => {
                e.stopPropagation();
                setPreviewQuotation(row);
              },
            },
            {
              icon: "Printer",
              label: "Print",
              onClick: (e) => {
                e.stopPropagation();
                printDocumentA4(toDocumentConfig(row));
              },
            },
            {
              icon: "Download",
              label: "Download PDF",
              onClick: (e) => {
                e.stopPropagation();
                downloadDocumentPDF(toDocumentConfig(row));
              },
            },
            {
              icon: "Pencil",
              label: "Edit",
              onClick: (e) => {
                e.stopPropagation();
                openEdit(row);
              },
            },
            {
              icon: "Copy",
              label: "Duplicate",
              onClick: (e) => {
                e.stopPropagation();
                duplicateQuotation(row);
              },
            },
            {
              icon: "Trash2",
              label: "Delete",
              variant: "danger",
              onClick: (e) => {
                e.stopPropagation();
                setDeleteQuotation(row);
              },
            },
          ]}
        />
      ),
    },
  ];

  const statusFilterOptions = [
    { value: "", label: "All Statuses" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
    { value: "expired", label: "Expired" },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Quotations"
        subtitle="Create price quotes for customers"
        actions={
          <Button
            leftIcon={<Icon name="Plus" size={16} />}
            onClick={openCreate}
          >
            Create Quotation
          </Button>
        }
      />
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchBar
            placeholder="Search quotations..."
            value={search}
            onChange={handleSearch}
            className={styles.search}
          />
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filter}
          />
        </div>
        <Button leftIcon={<Icon name="Plus" size={16} />} onClick={openCreate}>
          Create Quotation
        </Button>
      </div>

      <div className={styles.tableCard}>
        <Table
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setPreviewQuotation(row)}
        />
      </div>

      <div className={styles.results}>{filtered.length} quotations found</div>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewQuotation}
        onClose={() => setPreviewQuotation(null)}
        title="Quotation Preview"
        size="xl"
      >
        {previewQuotation && (
          <DocumentEngine
            document={previewQuotation}
            actions={{
              onEdit: () => {
                const q = previewQuotation;
                setPreviewQuotation(null);
                openEdit(q);
              },
              onDuplicate: () => {
                const q = previewQuotation;
                setPreviewQuotation(null);
                duplicateQuotation(q);
              },
              onDelete: () => {
                const q = previewQuotation;
                setPreviewQuotation(null);
                setDeleteQuotation(q);
              },
            }}
          />
        )}
      </Modal>

      {/* Create/Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditQuotation(null);
        }}
        title={editQuotation ? "Edit Quotation" : "Create Quotation"}
        size="xl"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsFormOpen(false);
                setEditQuotation(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editQuotation ? "Save Changes" : "Create Quotation"}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className={styles.formTop}>
            <Select
              label="Customer"
              required
              options={customerOptions}
              placeholder="Select customer"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            />
            <Input
              label="Valid Until"
              type="date"
              required
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
            />
          </div>

          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h4 className={styles.sectionTitle}>Items</h4>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Icon name="Plus" size={14} />}
                onClick={addItem}
              >
                Add Item
              </Button>
            </div>
            {form.items.length === 0 ? (
              <div className={styles.emptyItems}>
                <Icon name="Package" size={24} />
                <p>
                  No items added yet. Click &quot;Add Item&quot; to get started.
                </p>
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
                        onChange={(e) =>
                          updateItem(index, "productId", e.target.value)
                        }
                      />
                    </div>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className={styles.itemQty}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unitPrice",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className={styles.itemPrice}
                    />
                    <div className={styles.itemTotal}>
                      {formatCurrency(item.total)}
                    </div>
                    <button
                      className={styles.removeItem}
                      onClick={() => removeItem(index)}
                    >
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
                  options={[
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "fixed", label: "Fixed Amount" },
                  ]}
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discountType: e.target.value as "percentage" | "fixed",
                    })
                  }
                />
                <Input
                  label="Discount"
                  type="number"
                  value={form.discount}
                  onChange={(e) =>
                    setForm({ ...form, discount: e.target.value })
                  }
                />
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  value={form.taxRate}
                  onChange={(e) =>
                    setForm({ ...form, taxRate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Discount</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Tax ({form.taxRate || 0}%)</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Grand Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Add any notes for the customer..."
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteQuotation}
        onClose={() => setDeleteQuotation(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quotation"
        message={
          deleteQuotation
            ? `Are you sure you want to delete quotation "${deleteQuotation.id.toUpperCase()}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

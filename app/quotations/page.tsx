"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./page.module.scss";
import SearchBar from "../../components/ui/SearchBar";
import SelectField from "../../components/forms/form_elements/select";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import InputField from "../../components/forms/form_elements/input";
import TextareaField from "../../components/forms/form_elements/textarea";
import Icon from "../../components/ui/Icon";
import PageHeader from "../../components/ui/PageHeader";
import RowActions from "../../components/ui/RowActions";
import { quotations as initialQuotations } from "../../data/quotations";
import { customers } from "../../data/customers";
import { products } from "../../data/products";
import { Quotation, QuotationItem } from "../../types";
import QuotationDocument, { printQuotation, downloadQuotationPDF } from "../../components/QuotationDocument";
import { formatCurrency } from "../../lib/documentUtils";
import { quotationFormSchema, QuotationFormData } from "../../schema/formSchema";
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

const discountTypeOptions = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount" },
];

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

function getDefaultValues(): QuotationFormData {
  return {
    customerId: "",
    items: [],
    discount: "0",
    discountType: "percentage",
    taxRate: "16",
    validUntil: new Date(Date.now() + 14 * 86400000)
      .toISOString()
      .split("T")[0],
    notes: "",
  };
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

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: getDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedDiscount = watch("discount");
  const watchedDiscountType = watch("discountType");
  const watchedTaxRate = watch("taxRate");

  React.useEffect(() => {
    const pending = sessionStorage.getItem("generateQuotationFromTemplate");
    if (pending) {
      sessionStorage.removeItem("generateQuotationFromTemplate");
      try {
        const data = JSON.parse(pending);
        setEditQuotation(null);
        reset({
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
  }, [reset]);

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

  const totals = useMemo(() => {
    const items = (watchedItems || []) as QuotationItem[];
    return calcTotals(
      items,
      parseFloat(watchedDiscount) || 0,
      (watchedDiscountType ?? "percentage") as "percentage" | "fixed",
      parseFloat(watchedTaxRate) || 0,
    );
  }, [watchedItems, watchedDiscount, watchedDiscountType, watchedTaxRate]);

  const openCreate = () => {
    setEditQuotation(null);
    reset(getDefaultValues());
    setIsFormOpen(true);
  };

  const openEdit = (qt: Quotation) => {
    setEditQuotation(qt);
    reset({
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
    append({ productId: "", productName: "", quantity: 1, unitPrice: 0, total: 0 });
  };

  const onProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setValue(`items.${index}.productName`, product?.name || "");
    const unitPrice = product?.price || 0;
    setValue(`items.${index}.unitPrice`, unitPrice);
    const qty = watchedItems?.[index]?.quantity ?? 0;
    setValue(`items.${index}.total`, unitPrice * qty);
  };

  const onQtyChange = (index: number, rawValue: string) => {
    const qty = parseInt(rawValue) || 0;
    const price = watchedItems?.[index]?.unitPrice ?? 0;
    setValue(`items.${index}.total`, qty * price);
    return qty;
  };

  const onPriceChange = (index: number, rawValue: string) => {
    const price = parseFloat(rawValue) || 0;
    const qty = watchedItems?.[index]?.quantity ?? 0;
    setValue(`items.${index}.total`, qty * price);
    return price;
  };

  const onSubmit = (data: QuotationFormData) => {
    const customer = customers.find((c) => c.id === data.customerId);
    if (!customer) return;

    const qtData: Quotation = {
      id: editQuotation?.id || `qt-${Date.now()}`,
      customerId: data.customerId,
      customerName: customer.name,
      items: data.items,
      subtotal: totals.subtotal,
      discount: parseFloat(data.discount) || 0,
      discountType: data.discountType,
      tax: totals.tax,
      taxRate: parseFloat(data.taxRate) || 0,
      total: totals.total,
      status: editQuotation?.status || "draft",
      validUntil: data.validUntil,
      createdAt:
        editQuotation?.createdAt || new Date().toISOString().split("T")[0],
      notes: data.notes,
    };

    if (editQuotation) {
      setQuotationList((prev) =>
        prev.map((q) => (q.id === editQuotation.id ? qtData : q)),
      );
    } else {
      setQuotationList((prev) => [qtData, ...prev]);
    }
    setIsFormOpen(false);
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
                printQuotation(row);
              },
            },
            {
              icon: "Download",
              label: "Download PDF",
              onClick: (e) => {
                e.stopPropagation();
                downloadQuotationPDF(row);
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
          <SelectField
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
          <QuotationDocument
            quotation={previewQuotation}
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
            <Button onClick={handleSubmit(onSubmit)}>
              {editQuotation ? "Save Changes" : "Create Quotation"}
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          <div className={styles.formTop}>
            <SelectField
              label="Customer"
              required
              options={customerOptions}
              placeholder="Select customer"
              register={register}
              name="customerId"
              error={errors.customerId ?? null}
            />
            <InputField
              label="Valid Until"
              type="date"
              required
              register={register}
              name="validUntil"
              error={errors.validUntil ?? null}
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
            {errors.items?.message && (
              <p style={{ color: "var(--color-error, #dc2626)", fontSize: "0.875rem", margin: "0 0 0.5rem 0" }}>{String(errors.items.message)}</p>
            )}
            {fields.length === 0 ? (
              <div className={styles.emptyItems}>
                <Icon name="Package" size={24} />
                <p>
                  No items added yet. Click &quot;Add Item&quot; to get started.
                </p>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {fields.map((item, index) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemProduct}>
                      <Controller
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field, fieldState }) => (
                          <SelectField
                            options={productOptions}
                            placeholder="Select product"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              onProductChange(index, e.target.value);
                            }}
                            error={fieldState.error ?? null}
                          />
                        )}
                      />
                    </div>
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      render={({ field, fieldState }) => (
                        <InputField
                          type="number"
                          placeholder="Qty"
                          value={field.value}
                          onChange={(e) => field.onChange(onQtyChange(index, e.target.value))}
                          error={fieldState.error ?? null}
                          className={styles.itemQty}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name={`items.${index}.unitPrice`}
                      render={({ field, fieldState }) => (
                        <InputField
                          type="number"
                          placeholder="Price"
                          value={field.value}
                          onChange={(e) => field.onChange(onPriceChange(index, e.target.value))}
                          error={fieldState.error ?? null}
                          className={styles.itemPrice}
                        />
                      )}
                    />
                    <div className={styles.itemTotal}>
                      {formatCurrency(watchedItems?.[index]?.total ?? 0)}
                    </div>
                    <button
                      className={styles.removeItem}
                      onClick={() => remove(index)}
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
                <SelectField
                  label="Discount Type"
                  options={discountTypeOptions}
                  register={register}
                  name="discountType"
                  error={errors.discountType ?? null}
                />
                <InputField
                  label="Discount"
                  type="number"
                  register={register}
                  name="discount"
                  error={errors.discount ?? null}
                />
                <InputField
                  label="Tax Rate (%)"
                  type="number"
                  register={register}
                  name="taxRate"
                  error={errors.taxRate ?? null}
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
                <span>Tax ({watchedTaxRate || 0}%)</span>
                <span>{formatCurrency(totals.tax)}</span>
              </div>
              <div className={styles.summaryTotal}>
                <span>Grand Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          <TextareaField
            label="Notes"
            register={register}
            name="notes"
            error={errors.notes ?? null}
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

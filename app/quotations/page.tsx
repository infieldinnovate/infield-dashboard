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
import QuotationForm from "../../components/forms/QuotationForm";
import { quotations as initialQuotations } from "../../data/quotations";
import { customers } from "../../data/customers";
import { products } from "../../data/products";
import { Quotation } from "../../types";
import QuotationDocument, {
  printQuotation,
  downloadQuotationPDF,
} from "../../components/QuotationDocument";
import { formatCurrency } from "../../lib/documentUtils";
import { QuotationFormData } from "../../schema/formSchema";
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
  const [prefillData, setPrefillData] = useState<QuotationFormData | null>(null);

  React.useEffect(() => {
    const pending = sessionStorage.getItem("generateQuotationFromTemplate");
    if (pending) {
      sessionStorage.removeItem("generateQuotationFromTemplate");
      try {
        const data = JSON.parse(pending);
        setEditQuotation(null);
        setPrefillData({
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
    setPrefillData(null);
    setIsFormOpen(true);
  };

  const openEdit = (qt: Quotation) => {
    setEditQuotation(qt);
    setPrefillData(null);
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

  const onSubmit = (data: QuotationFormData) => {
    const customer = customers.find((c) => c.id === data.customerId);
    if (!customer) return;

    const items = data.items;
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const discountAmount =
      data.discountType === "percentage"
        ? (subtotal * (parseFloat(data.discount) || 0)) / 100
        : parseFloat(data.discount) || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxRate = parseFloat(data.taxRate) || 0;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + tax;

    const qtData: Quotation = {
      id: editQuotation?.id || `qt-${Date.now()}`,
      customerId: data.customerId,
      customerName: customer.name,
      items,
      subtotal,
      discount: parseFloat(data.discount) || 0,
      discountType: data.discountType,
      tax,
      taxRate,
      total,
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
    setPrefillData(null);
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
          setPrefillData(null);
        }}
        title={editQuotation ? "Edit Quotation" : "Create Quotation"}
        size="xl"
      >
        <QuotationForm
          mode={editQuotation ? "edit" : "create"}
          initialValues={editQuotation}
          prefillData={prefillData}
          onSubmit={onSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditQuotation(null);
            setPrefillData(null);
          }}
          customerOptions={customerOptions}
          productOptions={productOptions}
          products={products}
        />
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

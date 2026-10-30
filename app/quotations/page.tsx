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
import CustomerForm from "../../components/forms/CustomerForm";
import { quotations as initialQuotations } from "../../data/quotations";
import { customers as initialCustomers } from "../../data/customers";
import { products } from "../../data/products";
import { Customer, Quotation } from "../../types";
import { CustomerFormData } from "../../schema/formSchema";
import QuotationDocument, {
  printQuotation,
} from "../../components/QuotationDocument";
import PdfPreviewModal from "../../components/PdfPreviewModal";
import { formatCurrency, calcQuotationTotals } from "../../lib/documentUtils";
import { generateCode } from "../../lib/generateCode";
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

const productOptions = products.map((p) => ({ value: p.id, label: `${p.productName} (${p.size})` }));

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
  const [customerList, setCustomerList] = useState<Customer[]>(initialCustomers);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);
  const [pdfPreviewQuotation, setPdfPreviewQuotation] = useState<Quotation | null>(null);

  const customerOptions = useMemo(
    () => customerList.map((c) => ({ value: c.id, label: c.name })),
    [customerList],
  );

  React.useEffect(() => {
    const pending = sessionStorage.getItem("generateQuotationFromTemplate");
    if (pending) {
      sessionStorage.removeItem("generateQuotationFromTemplate");
      try {
        const data = JSON.parse(pending);
        setEditQuotation(null);
        setPrefillData({
          customerId: "",
          customerAddress: "",
          customerContact: "",
          quoteFor: data.quoteFor,
          items: data.items,
          taxRate: data.taxRate,
          notes: data.notes,
        });
        setIsFormOpen(true);
        toast.info(
          `Creating quotation from template: ${data.templateName}`,
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
          qt.quotationCode.toLowerCase().includes(q) ||
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
    setEditQuotation(null);
    setPrefillData({
      customerId: qt.customerId,
      customerAddress: qt.customerAddress,
      customerContact: qt.customerContact,
      quoteFor: qt.quoteFor,
      items: qt.items.map((i) => ({ ...i })),
      taxRate: String(qt.taxRate),
      notes: qt.notes,
    });
    setIsFormOpen(true);
    toast.info("Quotation details loaded — review and save to create a new quote");
  };

  const onSubmit = (data: QuotationFormData) => {
    const customer = customerList.find((c) => c.id === data.customerId);
    if (!customer) return;

    const items = data.items;
    const parsedTaxRate = parseFloat(data.taxRate);
    const taxRate = Number.isNaN(parsedTaxRate) ? 0 : parsedTaxRate;
    const { subtotal, tax, total } = calcQuotationTotals(items, taxRate);

    const existingCodes = new Set(quotationList.map((q) => q.quotationCode));
    const qCode = editQuotation ? editQuotation.quotationCode : generateCode(5, { type: "alphanumeric", existing: existingCodes });

    const qtData: Quotation = {
      id: editQuotation ? editQuotation.id : generateCode(6),
      customerId: data.customerId,
      customerName: customer.name,
      customerAddress: data.customerAddress,
      customerContact: data.customerContact,
      quoteFor: data.quoteFor,
      quotationCode: qCode,
      createdBy: editQuotation ? editQuotation.createdBy : "",
      createdBySignature: editQuotation ? editQuotation.createdBySignature : "",
      userId: editQuotation ? editQuotation.userId : "",
      items,
      taxRate,
      status: editQuotation ? editQuotation.status : "draft",
      createdAt:
        editQuotation ? editQuotation.createdAt : new Date().toISOString().split("T")[0],
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
      key: "quotationCode",
      header: "Code",
      render: (row: Quotation) => (
        <span className={styles.qtId}>{row.quotationCode}</span>
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
      key: "total",
      header: "Amount",
      align: "right" as const,
      render: (row: Quotation) => (
        <span className={styles.amount}>{formatCurrency(calcQuotationTotals(row.items, row.taxRate).total)}</span>
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
                void printQuotation(row);
              },
            },
            {
              icon: "Download",
              label: "Download PDF",
              onClick: (e) => {
                e.stopPropagation();
                setPdfPreviewQuotation(row);
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
          onCreateCustomer={() => setIsCustomerFormOpen(true)}
          createdCustomer={createdCustomer}
          productOptions={productOptions}
          products={products}
          customers={customerList}
        />
      </Modal>

      {/* Nested Create Customer Modal */}
      <Modal
        isOpen={isCustomerFormOpen}
        onClose={() => setIsCustomerFormOpen(false)}
        title="Add New Customer"
        size="lg"
        zIndex={200}
      >
        <CustomerForm
          mode="add"
          onSubmit={(data: CustomerFormData) => {
            const parsedCreditLimit = parseFloat(data.creditLimit);
            const newCustomer: Customer = {
              id: generateCode(6, { prefix: "cust" }),
              name: data.name,
              email: data.email,
              phone: data.phone,
              address: data.address,
              city: data.city,
              country: data.country,
              taxId: data.taxId,
              creditLimit: Number.isNaN(parsedCreditLimit) ? 0 : parsedCreditLimit,
              balance: 0,
              status: data.status,
              createdAt: new Date().toISOString().split("T")[0],
              type: data.type,
            };
            setCustomerList((prev) => [...prev, newCustomer]);
            setCreatedCustomer(newCustomer);
            setIsCustomerFormOpen(false);
            toast.success("Customer created successfully");
          }}
          onCancel={() => setIsCustomerFormOpen(false)}
        />
      </Modal>

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        quotation={pdfPreviewQuotation}
        onClose={() => setPdfPreviewQuotation(null)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteQuotation}
        onClose={() => setDeleteQuotation(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quotation"
        message={
          deleteQuotation
            ? `Are you sure you want to delete quotation "${deleteQuotation.quotationCode}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Icon from '../../components/ui/Icon';
import PageHeader from '../../components/ui/PageHeader';
import RowActions from '../../components/ui/RowActions';
import { receipts as initialReceipts } from '../../data/receipts';
import { invoices } from '../../data/invoices';
import { Receipt } from '../../types';
import { DocumentEngine, toDocumentConfig, printDocumentA4, printDocumentThermal57, downloadDocumentPDF } from '../../components/DocumentEngine';
import { toast } from 'sonner';

const paymentMethodIcon: Record<string, string> = {
  cash: 'Banknote',
  card: 'CreditCard',
  bank_transfer: 'Building2',
  check: 'FileCheck',
  mobile_money: 'Smartphone',
};

const paymentMethodLabel: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  check: 'Check',
  mobile_money: 'Mobile Money',
};

export default function ReceiptsPage() {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [receiptList, setReceiptList] = useState<Receipt[]>(initialReceipts);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [deleteReceipt, setDeleteReceipt] = useState<Receipt | null>(null);

  const filtered = useMemo(() => {
    let data = [...receiptList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.receiptNumber.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q)
      );
    }
    if (paymentFilter) {
      data = data.filter((r) => r.paymentMethod === paymentFilter);
    }
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [receiptList, search, paymentFilter]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const summaryStats = useMemo(() => {
    const totalAmount = receiptList.reduce((sum, r) => sum + r.amount, 0);
    const byMethod = receiptList.reduce(
      (acc, r) => {
        acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + r.amount;
        return acc;
      },
      {} as Record<string, number>
    );
    return { totalAmount, byMethod, totalCount: receiptList.length };
  }, [receiptList]);

  const getInvoiceNumber = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    return invoice?.invoiceNumber || invoiceId;
  };

  const duplicateReceipt = (r: Receipt) => {
    toast.info('Duplicate functionality - load into create form');
  };

  const handleDeleteConfirm = () => {
    if (deleteReceipt) {
      setReceiptList((prev) => prev.filter((rec) => rec.id !== deleteReceipt.id));
      setDeleteReceipt(null);
      toast.success('Receipt deleted successfully');
    }
  };

  const columns = [
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      render: (row: Receipt) => <span className={styles.receiptId}>{row.receiptNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row: Receipt) => <span className={styles.customerName}>{row.customerName}</span>,
    },
    {
      key: 'invoiceId',
      header: 'Invoice',
      render: (row: Receipt) => (
        <span className={styles.invoiceRef}>
          <Icon name="FileSpreadsheet" size={14} />
          {getInvoiceNumber(row.invoiceId)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (row: Receipt) => <span className={styles.date}>{row.date}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right' as const,
      render: (row: Receipt) => (
        <span className={styles.amount}>${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      align: 'center' as const,
      render: (row: Receipt) => (
        <div className={styles.paymentMethod}>
          <Icon name={paymentMethodIcon[row.paymentMethod]} size={14} />
          <span>{paymentMethodLabel[row.paymentMethod]}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (row: Receipt) => (
        <RowActions actions={[
          { icon: 'Eye', label: 'Preview', onClick: (e) => { e.stopPropagation(); setPreviewReceipt(row); } },
          { icon: 'Receipt', label: 'Thermal Print (57mm)', onClick: (e) => { e.stopPropagation(); printDocumentThermal57(toDocumentConfig(row)); } },
          { icon: 'Printer', label: 'Print (A4)', onClick: (e) => { e.stopPropagation(); printDocumentA4(toDocumentConfig(row)); } },
          { icon: 'Download', label: 'Download PDF', onClick: (e) => { e.stopPropagation(); downloadDocumentPDF(toDocumentConfig(row)); } },
        ]} />
      ),
    },
  ];

  const paymentFilterOptions = [
    { value: '', label: 'All Payment Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'mobile_money', label: 'Mobile Money' },
  ];

  return (
    <div className={styles.page}>
      <PageHeader title="Receipts" subtitle="Record and track customer payments" />

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Collected</span>
          <span className={styles.statValue}>
            ${summaryStats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Cash</span>
          <span className={styles.statValue}>
            ${(summaryStats.byMethod['cash'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Card</span>
          <span className={styles.statValue}>
            ${(summaryStats.byMethod['card'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Bank Transfer</span>
          <span className={styles.statValue}>
            ${(summaryStats.byMethod['bank_transfer'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Mobile Money</span>
          <span className={styles.statValue}>
            ${(summaryStats.byMethod['mobile_money'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Check</span>
          <span className={styles.statValue}>
            ${(summaryStats.byMethod['check'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchBar placeholder="Search receipts..." value={search} onChange={handleSearch} className={styles.search} />
          <Select
            options={paymentFilterOptions}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className={styles.filter}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setPreviewReceipt(row)}
        />
      </div>

      <div className={styles.results}>{filtered.length} receipts found</div>

      {/* Preview Modal */}
      <Modal isOpen={!!previewReceipt} onClose={() => setPreviewReceipt(null)} title="Receipt Preview" size="xl">
        {previewReceipt && (
          <DocumentEngine
            document={previewReceipt}
            actions={{
              onEdit: () => { setPreviewReceipt(null); },
              onDuplicate: () => { const r = previewReceipt; setPreviewReceipt(null); duplicateReceipt(r); },
              onDelete: () => { const r = previewReceipt; setPreviewReceipt(null); setDeleteReceipt(r); },
            }}
            showThermal
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteReceipt}
        onClose={() => setDeleteReceipt(null)}
        title="Delete Receipt"
        footer={
          <>
            <button className={styles.actionBtn} onClick={() => setDeleteReceipt(null)}>Cancel</button>
            <button className={styles.actionBtn} onClick={handleDeleteConfirm}>Delete</button>
          </>
        }
      >
        {deleteReceipt && (
          <p>Are you sure you want to delete receipt "{deleteReceipt.receiptNumber}"? This action cannot be undone.</p>
        )}
      </Modal>

    </div>
  );
}

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './page.module.scss';
import SearchBar from '../../components/ui/SearchBar';
import SelectField from '../../components/forms/form_elements/select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Icon from '../../components/ui/Icon';
import RowActions from '../../components/ui/RowActions';
import PageHeader from '../../components/ui/PageHeader';
import CustomerForm from '../../components/forms/CustomerForm';
import { customers as initialCustomers } from '../../data/customers';
import { invoices } from '../../data/invoices';
import { receipts } from '../../data/receipts';
import { Customer, Invoice, Receipt } from '../../types';
import { CustomerFormData } from '../../schema/formSchema';
import { generatePrefixedId } from '../../lib/generateCode';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 5;

const sortOptions = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'balance-desc', label: 'Balance (High to Low)' },
  { value: 'balance-asc', label: 'Balance (Low to High)' },
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
];

const statusVariant: Record<string, 'success' | 'error'> = {
  active: 'success',
  inactive: 'error',
};

const invoiceStatusVariant: Record<string, 'success' | 'warning' | 'error' | 'primary'> = {
  paid: 'success',
  unpaid: 'warning',
  overdue: 'error',
  partial: 'primary',
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [customerList, setCustomerList] = useState<Customer[]>(initialCustomers);

  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filtered = useMemo(() => {
    let data = [...customerList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
    }
    const [field, dir] = sortBy.split('-') as [keyof Customer, string];
    data.sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (typeof av === 'number' && typeof bv === 'number') {
        return dir === 'asc' ? av - bv : bv - av;
      }
      return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return data;
  }, [customerList, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const customerInvoices: Invoice[] = detailCustomer ? invoices.filter((inv) => inv.customerId === detailCustomer.id) : [];
  const customerReceipts: Receipt[] = detailCustomer ? receipts.filter((r) => r.customerName === detailCustomer.name) : [];

  const openEdit = (customer: Customer) => {
    setEditCustomer(customer);
  };

  const openAdd = () => {
    setIsAddOpen(true);
  };

  const onEditSubmit = (data: CustomerFormData) => {
    if (!editCustomer) return;
    setCustomerList((prev) =>
      prev.map((c) =>
        c.id === editCustomer.id
          ? { ...c, name: data.name, email: data.email, phone: data.phone, address: data.address, city: data.city, country: data.country, taxId: data.taxId, creditLimit: parseFloat(data.creditLimit) || 0, type: data.type, status: data.status }
          : c
      )
    );
    setEditCustomer(null);
    toast.success('Customer updated successfully');
  };

  const onAddSubmit = (data: CustomerFormData) => {
    const newCustomer: Customer = {
      id: generatePrefixedId('cust'),
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      taxId: data.taxId,
      creditLimit: parseFloat(data.creditLimit) || 0,
      balance: 0,
      status: data.status,
      createdAt: new Date().toISOString().split('T')[0],
      type: data.type,
    };
    setCustomerList((prev) => [newCustomer, ...prev]);
    setIsAddOpen(false);
    toast.success('Customer added successfully');
  };

  const handleDeleteConfirm = () => {
    if (deleteCustomer) {
      setCustomerList((prev) => prev.filter((c) => c.id !== deleteCustomer.id));
      setDeleteCustomer(null);
      toast.success('Customer deleted successfully');
    }
  };

  const columns = [
    { key: 'name', header: 'Customer', render: (row: Customer) => (
      <div className={styles.customerCell}>
        <div className={styles.avatar}>{row.name.charAt(0)}</div>
        <div className={styles.customerInfo}>
          <span className={styles.customerName}>{row.name}</span>
          <span className={styles.customerEmail}>{row.email}</span>
        </div>
      </div>
    )},
    { key: 'type', header: 'Type', render: (row: Customer) => <Badge variant={row.type === 'business' ? 'primary' : 'secondary'} size="sm">{row.type}</Badge> },
    { key: 'city', header: 'Location', render: (row: Customer) => <span className={styles.location}>{row.city}, {row.country}</span> },
    { key: 'balance', header: 'Balance', align: 'right' as const, render: (row: Customer) => <span className={row.balance > 0 ? styles.balanceDue : styles.balanceClear}>${row.balance.toLocaleString()}</span> },
    { key: 'status', header: 'Status', align: 'center' as const, render: (row: Customer) => <Badge variant={statusVariant[row.status]} size="sm">{row.status}</Badge> },
    { key: 'actions', header: '', align: 'right' as const, render: (row: Customer) => (
      <RowActions actions={[
        { icon: 'Eye', label: 'View', onClick: (e) => { e.stopPropagation(); setDetailCustomer(row); } },
        { icon: 'Pencil', label: 'Edit', onClick: (e) => { e.stopPropagation(); openEdit(row); } },
        { icon: 'Trash2', label: 'Delete', variant: 'danger', onClick: (e) => { e.stopPropagation(); setDeleteCustomer(row); } },
      ]} />
    )},
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Customers"
        subtitle="Manage customer accounts and track balances"
        actions={<Button leftIcon={<Icon name="Plus" size={16} />} onClick={openAdd}>Add Customer</Button>}
      />
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchBar placeholder="Search customers..." value={search} onChange={handleSearch} className={styles.search} />
          <SelectField options={sortOptions} value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.filter} />
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={paginated} keyExtractor={(row) => row.id} onRowClick={(row) => setDetailCustomer(row)} />
      </div>

      <div className={styles.pagination}>
        <span className={styles.results}>{filtered.length} customers found</span>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detailCustomer} onClose={() => setDetailCustomer(null)} title="Customer Details" size="lg">
        {detailCustomer && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>{detailCustomer.name.charAt(0)}</div>
              <div className={styles.detailInfo}>
                <h3 className={styles.detailName}>{detailCustomer.name}</h3>
                <div className={styles.detailBadges}>
                  <Badge variant={detailCustomer.type === 'business' ? 'primary' : 'secondary'} size="sm">{detailCustomer.type}</Badge>
                  <Badge variant={statusVariant[detailCustomer.status]} size="sm">{detailCustomer.status}</Badge>
                </div>
              </div>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}><span className={styles.detailLabel}>Email</span><span>{detailCustomer.email}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Phone</span><span>{detailCustomer.phone}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Tax ID</span><span>{detailCustomer.taxId}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Address</span><span>{detailCustomer.address}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>City</span><span>{detailCustomer.city}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Country</span><span>{detailCustomer.country}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Credit Limit</span><span>${detailCustomer.creditLimit.toLocaleString()}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Balance</span><span className={detailCustomer.balance > 0 ? styles.balanceDue : styles.balanceClear}>${detailCustomer.balance.toLocaleString()}</span></div>
              <div className={styles.detailField}><span className={styles.detailLabel}>Customer Since</span><span>{detailCustomer.createdAt}</span></div>
            </div>

            <div className={styles.historySection}>
              <h4 className={styles.historyTitle}>Purchase History</h4>
              {customerInvoices.length === 0 ? (
                <p className={styles.emptyHistory}>No purchases found for this customer.</p>
              ) : (
                <div className={styles.historyTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td><span className={styles.invId}>{inv.invoiceNumber}</span></td>
                          <td>{inv.issueDate}</td>
                          <td className={styles.amount}>${inv.total.toLocaleString()}</td>
                          <td><Badge variant={invoiceStatusVariant[inv.status]} size="sm">{inv.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {customerReceipts.length > 0 && (
              <div className={styles.historySection}>
                <h4 className={styles.historyTitle}>Payment History</h4>
                <div className={styles.historyTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Receipt</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerReceipts.map((r) => (
                        <tr key={r.id}>
                          <td><span className={styles.invId}>{r.receiptNumber}</span></td>
                          <td>{r.date}</td>
                          <td className={styles.amount}>${r.amount.toLocaleString()}</td>
                          <td><Badge size="sm">{r.paymentMethod}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Customer" size="md">
        <CustomerForm mode="add" onSubmit={onAddSubmit} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editCustomer} onClose={() => setEditCustomer(null)} title="Edit Customer" size="md">
        <CustomerForm mode="edit" initialValues={editCustomer} onSubmit={onEditSubmit} onCancel={() => setEditCustomer(null)} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteCustomer}
        onClose={() => setDeleteCustomer(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={deleteCustomer ? `Are you sure you want to delete "${deleteCustomer.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

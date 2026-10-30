"use client";

import React, { useState, useMemo, useCallback } from "react";
import styles from "./page.module.scss";
import SearchBar from "../../components/ui/SearchBar";
import SelectField from "../../components/forms/form_elements/select";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Icon from "../../components/ui/Icon";
import RowActions from "../../components/ui/RowActions";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import LeadForm from "../../components/forms/LeadForm";
import { leads as initialLeads } from "../../data/leads";
import { Lead, LeadStatus } from "../../types";
import { LeadFormData } from "../../schema/formSchema";
import { generatePrefixedId } from "../../lib/generateCode";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 8;

const statusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const serviceOptions = [
  { value: "Solar", label: "Solar" },
  { value: "Electrical", label: "Electrical" },
  { value: "Boreholes", label: "Boreholes" },
  { value: "Irrigation", label: "Irrigation" },
  { value: "Plumbing", label: "Plumbing" },
  { value: "Other", label: "Other" },
];

const sortOptions = [
  { value: "created_at-desc", label: "Newest First" },
  { value: "created_at-asc", label: "Oldest First" },
  { value: "company_name-asc", label: "Company (A-Z)" },
  { value: "company_name-desc", label: "Company (Z-A)" },
  { value: "follow_up_date-asc", label: "Follow-up (Soonest)" },
];

const statusVariant: Record<
  LeadStatus,
  "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info"
> = {
  new: "info",
  contacted: "primary",
  interested: "secondary",
  quoted: "warning",
  won: "success",
  lost: "error",
};

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at-desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [leadList, setLeadList] = useState<Lead[]>(initialLeads);

  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filtered = useMemo(() => {
    let data = [...leadList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (l) =>
          l.company_name.toLowerCase().includes(q) ||
          l.contact_person.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q),
      );
    }
    if (statusFilter) data = data.filter((l) => l.status === statusFilter);
    if (serviceFilter)
      data = data.filter((l) => l.interested_service === serviceFilter);

    const [field, dir] = sortBy.split("-");
    data.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[field] as
        | string
        | null;
      const bv = (b as unknown as Record<string, unknown>)[field] as
        | string
        | null;
      if (av === null) return dir === "asc" ? 1 : -1;
      if (bv === null) return dir === "asc" ? -1 : 1;
      return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return data;
  }, [leadList, search, sortBy, statusFilter, serviceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const openAdd = () => {
    setIsAddOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditLead(lead);
  };

  const onAddSubmit = (data: LeadFormData) => {
    const now = new Date().toISOString();
    const newLead: Lead = {
      id: generatePrefixedId("lead"),
      ...data,
      last_contact_date: data.last_contact_date || null,
      follow_up_date: data.follow_up_date || null,
      created_at: now,
      updated_at: now,
    };
    setLeadList((prev) => [newLead, ...prev]);
    setIsAddOpen(false);
    toast.success("Lead added successfully");
  };

  const onEditSubmit = (data: LeadFormData) => {
    if (!editLead) return;
    setLeadList((prev) =>
      prev.map((l) =>
        l.id === editLead.id
          ? {
              ...l,
              ...data,
              last_contact_date: data.last_contact_date || null,
              follow_up_date: data.follow_up_date || null,
              updated_at: new Date().toISOString(),
            }
          : l,
      ),
    );
    setEditLead(null);
    toast.success("Lead updated successfully");
  };

  const handleDeleteConfirm = () => {
    if (!deleteLead) return;
    setLeadList((prev) => prev.filter((l) => l.id !== deleteLead.id));
    setDeleteLead(null);
    toast.success("Lead deleted successfully");
  };

  const stats = useMemo(() => {
    const total = leadList.length;
    const won = leadList.filter((l) => l.status === "won").length;
    const active = leadList.filter(
      (l) => !["won", "lost"].includes(l.status),
    ).length;
    const followUps = leadList.filter(
      (l) =>
        l.follow_up_date &&
        new Date(l.follow_up_date) >= new Date("2026-09-01"),
    ).length;
    return { total, won, active, followUps };
  }, [leadList]);

  const columns = [
    {
      key: "company_name",
      header: "Company",
      render: (row: Lead) => (
        <div className={styles.companyCell}>
          <div className={styles.avatar}>{row.company_name.charAt(0)}</div>
          <div className={styles.companyInfo}>
            <span className={styles.companyName}>{row.company_name}</span>
            <span className={styles.contactPerson}>
              {row.contact_person || "No contact"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "interested_service",
      header: "Service",
      render: (row: Lead) => <Badge size="sm">{row.interested_service}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      align: "center" as const,
      render: (row: Lead) => (
        <Badge variant={statusVariant[row.status]} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (row: Lead) => (
        <span className={styles.location}>{row.location || "—"}</span>
      ),
    },
    {
      key: "lead_source",
      header: "Source",
      render: (row: Lead) => (
        <span className={styles.source}>{row.lead_source || "—"}</span>
      ),
    },
    {
      key: "follow_up_date",
      header: "Follow-up",
      render: (row: Lead) =>
        row.follow_up_date ? (
          <span className={styles.followUp}>{row.follow_up_date}</span>
        ) : (
          <span className={styles.dash}>—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right" as const,
      render: (row: Lead) => (
        <RowActions
          actions={[
            {
              icon: "Eye",
              label: "View",
              onClick: (e) => {
                e.stopPropagation();
                setDetailLead(row);
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
              icon: "Trash2",
              label: "Delete",
              variant: "danger",
              onClick: (e) => {
                e.stopPropagation();
                setDeleteLead(row);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Lead Portfolios"
        subtitle="Track potential clients and manage your sales pipeline"
        actions={
          <Button
            leftIcon={<Icon name="Plus" size={16} />}
            onClick={openAdd}
          >
            Add Lead
          </Button>
        }
      />

      <div className={styles.statsGrid}>
        <StatCard
          title="Total Leads"
          value={String(stats.total)}
          change={0}
          icon="Users"
          iconColor="primary"
        />
        <StatCard
          title="Active Pipeline"
          value={String(stats.active)}
          change={0}
          icon="TrendingUp"
          iconColor="info"
        />
        <StatCard
          title="Won"
          value={String(stats.won)}
          change={0}
          icon="Trophy"
          iconColor="success"
        />
        <StatCard
          title="Upcoming Follow-ups"
          value={String(stats.followUps)}
          change={0}
          icon="CalendarClock"
          iconColor="warning"
        />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <SearchBar
            placeholder="Search leads..."
            value={search}
            onChange={handleSearch}
            className={styles.search}
          />
          <SelectField
            options={[{ value: "", label: "All Statuses" }, ...statusOptions]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filter}
          />
          <SelectField
            options={[{ value: "", label: "All Services" }, ...serviceOptions]}
            value={serviceFilter}
            onChange={(e) => {
              setServiceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.filter}
          />
          <SelectField
            options={sortOptions}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filter}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table
          columns={columns}
          data={paginated}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setDetailLead(row)}
          emptyText="No leads found. Add your first lead to get started."
        />
      </div>

      <div className={styles.pagination}>
        <span className={styles.results}>{filtered.length} leads found</span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailLead}
        onClose={() => setDetailLead(null)}
        title="Lead Details"
        size="lg"
      >
        {detailLead && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar}>
                {detailLead.company_name.charAt(0)}
              </div>
              <div className={styles.detailInfo}>
                <h3 className={styles.detailName}>{detailLead.company_name}</h3>
                <div className={styles.detailBadges}>
                  <Badge variant={statusVariant[detailLead.status]} size="sm">
                    {detailLead.status}
                  </Badge>
                  <Badge size="sm">{detailLead.interested_service}</Badge>
                  {detailLead.marketing_consent && (
                    <Badge variant="success" size="sm">
                      Marketing OK
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Contact Person</span>
                <span>{detailLead.contact_person || "—"}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Phone / WhatsApp</span>
                <span>{detailLead.phone || "—"}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Email</span>
                <span>{detailLead.email || "—"}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Location</span>
                <span>{detailLead.location || "—"}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Interested Service</span>
                <span>{detailLead.interested_service}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Lead Source</span>
                <span>{detailLead.lead_source || "—"}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Last Contact</span>
                <span>{detailLead.last_contact_date || "—"}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Follow-up Date</span>
                <span>{detailLead.follow_up_date || "—"}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Marketing Consent</span>
                <span>
                  {detailLead.marketing_consent ? "Granted" : "Not granted"}
                </span>
              </div>
            </div>
            {detailLead.notes && (
              <div className={styles.notesSection}>
                <span className={styles.detailLabel}>Notes</span>
                <p className={styles.notesText}>{detailLead.notes}</p>
              </div>
            )}
            <div className={styles.detailFooter}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Icon name="Pencil" size={14} />}
                onClick={() => {
                  openEdit(detailLead);
                  setDetailLead(null);
                }}
              >
                Edit Lead
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Lead"
        size="lg"
      >
        <LeadForm mode="add" onSubmit={onAddSubmit} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editLead}
        onClose={() => setEditLead(null)}
        title="Edit Lead"
        size="lg"
      >
        <LeadForm mode="edit" initialValues={editLead} onSubmit={onEditSubmit} onCancel={() => setEditLead(null)} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteLead}
        onClose={() => setDeleteLead(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Lead"
        message={
          deleteLead
            ? `Are you sure you want to delete "${deleteLead.company_name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

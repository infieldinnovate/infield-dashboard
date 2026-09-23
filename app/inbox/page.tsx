'use client';

import React, { useState, useMemo } from 'react';
import styles from './page.module.scss';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { toast } from 'sonner';
import {
  quotationRequests as initialQR,
  callRequests as initialCR,
  reviews as initialRV,
  subscriptions as initialSUB,
  announcements as initialANN,
} from '../../data/inbox';
import type {
  QuotationRequest,
  CallRequest,
  Review,
  Subscription,
  Announcement,
  InboxPriority,
} from '../../types';

const tabs = [
  { id: 'quotation-requests', label: 'Quotation Requests', icon: 'FileText' },
  { id: 'call-requests', label: 'Call Requests', icon: 'PhoneCall' },
  { id: 'reviews', label: 'Reviews', icon: 'Star' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'CreditCard' },
  { id: 'announcements', label: 'Announcements', icon: 'Megaphone' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const priorityVariant: Record<InboxPriority, 'default' | 'primary' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'primary',
  high: 'warning',
  urgent: 'error',
};

const statusVariant: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'> = {
  new: 'info',
  in_review: 'primary',
  quoted: 'success',
  closed: 'default',
  pending: 'warning',
  scheduled: 'primary',
  completed: 'success',
  missed: 'error',
  published: 'success',
  flagged: 'error',
  draft: 'default',
  scheduled_ann: 'primary',
  archived: 'default',
  active: 'success',
  trialing: 'info',
  cancelled: 'error',
  expired: 'default',
};

function formatLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<TabId>('quotation-requests');

  const [quotationRequests, setQuotationRequests] = useState(initialQR);
  const [callRequests, setCallRequests] = useState(initialCR);
  const [reviews, setReviews] = useState(initialRV);
  const [subscriptions] = useState(initialSUB);
  const [announcements, setAnnouncements] = useState(initialANN);

  // Modal state
  const [selectedItem, setSelectedItem] = useState<{ type: TabId; data: Record<string, unknown> } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [archiveConfirm, setArchiveConfirm] = useState<{ type: TabId; id: string; name: string } | null>(null);

  const openModal = (type: TabId, data: Record<string, unknown>) => {
    setSelectedItem({ type, data });
    setReplyText('');
  };

  const closeModal = () => {
    setSelectedItem(null);
    setReplyText('');
  };

  const handleApprove = () => {
    if (!selectedItem) return;
    const id = selectedItem.data.id as string;
    if (selectedItem.type === 'reviews') {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'published' } : r)));
    }
    toast.success('Item approved successfully');
    closeModal();
  };

  const handleReject = () => {
    if (!selectedItem) return;
    const id = selectedItem.data.id as string;
    if (selectedItem.type === 'reviews') {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'flagged' } : r)));
    } else if (selectedItem.type === 'quotation-requests') {
      setQuotationRequests((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'closed' } : q)));
    } else if (selectedItem.type === 'call-requests') {
      setCallRequests((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'missed' } : c)));
    }
    toast.success('Item rejected');
    closeModal();
  };

  const handleReply = () => {
    if (!selectedItem || !replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }
    toast.success('Reply sent successfully');
    closeModal();
  };

  const handleArchive = () => {
    if (!archiveConfirm) return;
    const { type, id } = archiveConfirm;
    if (type === 'quotation-requests') {
      setQuotationRequests((prev) => prev.filter((q) => q.id !== id));
    } else if (type === 'call-requests') {
      setCallRequests((prev) => prev.filter((c) => c.id !== id));
    } else if (type === 'reviews') {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } else if (type === 'announcements') {
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'archived' as 'archived' } : a)));
    }
    toast.success('Item archived');
    setArchiveConfirm(null);
  };

  const modalTitle = useMemo(() => {
    if (!selectedItem) return '';
    switch (selectedItem.type) {
      case 'quotation-requests': return 'Quotation Request Details';
      case 'call-requests': return 'Call Request Details';
      case 'reviews': return 'Review Details';
      case 'subscriptions': return 'Subscription Details';
      case 'announcements': return 'Announcement Details';
      default: return 'Details';
    }
  }, [selectedItem]);

  const showActionButtons = (type: TabId) => {
    if (type === 'subscriptions') return false;
    return true;
  };

  return (
    <div className={styles.page}>
      {/* Stats row */}
      <div className={styles.statsRow}>
        <MiniStat icon="FileText" label="Quotation Requests" value={quotationRequests.length} color="primary" />
        <MiniStat icon="PhoneCall" label="Call Requests" value={callRequests.filter((c) => c.status === 'pending').length} color="info" suffix="pending" />
        <MiniStat icon="Star" label="Reviews" value={reviews.filter((r) => r.status === 'pending').length} color="warning" suffix="pending" />
        <MiniStat icon="CreditCard" label="Active Subscriptions" value={subscriptions.filter((s) => s.status === 'active').length} color="success" />
        <MiniStat icon="Megaphone" label="Announcements" value={announcements.filter((a) => a.status === 'published').length} color="secondary" suffix="published" />
      </div>

      {/* Tab navigation */}
      <div className={styles.tabBar}>
        {tabs.map((tab) => {
          const count = getCount(tab.id, quotationRequests, callRequests, reviews, subscriptions, announcements);
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>
                <Icon name={tab.icon} size={18} />
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
              {count > 0 && <span className={styles.tabBadge}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'quotation-requests' && (
        <QuotationRequestsSection
          data={quotationRequests}
          onItemClick={(q) => openModal('quotation-requests', q as unknown as Record<string, unknown>)}
        />
      )}
      {activeTab === 'call-requests' && (
        <CallRequestsSection
          data={callRequests}
          onItemClick={(c) => openModal('call-requests', c as unknown as Record<string, unknown>)}
        />
      )}
      {activeTab === 'reviews' && (
        <ReviewsSection
          data={reviews}
          onItemClick={(r) => openModal('reviews', r as unknown as Record<string, unknown>)}
        />
      )}
      {activeTab === 'subscriptions' && (
        <SubscriptionsSection
          data={subscriptions}
          onItemClick={(s) => openModal('subscriptions', s as unknown as Record<string, unknown>)}
        />
      )}
      {activeTab === 'announcements' && (
        <AnnouncementsSection
          data={announcements}
          onItemClick={(a) => openModal('announcements', a as unknown as Record<string, unknown>)}
        />
      )}

      {/* Reusable Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={closeModal}
        title={modalTitle}
        size="lg"
        footer={
          selectedItem && showActionButtons(selectedItem.type) ? (
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={closeModal}>Close</Button>
              <div className={styles.modalActionGroup}>
                <Button
                  variant="outline"
                  leftIcon={<Icon name="Archive" size={16} />}
                  onClick={() => {
                    if (selectedItem) {
                      setArchiveConfirm({
                        type: selectedItem.type,
                        id: selectedItem.data.id as string,
                        name: (selectedItem.data.title || selectedItem.data.subject || selectedItem.data.customerName || selectedItem.data.name) as string,
                      });
                      closeModal();
                    }
                  }}
                >
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  leftIcon={<Icon name="X" size={16} />}
                  onClick={handleReject}
                  className={styles.rejectBtn}
                >
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  leftIcon={<Icon name="Check" size={16} />}
                  onClick={handleApprove}
                  className={styles.approveBtn}
                >
                  Approve
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" onClick={closeModal}>Close</Button>
          )
        }
      >
        {selectedItem && (
          <div className={styles.modalContent}>
            <ModalContentRenderer item={selectedItem} replyText={replyText} setReplyText={setReplyText} onReply={handleReply} />
          </div>
        )}
      </Modal>

      {/* Archive Confirmation */}
      <ConfirmDialog
        isOpen={!!archiveConfirm}
        onClose={() => setArchiveConfirm(null)}
        onConfirm={handleArchive}
        title="Archive Item"
        message={archiveConfirm ? `Are you sure you want to archive "${archiveConfirm.name}"?` : ''}
        confirmLabel="Archive"
        variant="danger"
      />
    </div>
  );
}

function getCount(
  tabId: string,
  qr: QuotationRequest[],
  cr: CallRequest[],
  rv: Review[],
  sub: Subscription[],
  ann: Announcement[]
): number {
  switch (tabId) {
    case 'quotation-requests': return qr.filter((q) => q.status === 'new').length;
    case 'call-requests': return cr.filter((c) => c.status === 'pending').length;
    case 'reviews': return rv.filter((r) => r.status === 'pending').length;
    case 'subscriptions': return sub.filter((s) => s.status === 'trialing').length;
    case 'announcements': return ann.filter((a) => a.status === 'draft').length;
    default: return 0;
  }
}

function MiniStat({
  icon,
  label,
  value,
  color,
  suffix,
}: {
  icon: string;
  label: string;
  value: number;
  color: 'primary' | 'info' | 'warning' | 'success' | 'secondary';
  suffix?: string;
}) {
  return (
    <div className={styles.miniStat}>
      <span className={`${styles.miniStatIcon} ${styles[color]}`}>
        <Icon name={icon} size={20} />
      </span>
      <div className={styles.miniStatInfo}>
        <span className={styles.miniStatValue}>{value}</span>
        <span className={styles.miniStatLabel}>
          {label}
          {suffix && <span className={styles.miniStatSuffix}> {suffix}</span>}
        </span>
      </div>
    </div>
  );
}

/* ---------- Modal Content Renderer ---------- */
function ModalContentRenderer({
  item,
  replyText,
  setReplyText,
  onReply,
}: {
  item: { type: TabId; data: Record<string, unknown> };
  replyText: string;
  setReplyText: (v: string) => void;
  onReply: () => void;
}) {
  if (item.type === 'quotation-requests') {
    const q = item.data as unknown as QuotationRequest;
    return (
      <div className={styles.detailBody}>
        <DetailField label="Customer" value={q.customerName} />
        <DetailField label="Company" value={q.company} />
        <DetailField label="Contact" value={`${q.phone} | ${q.email}`} />
        <DetailField label="Subject" value={q.subject} />
        <DetailField label="Items Requested" value={q.items} />
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Estimated Value</span>
          <span className={styles.detailValue}>KSh {q.estimatedValue.toLocaleString()}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Priority</span>
          <Badge variant={priorityVariant[q.priority]} size="sm">{formatLabel(q.priority)}</Badge>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Status</span>
          <Badge variant={statusVariant[q.status]} size="sm">{formatLabel(q.status)}</Badge>
        </div>
        <DetailField label="Received" value={q.createdAt} />
        <div className={styles.detailMessage}>
          <span className={styles.detailLabel}>Message</span>
          <p>{q.message}</p>
        </div>
        <ReplySection replyText={replyText} setReplyText={setReplyText} onReply={onReply} />
      </div>
    );
  }

  if (item.type === 'call-requests') {
    const c = item.data as unknown as CallRequest;
    return (
      <div className={styles.detailBody}>
        <DetailField label="Customer" value={c.customerName} />
        <DetailField label="Phone" value={c.phone} />
        <DetailField label="Email" value={c.email} />
        <DetailField label="Reason for Call" value={c.reason} />
        <DetailField label="Preferred Time" value={c.preferredTime} />
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Priority</span>
          <Badge variant={priorityVariant[c.priority]} size="sm">{formatLabel(c.priority)}</Badge>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Status</span>
          <Badge variant={statusVariant[c.status]} size="sm">{formatLabel(c.status)}</Badge>
        </div>
        <DetailField label="Requested" value={c.createdAt} />
        <ReplySection replyText={replyText} setReplyText={setReplyText} onReply={onReply} placeholder="Add call notes or reply message..." />
      </div>
    );
  }

  if (item.type === 'reviews') {
    const r = item.data as unknown as Review;
    return (
      <div className={styles.detailBody}>
        <DetailField label="Customer" value={r.customerName} />
        <DetailField label="Product" value={r.productName} />
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Rating</span>
          <div className={styles.modalStars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Icon key={s} name="Star" size={18} className={s <= r.rating ? styles.starFilled : styles.starEmpty} />
            ))}
          </div>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Status</span>
          <Badge variant={statusVariant[r.status]} size="sm">{formatLabel(r.status)}</Badge>
        </div>
        <DetailField label="Date" value={r.createdAt} />
        <div className={styles.detailMessage}>
          <span className={styles.detailLabel}>Title</span>
          <p className={styles.reviewModalTitle}>{r.title}</p>
        </div>
        <div className={styles.detailMessage}>
          <span className={styles.detailLabel}>Comment</span>
          <p>{r.comment}</p>
        </div>
        <ReplySection replyText={replyText} setReplyText={setReplyText} onReply={onReply} placeholder="Reply to this review..." />
      </div>
    );
  }

  if (item.type === 'subscriptions') {
    const s = item.data as unknown as Subscription;
    return (
      <div className={styles.detailBody}>
        <DetailField label="Customer" value={s.customerName} />
        <DetailField label="Email" value={s.email} />
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Plan</span>
          <Badge variant={s.plan === 'enterprise' ? 'success' : s.plan === 'pro' ? 'primary' : 'info'} size="sm">{formatLabel(s.plan)}</Badge>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Status</span>
          <Badge variant={statusVariant[s.status]} size="sm">{formatLabel(s.status)}</Badge>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Monthly Amount</span>
          <span className={styles.detailValue}>KSh {s.amount.toLocaleString()}/mo</span>
        </div>
        <DetailField label="Start Date" value={s.startDate} />
        <DetailField label="Renewal Date" value={s.renewalDate} />
      </div>
    );
  }

  if (item.type === 'announcements') {
    const a = item.data as unknown as Announcement;
    return (
      <div className={styles.detailBody}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Status</span>
          <Badge variant={statusVariant[a.status]} size="sm">{formatLabel(a.status)}</Badge>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Audience</span>
          <Badge variant={a.audience === 'all' ? 'primary' : 'info'} size="sm">{formatLabel(a.audience)}</Badge>
        </div>
        <DetailField label="Author" value={a.author} />
        <DetailField label="Published" value={a.publishedAt || 'Not published yet'} />
        <div className={styles.detailMessage}>
          <span className={styles.detailLabel}>Title</span>
          <p className={styles.reviewModalTitle}>{a.title}</p>
        </div>
        <div className={styles.detailMessage}>
          <span className={styles.detailLabel}>Content</span>
          <p>{a.content}</p>
        </div>
        {a.pinned && (
          <div className={styles.pinnedBadge}>
            <Icon name="Pin" size={14} /> Pinned Announcement
          </div>
        )}
        <ReplySection replyText={replyText} setReplyText={setReplyText} onReply={onReply} placeholder="Add a comment or reply..." />
      </div>
    );
  }

  return null;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}

function ReplySection({
  replyText,
  setReplyText,
  onReply,
  placeholder = 'Type your reply...',
}: {
  replyText: string;
  setReplyText: (v: string) => void;
  onReply: () => void;
  placeholder?: string;
}) {
  return (
    <div className={styles.replySection}>
      <span className={styles.detailLabel}>Reply</span>
      <Textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
      <Button
        size="sm"
        leftIcon={<Icon name="Send" size={14} />}
        onClick={onReply}
        disabled={!replyText.trim()}
      >
        Send Reply
      </Button>
    </div>
  );
}

/* ---------- Quotation Requests ---------- */
function QuotationRequestsSection({
  data,
  onItemClick,
}: {
  data: QuotationRequest[];
  onItemClick: (q: QuotationRequest) => void;
}) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? data : data.filter((q) => q.status === filter)),
    [data, filter]
  );

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'in_review', label: 'In Review' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'closed', label: 'Closed' },
  ];

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (row: QuotationRequest) => (
        <div className={styles.customerCell}>
          <Avatar name={row.customerName} size="sm" />
          <div className={styles.customerInfo}>
            <span className={styles.customerName}>{row.customerName}</span>
            <span className={styles.customerSub}>{row.company}</span>
          </div>
        </div>
      ),
    },
    { key: 'subject', header: 'Subject', render: (row: QuotationRequest) => (
      <div className={styles.subjectCell}>
        <span className={styles.subjectText}>{row.subject}</span>
        <span className={styles.itemsText}>{row.items}</span>
      </div>
    ) },
    { key: 'estimatedValue', header: 'Est. Value', align: 'right' as const, render: (row: QuotationRequest) => (
      <span className={styles.valueText}>KSh {row.estimatedValue.toLocaleString()}</span>
    ) },
    { key: 'priority', header: 'Priority', align: 'center' as const, render: (row: QuotationRequest) => (
      <Badge variant={priorityVariant[row.priority]} size="sm">{formatLabel(row.priority)}</Badge>
    ) },
    { key: 'status', header: 'Status', align: 'center' as const, render: (row: QuotationRequest) => (
      <Badge variant={statusVariant[row.status]} size="sm">{formatLabel(row.status)}</Badge>
    ) },
    { key: 'createdAt', header: 'Received', render: (row: QuotationRequest) => (
      <span className={styles.dateText}>{row.createdAt}</span>
    ) },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.sectionToolbar}>
        <div className={styles.filterChips}>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.chip} ${filter === opt.value ? styles.chipActive : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" leftIcon={<Icon name="Download" size={16} />}>Export</Button>
      </div>
      <Card padding="none">
        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} onRowClick={onItemClick} />
      </Card>
    </div>
  );
}

/* ---------- Call Requests ---------- */
function CallRequestsSection({
  data,
  onItemClick,
}: {
  data: CallRequest[];
  onItemClick: (c: CallRequest) => void;
}) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? data : data.filter((c) => c.status === filter)),
    [data, filter]
  );

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'missed', label: 'Missed' },
  ];

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (row: CallRequest) => (
        <div className={styles.customerCell}>
          <Avatar name={row.customerName} size="sm" />
          <div className={styles.customerInfo}>
            <span className={styles.customerName}>{row.customerName}</span>
            <span className={styles.customerSub}>{row.phone}</span>
          </div>
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', render: (row: CallRequest) => (
      <span className={styles.reasonText}>{row.reason}</span>
    ) },
    { key: 'preferredTime', header: 'Preferred Time', render: (row: CallRequest) => (
      <span className={styles.dateText}>{row.preferredTime}</span>
    ) },
    { key: 'priority', header: 'Priority', align: 'center' as const, render: (row: CallRequest) => (
      <Badge variant={priorityVariant[row.priority]} size="sm">{formatLabel(row.priority)}</Badge>
    ) },
    { key: 'status', header: 'Status', align: 'center' as const, render: (row: CallRequest) => (
      <Badge variant={statusVariant[row.status]} size="sm">{formatLabel(row.status)}</Badge>
    ) },
    { key: 'createdAt', header: 'Requested', render: (row: CallRequest) => (
      <span className={styles.dateText}>{row.createdAt}</span>
    ) },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.sectionToolbar}>
        <div className={styles.filterChips}>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.chip} ${filter === opt.value ? styles.chipActive : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <Card padding="none">
        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} onRowClick={onItemClick} />
      </Card>
    </div>
  );
}

/* ---------- Reviews ---------- */
function ReviewsSection({
  data,
  onItemClick,
}: {
  data: Review[];
  onItemClick: (r: Review) => void;
}) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? data : data.filter((r) => r.status === filter)),
    [data, filter]
  );

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'pending', label: 'Pending' },
    { value: 'flagged', label: 'Flagged' },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.sectionToolbar}>
        <div className={styles.filterChips}>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.chip} ${filter === opt.value ? styles.chipActive : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className={styles.ratingSummary}>
          <span className={styles.ratingAvg}>
            {(data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1)}
          </span>
          <div className={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name="Star"
                size={16}
                className={star <= Math.round(data.reduce((s, r) => s + r.rating, 0) / data.length) ? styles.starFilled : styles.starEmpty}
              />
            ))}
          </div>
          <span className={styles.ratingCount}>{data.length} reviews</span>
        </div>
      </div>
      <div className={styles.reviewGrid}>
        {filtered.map((review) => (
          <ReviewCard key={review.id} review={review} onClick={() => onItemClick(review)} />
        ))}
        {filtered.length === 0 && (
          <div className={styles.emptyWrap}>
            <EmptyState icon="Star" title="No reviews" message="No reviews match this filter." />
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, onClick }: { review: Review; onClick: () => void }) {
  return (
    <Card padding="md" className={styles.reviewCard}>
      <div className={styles.reviewHeader}>
        <div className={styles.reviewCustomer}>
          <Avatar name={review.customerName} size="sm" />
          <div className={styles.customerInfo}>
            <span className={styles.customerName}>{review.customerName}</span>
            <span className={styles.customerSub}>{review.productName}</span>
          </div>
        </div>
        <Badge variant={statusVariant[review.status]} size="sm">{formatLabel(review.status)}</Badge>
      </div>
      <div className={styles.reviewStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            size={16}
            className={star <= review.rating ? styles.starFilled : styles.starEmpty}
          />
        ))}
      </div>
      <h4 className={styles.reviewTitle}>{review.title}</h4>
      <p className={styles.reviewComment}>{review.comment}</p>
      <div className={styles.reviewFooter}>
        <span className={styles.dateText}>{review.createdAt}</span>
        <Button variant="ghost" size="sm" onClick={onClick}>View Details</Button>
      </div>
    </Card>
  );
}

/* ---------- Subscriptions ---------- */
function SubscriptionsSection({
  data,
  onItemClick,
}: {
  data: Subscription[];
  onItemClick: (s: Subscription) => void;
}) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? data : data.filter((s) => s.status === filter)),
    [data, filter]
  );

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'trialing', label: 'Trialing' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'expired', label: 'Expired' },
  ];

  const planVariant: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'info'> = {
    free: 'default',
    starter: 'info',
    pro: 'primary',
    enterprise: 'success',
  };

  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (row: Subscription) => (
        <div className={styles.customerCell}>
          <Avatar name={row.customerName} size="sm" />
          <div className={styles.customerInfo}>
            <span className={styles.customerName}>{row.customerName}</span>
            <span className={styles.customerSub}>{row.email}</span>
          </div>
        </div>
      ),
    },
    { key: 'plan', header: 'Plan', align: 'center' as const, render: (row: Subscription) => (
      <Badge variant={planVariant[row.plan]} size="sm">{formatLabel(row.plan)}</Badge>
    ) },
    { key: 'amount', header: 'Amount', align: 'right' as const, render: (row: Subscription) => (
      <span className={styles.valueText}>KSh {row.amount.toLocaleString()}/mo</span>
    ) },
    { key: 'startDate', header: 'Start Date', render: (row: Subscription) => (
      <span className={styles.dateText}>{row.startDate}</span>
    ) },
    { key: 'renewalDate', header: 'Renewal Date', render: (row: Subscription) => (
      <span className={styles.dateText}>{row.renewalDate}</span>
    ) },
    { key: 'status', header: 'Status', align: 'center' as const, render: (row: Subscription) => (
      <Badge variant={statusVariant[row.status]} size="sm">{formatLabel(row.status)}</Badge>
    ) },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.sectionToolbar}>
        <div className={styles.filterChips}>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.chip} ${filter === opt.value ? styles.chipActive : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <Card padding="none">
        <Table columns={columns} data={filtered} keyExtractor={(row) => row.id} onRowClick={onItemClick} />
      </Card>
    </div>
  );
}

/* ---------- Announcements ---------- */
function AnnouncementsSection({
  data,
  onItemClick,
}: {
  data: Announcement[];
  onItemClick: (a: Announcement) => void;
}) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? data : data.filter((a) => a.status === filter)),
    [data, filter]
  );

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'draft', label: 'Drafts' },
    { value: 'archived', label: 'Archived' },
  ];

  const audienceVariant: Record<string, 'default' | 'primary' | 'info'> = {
    all: 'primary',
    staff: 'info',
    customers: 'default',
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionToolbar}>
        <div className={styles.filterChips}>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.chip} ${filter === opt.value ? styles.chipActive : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" leftIcon={<Icon name="Plus" size={16} />}>New Announcement</Button>
      </div>
      <div className={styles.announceList}>
        {filtered.map((ann) => (
          <AnnouncementCard key={ann.id} announcement={ann} audienceVariant={audienceVariant} onClick={() => onItemClick(ann)} />
        ))}
        {filtered.length === 0 && (
          <div className={styles.emptyWrap}>
            <EmptyState icon="Megaphone" title="No announcements" message="No announcements match this filter." />
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({
  announcement,
  audienceVariant,
  onClick,
}: {
  announcement: Announcement;
  audienceVariant: Record<string, 'default' | 'primary' | 'info'>;
  onClick: () => void;
}) {
  return (
    <Card padding="md" className={styles.announceCard}>
      <div className={styles.announceHeader}>
        <div className={styles.announceTitleRow}>
          {announcement.pinned && (
            <span className={styles.pinIcon}>
              <Icon name="Pin" size={16} />
            </span>
          )}
          <h4 className={styles.announceTitle}>{announcement.title}</h4>
        </div>
        <div className={styles.announceBadges}>
          <Badge variant={statusVariant[announcement.status]} size="sm">{formatLabel(announcement.status)}</Badge>
          <Badge variant={audienceVariant[announcement.audience]} size="sm">{formatLabel(announcement.audience)}</Badge>
        </div>
      </div>
      <p className={styles.announceContent}>{announcement.content}</p>
      <div className={styles.announceFooter}>
        <div className={styles.announceMeta}>
          <Avatar name={announcement.author} size="sm" />
          <span className={styles.announceAuthor}>{announcement.author}</span>
          <span className={styles.dateText}>
            {announcement.publishedAt || 'Not published yet'}
          </span>
        </div>
        <div className={styles.announceActions}>
          <Button variant="ghost" size="sm" onClick={onClick}>View Details</Button>
        </div>
      </div>
    </Card>
  );
}

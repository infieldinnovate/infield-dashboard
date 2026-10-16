import type { Quotation } from '../../types';
import { statusColors, statusLabels } from '../../lib/documentUtils';
import styles from './QuotationDocument.module.scss';

export default function StatusBadge({ status }: { status: Quotation['status'] }) {
  const label = statusLabels[status] || status;
  const color = statusColors[status] || '#6b7280';
  return <span className={styles.statusBadge} style={{ backgroundColor: color }}>{label}</span>;
}

import type { Quotation } from '../../types';
import { getSettings } from '../../lib/documentUtils';
import styles from './QuotationDocument.module.scss';

export default function CompactHeader({ quotation }: { quotation: Quotation }) {
  return <div className={styles.compactHeader}>
    <div className={styles.compactCompany}>{getSettings().business.businessName}</div>
    <div className={styles.compactDocInfo}>
      <span className={styles.compactTitle}>QUOTATION</span>
      <span className={styles.compactNumber}>{quotation.quotationCode}</span>
    </div>
  </div>;
}

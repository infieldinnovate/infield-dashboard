import type { Quotation } from '../../types';
import styles from './QuotationDocument.module.scss';

export default function BillToAndFor({ quotation }: { quotation: Quotation }) {
  return (
    <div className={styles.billToFor}>
      <div className={styles.billTo}>
        <strong className={styles.sectionLabel}>BILL TO:</strong>
        <div className={styles.billToContent}>
          <p className={styles.clientName}>{quotation.customerName}</p>
          {quotation.customerAddress && <p className={styles.clientAddress}>{quotation.customerAddress}</p>}
          <p className={styles.clientContact}>{quotation.customerContact}</p>
        </div>
      </div>
      <div className={styles.forSection}>
        <strong className={styles.forLabel}>FOR:</strong>
        <span className={styles.forText}>{quotation.quoteFor}</span>
      </div>
    </div>
  );
}

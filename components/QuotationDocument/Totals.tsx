import type { Quotation } from '../../types';
import { calcQuotationTotals, formatCurrency } from '../../lib/documentUtils';
import styles from './QuotationDocument.module.scss';

export default function Totals({ quotation }: { quotation: Quotation }) {
  const { subtotal, tax, total } = calcQuotationTotals(quotation.items, quotation.taxRate);
  return <div className={styles.totals}>
    <div className={styles.totalsRow}><span>Sub-Total</span><strong>{formatCurrency(subtotal)}</strong></div>
    <div className={styles.totalsRow}><span>Tax <em>({quotation.taxRate}%)</em></span><strong>{formatCurrency(tax)}</strong></div>
    <div className={styles.grandTotal}><strong>Grand Total</strong><span>{formatCurrency(total)}</span></div>
  </div>;
}

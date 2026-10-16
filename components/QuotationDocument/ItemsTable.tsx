import type { QuotationItem } from '../../types';
import { calcItemTotal } from '../../lib/documentUtils';
import { formatAmount, padToMinimum } from './documentHelpers';
import styles from './QuotationDocument.module.scss';

export default function ItemsTable({ items, pad }: { items: QuotationItem[]; pad?: boolean }) {
  const rows = pad ? padToMinimum(items, 15) : items;
  return (
    <table className={styles.itemsTable}>
      <thead><tr>
        <th className={styles.noColumn}>No.</th><th>Description</th><th className={styles.unitColumn}>Size</th>
        <th className={styles.qtyColumn}>Qty</th><th className={styles.priceColumn}>Price</th><th className={styles.totalColumn}>Total</th>
      </tr></thead>
      <tbody>{rows.map((item, index) => {
        const isBlank = !item.productName;
        return <tr key={item.productId}>
          <td className={styles.noColumn}>{isBlank ? '' : index + 1}</td>
          <td>{item.productName}</td>
          <td className={styles.unitColumn}>{isBlank ? '' : item.unit || '-'}</td>
          <td className={styles.qtyColumn}>{isBlank ? '' : item.quantity}</td>
          <td className={styles.priceColumn}>{isBlank ? '' : formatAmount(item.unitPrice)}</td>
          <td className={styles.totalColumn}>{isBlank ? '-' : formatAmount(calcItemTotal(item))}</td>
        </tr>;
      })}</tbody>
    </table>
  );
}

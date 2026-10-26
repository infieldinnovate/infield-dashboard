import type { QuotationItem } from "../../types";
import { calcItemTotal } from "../../lib/documentUtils";
import { formatAmount } from "./documentHelpers";
import styles from "./QuotationDocument.module.scss";

export default function ItemsTable({
  items,
  startIndex = 0,
}: {
  items: QuotationItem[];
  startIndex?: number;
}) {
  return (
    <table className={styles.itemsTable}>
      <thead>
        <tr>
          <th className={styles.noColumn}>No.</th>
          <th>Description</th>
          <th className={styles.unitColumn}>Size</th>
          <th className={styles.qtyColumn}>Qty</th>
          <th className={styles.priceColumn}>Price</th>
          <th className={styles.totalColumn}>Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr
            key={item.productId}
            className={index % 2 === 1 ? styles.evenRow : undefined}
          >
            <td className={styles.noColumn}>{startIndex + index + 1}</td>
            <td className={styles.productNameColumn}>{item.productName}</td>
            <td className={styles.unitColumn}>{item.size || "-"}</td>
            <td className={styles.qtyColumn}>{item.quantity} {item.unit || ""}</td>
            <td className={styles.priceColumn}>{item.unitPrice}</td>
            <td className={styles.totalColumn}>
              {formatAmount(calcItemTotal(item))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

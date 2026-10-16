import type { Quotation } from "../../types";
import { calcQuotationTotals, formatCurrency } from "../../lib/documentUtils";
import styles from "./QuotationDocument.module.scss";

export default function Totals({ quotation }: { quotation: Quotation }) {
  const { subtotal, tax, total } = calcQuotationTotals(
    quotation.items,
    quotation.taxRate,
  );
  return (
    <table className={styles.totals}>
      <tbody>
        <tr className={styles.totalsRow}>
          <td>Sub-Total</td>
          <td>{formatCurrency(subtotal)}</td>
        </tr>

        <tr className={styles.totalsRow}>
          <td>
            Tax <em>({quotation.taxRate}%)</em>
          </td>
          <td>{formatCurrency(tax)}</td>
        </tr>

        <tr className={styles.grandTotal}>
          <td>Grand Total</td>
          <td>{formatCurrency(total)}</td>
        </tr>
      </tbody>
    </table>
  );
}

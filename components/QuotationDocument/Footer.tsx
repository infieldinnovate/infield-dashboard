import type { Quotation } from "../../types";
import { getSettings } from "../../lib/documentUtils";
import styles from "./QuotationDocument.module.scss";

export default function QuotationFooterBottomRow({
  quotation,
}: {
  quotation: Quotation;
}) {
  const { phone } = getSettings().business;

  return (
    <div className={styles.footer}>
      <div className={styles.contactAndThankYou}>
        <div className={styles.contact}>
          <b>CONTACT US:</b>
          <span>{phone}</span>
        </div>

        <span className={styles.thankYou}>
          Thank you for choosing Infield Innovations.
          <br />
          We deliver exceptional results with unmatched expertise and
          dedication.
        </span>
      </div>

      <div className={styles.createdBy}>By {quotation.createdBy}</div>
    </div>
  );
}

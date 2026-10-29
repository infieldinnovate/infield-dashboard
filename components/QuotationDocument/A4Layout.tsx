import type { Quotation } from "../../types";
import BillToAndFor from "./BillToAndFor";
import BrandedHeader from "./BrandedHeader";
import Footer from "./Footer";
import ItemsTable from "./ItemsTable";
import Totals from "./Totals";
import styles from "./QuotationDocument.module.scss";
import StampSign from "./StampSign";

export default function A4Layout({ quotation }: { quotation: Quotation }) {
  return (
    <div className={styles.a4Container}>
      <div className={styles.a4Page}>
        <BrandedHeader quotation={quotation} />
        <BillToAndFor quotation={quotation} />
        <div className={styles.itemsWrapper}>
          <ItemsTable items={quotation.items} startIndex={0} />
        </div>
        <div className={styles.totalsNotesSection}>
          <div className={styles.notes}>
            <strong>Notes:</strong>
            {quotation.notes && <span>{quotation.notes}</span>}
          </div>
          <Totals quotation={quotation} />
        </div>
        <StampSign quotation={quotation} />
        <Footer quotation={quotation} />
      </div>
    </div>
  );
}

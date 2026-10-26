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
      <div className={`${styles.a4Page} ${styles.a4PageLast}`}>
        <BrandedHeader quotation={quotation} />
        <BillToAndFor quotation={quotation} />
        <ItemsTable items={quotation.items} startIndex={0} />
        <Totals quotation={quotation} />
        <StampSign quotation={quotation} />
        <Footer quotation={quotation} />
      </div>
    </div>
  );
}

import type { Quotation } from "../../types";
import BillToAndFor from "./BillToAndFor";
import BrandedHeader from "./BrandedHeader";
import Footer from "./Footer";
import ItemsTable from "./ItemsTable";
import Totals from "./Totals";
import { ITEMS_PER_MIDDLE_PAGE, ITEMS_PER_PAGE, paginateItems } from "./documentHelpers";
import styles from "./QuotationDocument.module.scss";
import StampSign from "./StampSign";

export default function A4Layout({ quotation }: { quotation: Quotation }) {
  const pages = paginateItems(quotation.items);
  return (
    <div className={styles.a4Container}>
      {pages.map((pageItems, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;
        const startIndex = isFirst ? 0 : ITEMS_PER_PAGE + (pageIndex - 1) * ITEMS_PER_MIDDLE_PAGE;
        return (
          <div
            key={pageIndex}
            className={`${styles.a4Page} ${isLast ? styles.a4PageLast : ""}`}
          >
            <BrandedHeader quotation={quotation} />
            {isFirst && <BillToAndFor quotation={quotation} />}
            <ItemsTable items={pageItems} startIndex={startIndex} />
            {isLast && <Totals quotation={quotation} />}
            {isLast && <StampSign quotation={quotation} />}
            <Footer quotation={quotation} />
          </div>
        );
      })}
    </div>
  );
}

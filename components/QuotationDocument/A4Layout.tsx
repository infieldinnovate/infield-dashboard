import type { Quotation } from "../../types";
import BillToAndFor from "./BillToAndFor";
import BrandedHeader from "./BrandedHeader";
import CompactHeader from "./CompactHeader";
import Footer from "./Footer";
import ItemsTable from "./ItemsTable";
import Totals from "./Totals";
import { paginateItems } from "./documentHelpers";
import styles from "./QuotationDocument.module.scss";
import StampSign from "./StampSign";

export default function A4Layout({ quotation }: { quotation: Quotation }) {
  const pages = paginateItems(quotation.items);
  return (
    <div className={styles.a4Container}>
      {pages.map((pageItems, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;
        return (
          <div key={pageIndex} className={styles.a4Page}>
            {isFirst ? (
              <>
                <BrandedHeader quotation={quotation} />
                <BillToAndFor quotation={quotation} />
                <ItemsTable items={pageItems} />
              </>
            ) : (
              <>
                <CompactHeader quotation={quotation} />
                <ItemsTable items={pageItems} />
              </>
            )}
            {isLast && <Totals quotation={quotation} />}
            {isLast && <StampSign quotation={quotation} />}
            {isLast && <Footer quotation={quotation} />}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import A4Layout from "./A4Layout";
import ActionBar from "./ActionBar";
import StatusBadge from "./StatusBadge";
import { printQuotation } from "./quotationPrint";
import { downloadQuotationPDF } from "./quotationPDF";
import type { QuotationDocumentProps } from "./types";
import styles from "./QuotationDocument.module.scss";

export type { QuotationDocumentActions } from "./types";
export { printQuotation } from "./quotationPrint";
export { generateQuotationPDF, downloadQuotationPDF } from "./quotationPDF";

export default function QuotationDocument({
  quotation,
  actions,
}: QuotationDocumentProps) {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewToolbar}>
        <div className={styles.previewStatus}>
          <StatusBadge status={quotation.status} />
        </div>
        <ActionBar
          actions={actions}
          onPrint={() => { void printQuotation(quotation); }}
          onDownload={() => downloadQuotationPDF(quotation)}
        />
      </div>
      <div className={styles.previewBody}>
        <A4Layout quotation={quotation} />
      </div>
    </div>
  );
}

import type { Quotation } from "../../types";
import { formatStampDate, getSettings } from "../../lib/documentUtils";
import Stamp from "../InvoiceDocument/Stamp";
import { ImageWithFallback } from "../ui/ImageWithFallback";
import styles from "./QuotationDocument.module.scss";

export default function StampSign({ quotation }: { quotation: Quotation }) {
  const { signature } = getSettings().business;
  const signatureSrc = quotation.createdBySignature ? quotation.createdBySignature : signature;

  return (
    <div className={styles.stampSignSection}>
      <div className={styles.stampSignLabel}>Digitally Signed:</div>
      <Stamp date={formatStampDate(quotation.createdAt)} />
      <ImageWithFallback
        src={signatureSrc}
        alt="Signature"
        width={140}
        height={50}
        animation="fadeUp"
        className={styles.signatureImage}
      />
    </div>
  );
}

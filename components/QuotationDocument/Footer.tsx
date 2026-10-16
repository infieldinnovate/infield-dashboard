import type { Quotation } from '../../types';
import { getSettings } from '../../lib/documentUtils';
import Stamp from '../InvoiceDocument/Stamp';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import styles from './QuotationDocument.module.scss';

export default function Footer({ quotation }: { quotation: Quotation }) {
  const { phone, signature } = getSettings().business;
  const signatureSrc = quotation.createdBySignature || signature;
  return <footer className={styles.footer}>
    <div className={styles.footerNotes}><strong>Terms &amp; Conditions</strong>{quotation.notes && <span>{quotation.notes}</span>}</div>
    <div className={styles.footerBottom}>
      <div className={styles.footerThankYou}>Thank you for choosing Infield Innovations!</div>
      <div className={styles.footerStamp}><Stamp /></div>
      <div className={styles.authorizedSignature}>
        <ImageWithFallback src={signatureSrc} alt="Signature" width={140} height={50} animation="fadeUp" className={styles.signatureImage} />
        <strong>{quotation.createdBy}</strong>
      </div>
    </div>
    <div className={styles.footerContact}>CONTACT US: <span>{phone}</span></div>
  </footer>;
}

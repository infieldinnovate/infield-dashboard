import styles from './QuotationDocument.module.scss';
import type { QuotationDocumentActions } from './types';

interface ActionBarProps {
  actions: QuotationDocumentActions;
  onPrint: () => void;
  onDownload: () => void;
}

export default function ActionBar({ actions, onPrint, onDownload }: ActionBarProps) {
  return <div className={styles.actionBar}>
    <button className={styles.actionBtn} onClick={onPrint}>Print A4</button>
    <button className={styles.actionBtn} onClick={onDownload}>Download PDF</button>
    <button className={styles.actionBtn} onClick={actions.onEdit}>Edit</button>
    <button className={styles.actionBtn} onClick={actions.onDuplicate}>Duplicate</button>
    <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={actions.onDelete}>Delete</button>
  </div>;
}

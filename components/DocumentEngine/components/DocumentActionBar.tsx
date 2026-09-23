'use client';

import React from 'react';
import Icon from '../../ui/Icon';
import styles from '../DocumentEngine.module.scss';

export interface DocumentActionBarProps {
  onPrintA4: () => void;
  onThermalPrint: () => void;
  onDownloadPDF: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  showThermal?: boolean;
}

export default function DocumentActionBar({
  onPrintA4, onThermalPrint, onDownloadPDF, onEdit, onDuplicate, onDelete,
  showThermal = false,
}: DocumentActionBarProps) {
  return (
    <div className={styles.actionBar}>
      <button className={styles.actionBarItem} onClick={onPrintA4}>
        <Icon name="Printer" size={16} /> Print A4
      </button>
      {showThermal && (
        <button className={styles.actionBarItem} onClick={onThermalPrint}>
          <Icon name="Receipt" size={16} /> Thermal Print (57mm)
        </button>
      )}
      <button className={styles.actionBarItem} onClick={onDownloadPDF}>
        <Icon name="Download" size={16} /> Download PDF
      </button>
      <button className={styles.actionBarItem} onClick={onEdit}>
        <Icon name="Pencil" size={16} /> Edit
      </button>
      <button className={styles.actionBarItem} onClick={onDuplicate}>
        <Icon name="Copy" size={16} /> Duplicate
      </button>
      <button className={`${styles.actionBarItem} ${styles.actionBarDanger}`} onClick={onDelete}>
        <Icon name="Trash2" size={16} /> Delete
      </button>
    </div>
  );
}

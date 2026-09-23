'use client';

import React from 'react';
import type { DocumentConfig } from '../types';
import PrintLayoutA4 from './PrintLayoutA4';
import DocumentActionBar, { type DocumentActionBarProps } from './DocumentActionBar';
import DocumentStatusBadge from './DocumentStatusBadge';
import styles from '../DocumentEngine.module.scss';

interface DocumentPreviewProps {
  config: DocumentConfig;
  actions: Pick<DocumentActionBarProps, 'onPrintA4' | 'onDownloadPDF' | 'onEdit' | 'onDuplicate' | 'onDelete'> & {
    onThermalPrint?: () => void;
    showThermal?: boolean;
  };
}

export default function DocumentPreview({ config, actions }: DocumentPreviewProps) {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewToolbar}>
        <div className={styles.previewStatus}>
          <DocumentStatusBadge status={config.status} />
        </div>
        <DocumentActionBar
          onPrintA4={actions.onPrintA4}
          onThermalPrint={actions.onThermalPrint || (() => {})}
          onDownloadPDF={actions.onDownloadPDF}
          onEdit={actions.onEdit}
          onDuplicate={actions.onDuplicate}
          onDelete={actions.onDelete}
          showThermal={actions.showThermal}
        />
      </div>
      <div className={styles.previewBody}>
        <PrintLayoutA4 config={config} />
      </div>
    </div>
  );
}

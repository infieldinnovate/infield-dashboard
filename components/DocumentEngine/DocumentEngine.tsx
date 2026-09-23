'use client';

import React from 'react';
import type { DocumentConfig, DocumentModel } from './types';
import { toDocumentConfig } from './types';
import DocumentPreview from './components/DocumentPreview';
import { printDocumentA4, printDocumentThermal57 } from './print';
import { downloadDocumentPDF } from './PDFLayout';

export interface DocumentEngineActions {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  showThermal?: boolean;
}

interface DocumentEngineProps {
  document: DocumentModel;
  actions: DocumentEngineActions;
  showThermal?: boolean;
}

export default function DocumentEngine({ document, actions, showThermal }: DocumentEngineProps) {
  const config: DocumentConfig = toDocumentConfig(document);

  return (
    <DocumentPreview
      config={config}
      actions={{
        onPrintA4: () => printDocumentA4(config),
        onThermalPrint: () => printDocumentThermal57(config),
        onDownloadPDF: () => downloadDocumentPDF(config),
        onEdit: actions.onEdit,
        onDuplicate: actions.onDuplicate,
        onDelete: actions.onDelete,
        showThermal: showThermal ?? actions.showThermal,
      }}
    />
  );
}

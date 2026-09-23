'use client';

import React from 'react';
import type { DocumentConfig } from '../types';
import InvoiceLayout from './InvoiceLayout';
import QuotationLayout from './QuotationLayout';
import ReceiptLayout from './ReceiptLayout';
import DeliveryNoteLayout from './DeliveryNoteLayout';

interface PrintLayoutA4Props {
  config: DocumentConfig;
}

export default function PrintLayoutA4({ config }: PrintLayoutA4Props) {
  switch (config.type) {
    case 'invoice':
      return <InvoiceLayout config={config} />;
    case 'quotation':
      return <QuotationLayout config={config} />;
    case 'receipt':
      return <ReceiptLayout config={config} />;
    case 'delivery-note':
      return <DeliveryNoteLayout config={config} />;
    default:
      return <InvoiceLayout config={config} />;
  }
}

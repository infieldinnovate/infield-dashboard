'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import type { DocumentConfig } from '../types';
import { getSettings } from '../types';
import styles from '../DocumentEngine.module.scss';

interface InvoiceHeaderProps {
  config: DocumentConfig;
}

export default function InvoiceHeader({ config }: InvoiceHeaderProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const invoiceFor = config.items
    .filter((item) => item.productName)
    .map((item) => `${item.quantity} ${item.productName}`)
    .join(' and ');

  useEffect(() => {
    if (!barcodeRef.current) return;
    JsBarcode(barcodeRef.current, config.documentNumber, {
      format: 'CODE128',
      displayValue: false,
      height: 34,
      width: 1.35,
      margin: 0,
      background: 'transparent',
      lineColor: '#111111',
    });
  }, [config.documentNumber]);

  return (
    <header className={styles.invoiceHeader}>
      <div className={styles.invoiceHeaderTop}>
        <div className={styles.invoiceBrand}>
          <div className={styles.invoiceLogo} aria-label={businessName}>
            <span className={styles.invoiceLogoMark}>in</span>
            <span className={styles.invoiceLogoName}>Field</span>
            <span className={styles.invoiceLogoDrop} />
          </div>
          <div className={styles.invoiceBusinessName}>
            <strong>INFIELD</strong>
            <span>INNOVATIONS</span>
          </div>
          <div className={styles.invoiceBrandRule} />
        </div>

        <div className={styles.invoiceTitleBlock}>
          <h1>INVOICE</h1>
          <svg ref={barcodeRef} className={styles.invoiceBarcode} aria-label={`Barcode for ${config.documentNumber}`} />
        </div>

        <div className={styles.invoiceContact}>
          <div className={styles.invoiceContactRow}>
            <strong>T.</strong>
            <span>{phone}</span>
          </div>
          <div className={styles.invoiceContactRow}>
            <strong>W.</strong>
            <span>{website || 'www.infield.co.ke'}</span>
          </div>
          <div className={styles.invoiceContactRow}>
            <strong>E.</strong>
            <span>{email}</span>
          </div>
          <address>{address}</address>
        </div>
      </div>

      <div className={styles.invoiceAccentBar}>
        <span />
      </div>

      <div className={styles.invoiceFor}>
        <strong>INVOICE FOR:</strong>
        <span>{invoiceFor || config.customer.name}</span>
      </div>
    </header>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import type { DocumentConfig } from "../types";
import { formatCurrency, formatDate, getSettings } from "../types";
import styles from "../DocumentEngine.module.scss";

interface InvoiceHeaderProps {
  config: DocumentConfig;
}

export default function InvoiceHeader({ config }: InvoiceHeaderProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const invoiceDate = formatDate(config.date);
  const totalDue = config.totals?.balance ?? config.totals?.total ?? 0;

  useEffect(() => {
    if (!barcodeRef.current) return;
    JsBarcode(barcodeRef.current, config.documentNumber, {
      format: "CODE128",
      displayValue: false,
      height: 34,
      width: 1.35,
      margin: 0,
      background: "transparent",
      lineColor: "#111111",
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
          <svg
            ref={barcodeRef}
            className={styles.invoiceBarcode}
            aria-label={`Barcode for ${config.documentNumber}`}
          />
        </div>

        <div className={styles.invoiceContact}>
          <div className={styles.invoiceContactRow}>
            <strong>T.</strong>
            <span>{phone}</span>
          </div>
          <div className={styles.invoiceContactRow}>
            <strong>W.</strong>
            <span>{website || "Website not set"}</span>
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

      <div className={styles.invoiceSummary}>
        <div className={styles.invoiceBillTo}>
          <span className={styles.invoiceSummaryLabel}>TO</span>
          <strong>{config.customer.name}</strong>
        </div>
        <div className={styles.invoiceDateDetails}>
          <div>
            <strong>INVOICE DATE:</strong>
            <span>{invoiceDate}</span>
          </div>
          <div>
            <strong>DATE ISSUED:</strong>
            <span>{invoiceDate}</span>
          </div>
        </div>
        <div className={styles.invoiceNumberDetails}>
          <div>
            <strong>INVOICE NO:</strong>
            <span>{config.documentNumber}</span>
          </div>
          <div>
            <strong>TOTAL DUE</strong>
            <span className={styles.invoiceTotalDue}>
              {formatCurrency(totalDue)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

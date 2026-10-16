"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import type { Quotation } from "../../types";
import {
  formatDate,
  generateBarcode,
  getSettings,
} from "../../lib/documentUtils";
import styles from "./QuotationDocument.module.scss";
import Image from "next/image";

export default function BrandedHeader({ quotation }: { quotation: Quotation }) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const { businessName, address, phone, email, website, logo } =
    getSettings().business;
  const barcodeValue = generateBarcode(
    quotation.userId,
    quotation.quotationCode,
  );

  useEffect(() => {
    if (!barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: "CODE128",
        displayValue: false,
        height: 31,
        width: 1.35,
        margin: 0,
        background: "transparent",
        lineColor: "#111111",
      });
    } catch {
      /* ignore invalid barcode values */
    }
  }, [barcodeValue]);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Image
          className={styles.logo}
          src={logo}
          alt={`${businessName} logo`}
          width={248}
          height={100}
        />
        <div className={styles.businessName}>{businessName}</div>
        <div className={styles.businessDetails}>
          <p>{address}</p>
          <p>
            <strong>Tel:</strong> {phone}
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>
          <p>
            <strong>Website:</strong> {website || "www.infield.co.ke"}
          </p>
        </div>
      </div>
      <div className={styles.titleBlock}>
        <h1>QUOTATION</h1>
        <svg ref={barcodeRef} className={styles.barcode} />
        <span className={styles.codeText}>{quotation.quotationCode}</span>
        <span className={styles.dateText}>
          <strong>Date: </strong>
          <span>{formatDate(quotation.createdAt)}</span>
        </span>
      </div>
    </header>
  );
}

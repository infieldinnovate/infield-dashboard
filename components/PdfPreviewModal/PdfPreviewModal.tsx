"use client";

import React, { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { generateQuotationPDF, downloadQuotationPDF } from "../QuotationDocument";
import type { Quotation } from "../../types";
import styles from "./PdfPreviewModal.module.scss";

interface PdfPreviewModalProps {
  quotation: Quotation | null;
  onClose: () => void;
}

export default function PdfPreviewModal({ quotation, onClose }: PdfPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quotation) {
      setPdfUrl(null);
      setError(null);
      return;
    }

    let url: string | null = null;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setPdfUrl(null);

    generateQuotationPDF(quotation)
      .then((bytes) => {
        if (cancelled) return;
        const ab = new ArrayBuffer(bytes.byteLength);
        new Uint8Array(ab).set(bytes);
        const blob = new Blob([ab], { type: "application/pdf" });
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to generate PDF");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [quotation]);

  const handleDownload = () => {
    if (quotation) {
      void downloadQuotationPDF(quotation).then(() => {
        onClose();
      });
    }
  };

  const footer = (
    <div className={styles.footerActions}>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
      <Button
        leftIcon={<Icon name="Download" size={16} />}
        onClick={handleDownload}
        disabled={loading || !!error}
      >
        Download PDF
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={!!quotation}
      onClose={onClose}
      title={quotation ? `PDF Preview — ${quotation.quotationCode}` : "PDF Preview"}
      size="xl"
      footer={footer}
    >
      <div className={styles.previewArea}>
        {loading && (
          <div className={styles.message}>
            <Icon name="Loader" size={32} />
            <p>Generating PDF...</p>
          </div>
        )}
        {error && (
          <div className={styles.message}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}
        {pdfUrl && !loading && !error && (
          <iframe
            src={`${pdfUrl}#navpanes=0`}
            title="PDF Preview"
            className={styles.pdfFrame}
          />
        )}
      </div>
    </Modal>
  );
}

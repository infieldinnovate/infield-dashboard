'use client';

import React from 'react';
import InputField from '../form_elements/input';
import Badge from '../../ui/Badge';
import Icon from '../../ui/Icon';
import type { AppSettings } from '../../../types';
import SectionCard from './SectionCard';
import styles from './SettingsForms.module.scss';

type UpdateFn = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

interface NumberingFormProps {
  settings: AppSettings;
  update: UpdateFn;
}

function NumberingCard({
  icon,
  label,
  color,
  prefix,
  nextNumber,
  onPrefixChange,
  onNumberChange,
}: {
  icon: string;
  label: string;
  color: 'primary' | 'secondary' | 'success' | 'warning';
  prefix: string;
  nextNumber: number;
  onPrefixChange: (v: string) => void;
  onNumberChange: (v: number) => void;
}) {
  const preview = `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;
  return (
    <div className={styles.numberingCard}>
      <div className={styles.numberingHeader}>
        <span className={`${styles.numberingIcon} ${styles[color]}`}>
          <Icon name={icon} size={20} />
        </span>
        <span className={styles.numberingLabel}>{label}</span>
      </div>
      <div className={styles.numberingFields}>
        <InputField
          label="Prefix"
          value={prefix}
          onChange={(e) => onPrefixChange(e.target.value)}
        />
        <InputField
          label="Next Number"
          type="number"
          value={String(nextNumber)}
          onChange={(e) => onNumberChange(parseInt(e.target.value) || 0)}
        />
      </div>
      <div className={styles.numberingPreview}>
        <span className={styles.numberingPreviewLabel}>Preview</span>
        <Badge variant={color}>{preview}</Badge>
      </div>
    </div>
  );
}

export default function NumberingForm({ settings, update }: NumberingFormProps) {
  const n = settings.numbering;
  return (
    <SectionCard title="Document Numbering" description="Configure prefixes and starting numbers for each document type" icon="Hash">
      <div className={styles.numberingGrid}>
        <NumberingCard
          icon="FileText"
          label="Quotation"
          color="primary"
          prefix={n.quotationPrefix}
          nextNumber={n.quotationNextNumber}
          onPrefixChange={(v) => update('numbering', { ...n, quotationPrefix: v })}
          onNumberChange={(v) => update('numbering', { ...n, quotationNextNumber: v })}
        />
        <NumberingCard
          icon="FileSpreadsheet"
          label="Invoice"
          color="secondary"
          prefix={n.invoicePrefix}
          nextNumber={n.invoiceNextNumber}
          onPrefixChange={(v) => update('numbering', { ...n, invoicePrefix: v })}
          onNumberChange={(v) => update('numbering', { ...n, invoiceNextNumber: v })}
        />
        <NumberingCard
          icon="Receipt"
          label="Receipt"
          color="success"
          prefix={n.receiptPrefix}
          nextNumber={n.receiptNextNumber}
          onPrefixChange={(v) => update('numbering', { ...n, receiptPrefix: v })}
          onNumberChange={(v) => update('numbering', { ...n, receiptNextNumber: v })}
        />
        <NumberingCard
          icon="PackageCheck"
          label="Delivery Note"
          color="warning"
          prefix={n.deliveryPrefix}
          nextNumber={n.deliveryNextNumber}
          onPrefixChange={(v) => update('numbering', { ...n, deliveryPrefix: v })}
          onNumberChange={(v) => update('numbering', { ...n, deliveryNextNumber: v })}
        />
      </div>
    </SectionCard>
  );
}

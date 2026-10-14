'use client';

import React from 'react';
import SelectField from '../form_elements/select';
import TextareaField from '../form_elements/textarea';
import type { AppSettings } from '../../../types';
import SectionCard from './SectionCard';
import ToggleSwitch from './ToggleSwitch';
import styles from './SettingsForms.module.scss';

type UpdateFn = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

interface PrintFormProps {
  settings: AppSettings;
  update: UpdateFn;
}

export default function PrintForm({ settings, update }: PrintFormProps) {
  const p = settings.print;
  return (
    <SectionCard title="Print Settings" description="Defaults for printing invoices, quotations, and receipts" icon="Printer">
      <div className={styles.form}>
        <div className={styles.formRow}>
          <SelectField
            label="Page Size"
            options={[
              { value: 'a4', label: 'A4 (210 × 297 mm)' },
              { value: 'letter', label: 'Letter (8.5 × 11 in)' },
            ]}
            value={p.pageSize}
            onChange={(e) => update('print', { ...p, pageSize: e.target.value as 'a4' | 'letter' })}
          />
          <SelectField
            label="Orientation"
            options={[
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ]}
            value={p.orientation}
            onChange={(e) => update('print', { ...p, orientation: e.target.value as 'portrait' | 'landscape' })}
          />
        </div>

        <div className={styles.toggleList}>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleTitle}>Show Logo</span>
              <span className={styles.toggleDesc}>Display your business logo in the document header</span>
            </div>
            <ToggleSwitch checked={p.showLogo} onChange={(v) => update('print', { ...p, showLogo: v })} />
          </div>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleTitle}>Show Business Information</span>
              <span className={styles.toggleDesc}>Include address, phone, and email on documents</span>
            </div>
            <ToggleSwitch checked={p.showBusinessInfo} onChange={(v) => update('print', { ...p, showBusinessInfo: v })} />
          </div>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleTitle}>Show Tax ID</span>
              <span className={styles.toggleDesc}>Display your tax ID / VAT number on documents</span>
            </div>
            <ToggleSwitch checked={p.showTaxId} onChange={(v) => update('print', { ...p, showTaxId: v })} />
          </div>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleTitle}>Use Accent Color</span>
              <span className={styles.toggleDesc}>Apply your theme accent color to document headings</span>
            </div>
            <ToggleSwitch checked={p.accentColor} onChange={(v) => update('print', { ...p, accentColor: v })} />
          </div>
        </div>

        <TextareaField
          label="Footer Text"
          rows={2}
          value={p.footerText}
          onChange={(e) => update('print', { ...p, footerText: e.target.value })}
        />
      </div>
    </SectionCard>
  );
}

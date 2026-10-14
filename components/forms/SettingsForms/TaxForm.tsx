'use client';

import React from 'react';
import InputField from '../form_elements/input';
import { Percent } from 'lucide-react';
import type { AppSettings } from '../../../types';
import SectionCard from './SectionCard';
import ToggleSwitch from './ToggleSwitch';
import styles from './SettingsForms.module.scss';

type UpdateFn = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

interface TaxFormProps {
  settings: AppSettings;
  update: UpdateFn;
}

export default function TaxForm({ settings, update }: TaxFormProps) {
  const t = settings.tax;
  return (
    <SectionCard title="Tax" description="Default tax rate applied to your products and documents" icon="Percent">
      <div className={styles.form}>
        <div className={styles.formRow}>
          <InputField
            label="Default Tax Rate"
            type="number"
            icon={Percent}
            value={String(t.taxRate)}
            onChange={(e) => update('tax', { ...t, taxRate: parseFloat(e.target.value) || 0 })}
            helperText="Applied as a percentage (e.g. 10 = 10%)"
          />
          <InputField
            label="Tax ID / VAT Number"
            value={t.taxId}
            onChange={(e) => update('tax', { ...t, taxId: e.target.value })}
            helperText="Shown on printed documents"
          />
        </div>
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleTitle}>Tax Inclusive Pricing</span>
            <span className={styles.toggleDesc}>When enabled, product prices already include tax</span>
          </div>
          <ToggleSwitch checked={t.taxInclusive} onChange={(v) => update('tax', { ...t, taxInclusive: v })} />
        </div>
      </div>
    </SectionCard>
  );
}

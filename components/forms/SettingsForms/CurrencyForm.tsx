'use client';

import React from 'react';
import InputField from '../form_elements/input';
import SelectField from '../form_elements/select';
import { currencyOptions } from '../../../data/settings';
import type { AppSettings } from '../../../types';
import SectionCard from './SectionCard';
import styles from './SettingsForms.module.scss';

type UpdateFn = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

interface CurrencyFormProps {
  settings: AppSettings;
  update: UpdateFn;
}

export default function CurrencyForm({ settings, update }: CurrencyFormProps) {
  const c = settings.currency;
  return (
    <SectionCard title="Currency" description="How monetary values are displayed across the app" icon="Coins">
      <div className={styles.form}>
        <SelectField
          label="Currency"
          options={currencyOptions}
          value={c.currency}
          onChange={(e) => update('currency', { ...c, currency: e.target.value })}
        />
        <div className={styles.formRow}>
          <InputField
            label="Currency Symbol"
            value={c.currencySymbol}
            onChange={(e) => update('currency', { ...c, currencySymbol: e.target.value })}
          />
          <SelectField
            label="Symbol Position"
            options={[
              { value: 'before', label: 'Before amount ($10)' },
              { value: 'after', label: 'After amount (10$)' },
            ]}
            value={c.currencyPosition}
            onChange={(e) => update('currency', { ...c, currencyPosition: e.target.value as 'before' | 'after' })}
          />
        </div>
        <div className={styles.formRow}>
          <InputField
            label="Decimal Places"
            type="number"
            value={String(c.decimalPlaces)}
            onChange={(e) => update('currency', { ...c, decimalPlaces: parseInt(e.target.value) || 0 })}
          />
          <InputField
            label="Thousand Separator"
            value={c.thousandSeparator}
            onChange={(e) => update('currency', { ...c, thousandSeparator: e.target.value })}
          />
        </div>
        <div className={styles.currencyPreview}>
          <span className={styles.currencyPreviewLabel}>Preview</span>
          <span className={styles.currencyPreviewValue}>
            {c.currencyPosition === 'before' ? c.currencySymbol : ''}
            {Number(1234567.89).toLocaleString('en-US', {
              minimumFractionDigits: c.decimalPlaces,
              maximumFractionDigits: c.decimalPlaces,
            })}
            {c.currencyPosition === 'after' ? c.currencySymbol : ''}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

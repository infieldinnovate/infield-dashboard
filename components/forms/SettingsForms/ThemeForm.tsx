'use client';

import React from 'react';
import Icon from '../../ui/Icon';
import { themeColorOptions } from '../../../data/settings';
import type { AppSettings } from '../../../types';
import SectionCard from './SectionCard';
import styles from './SettingsForms.module.scss';

type UpdateFn = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

interface ThemeFormProps {
  settings: AppSettings;
  update: UpdateFn;
}

function ThemeOption({
  icon,
  label,
  active,
  onClick,
}: {
  icon?: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`${styles.themeOption} ${active ? styles.themeOptionActive : ''}`} onClick={onClick}>
      {icon && (
        <span className={styles.themeOptionIcon}>
          <Icon name={icon} size={18} />
        </span>
      )}
      <span>{label}</span>
    </button>
  );
}

export default function ThemeForm({ settings, update }: ThemeFormProps) {
  const t = settings.theme;
  return (
    <SectionCard title="Theme" description="Customize the appearance of your dashboard" icon="Palette">
      <div className={styles.form}>
        <div className={styles.themeGroup}>
          <label className={styles.groupLabel}>Appearance</label>
          <div className={styles.themeOptions}>
            <ThemeOption
              icon="Sun"
              label="Light"
              active={t.mode === 'light'}
              onClick={() => update('theme', { ...t, mode: 'light' })}
            />
            <ThemeOption
              icon="Moon"
              label="Dark"
              active={t.mode === 'dark'}
              onClick={() => update('theme', { ...t, mode: 'dark' })}
            />
          </div>
        </div>

        <div className={styles.themeGroup}>
          <label className={styles.groupLabel}>Accent Color</label>
          <div className={styles.colorSwatches}>
            {themeColorOptions.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.swatch} ${t.color === opt.value ? styles.swatchActive : ''}`}
                style={{ background: `var(--${opt.value === 'blue' ? 'primary' : opt.value === 'teal' ? 'secondary' : opt.value}-600)` }}
                onClick={() => update('theme', { ...t, color: opt.value as AppSettings['theme']['color'] })}
                title={opt.label}
                aria-label={opt.label}
              >
                {t.color === opt.value && <Icon name="Check" size={18} className={styles.swatchCheck} />}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.themeGroup}>
          <label className={styles.groupLabel}>Font Size</label>
          <div className={styles.themeOptions}>
            <ThemeOption label="Small" active={t.fontSize === 'small'} onClick={() => update('theme', { ...t, fontSize: 'small' })} />
            <ThemeOption label="Medium" active={t.fontSize === 'medium'} onClick={() => update('theme', { ...t, fontSize: 'medium' })} />
            <ThemeOption label="Large" active={t.fontSize === 'large'} onClick={() => update('theme', { ...t, fontSize: 'large' })} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

'use client';

import React, { useState } from 'react';
import styles from './page.module.scss';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { defaultSettings } from '../../data/settings';
import type { AppSettings } from '../../types';
import { toast } from 'sonner';
import { BusinessForm, NumberingForm, TaxForm, CurrencyForm, ThemeForm, PrintForm } from '../../components/forms/SettingsForms';

const sections = [
  { id: 'business', label: 'Business Information', icon: 'Building2', description: 'Your company details shown on documents' },
  { id: 'numbering', label: 'Document Numbering', icon: 'Hash', description: 'Prefixes and sequences for documents' },
  { id: 'tax', label: 'Tax', icon: 'Percent', description: 'Tax rate and identification' },
  { id: 'currency', label: 'Currency', icon: 'Coins', description: 'Currency and formatting rules' },
  { id: 'theme', label: 'Theme', icon: 'Palette', description: 'Appearance and color scheme' },
  { id: 'print', label: 'Print Settings', icon: 'Printer', description: 'Page layout for printed documents' },
] as const;

type SectionId = (typeof sections)[number]['id'];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [activeSection, setActiveSection] = useState<SectionId>('business');

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* Sidebar nav */}
        <aside className={styles.nav}>
          {sections.map((s) => (
            <button
              key={s.id}
              className={`${styles.navItem} ${activeSection === s.id ? styles.navItemActive : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className={styles.navIcon}>
                <Icon name={s.icon} size={18} />
              </span>
              <span className={styles.navText}>
                <span className={styles.navLabel}>{s.label}</span>
                <span className={styles.navDesc}>{s.description}</span>
              </span>
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className={styles.content}>
          {activeSection === 'business' && <BusinessForm settings={settings} update={update} />}
          {activeSection === 'numbering' && <NumberingForm settings={settings} update={update} />}
          {activeSection === 'tax' && <TaxForm settings={settings} update={update} />}
          {activeSection === 'currency' && <CurrencyForm settings={settings} update={update} />}
          {activeSection === 'theme' && <ThemeForm settings={settings} update={update} />}
          {activeSection === 'print' && <PrintForm settings={settings} update={update} />}

          <div className={styles.actions}>
            <Button variant="ghost" leftIcon={<Icon name="RotateCcw" size={16} />} onClick={handleReset}>
              Reset
            </Button>
            <Button leftIcon={<Icon name="Save" size={16} />} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

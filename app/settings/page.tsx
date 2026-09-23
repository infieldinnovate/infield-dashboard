'use client';

import React, { useState } from 'react';
import styles from './page.module.scss';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Icon from '../../components/ui/Icon';
import { defaultSettings, currencyOptions, themeColorOptions } from '../../data/settings';
import type { AppSettings } from '../../types';
import { toast } from 'sonner';

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
          {activeSection === 'business' && <BusinessSection settings={settings} update={update} />}
          {activeSection === 'numbering' && <NumberingSection settings={settings} update={update} />}
          {activeSection === 'tax' && <TaxSection settings={settings} update={update} />}
          {activeSection === 'currency' && <CurrencySection settings={settings} update={update} />}
          {activeSection === 'theme' && <ThemeSection settings={settings} update={update} />}
          {activeSection === 'print' && <PrintSection settings={settings} update={update} />}

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

/* ---------- Section wrapper ---------- */
function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="lg" className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>
          <Icon name={icon} size={22} />
        </span>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionDescription}>{description}</p>
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </Card>
  );
}

/* ---------- Business Information ---------- */
function BusinessSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}) {
  const b = settings.business;
  return (
    <SectionCard title="Business Information" description="This appears on your invoices, quotations, and receipts" icon="Building2">
      <div className={styles.form}>
        <Input
          label="Business Name"
          required
          value={b.businessName}
          onChange={(e) => update('business', { ...b, businessName: e.target.value })}
        />
        <Textarea
          label="Address"
          rows={2}
          value={b.address}
          onChange={(e) => update('business', { ...b, address: e.target.value })}
        />
        <div className={styles.formRow}>
          <Input
            label="Phone"
            leftIcon={<Icon name="Phone" size={16} />}
            value={b.phone}
            onChange={(e) => update('business', { ...b, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            leftIcon={<Icon name="Mail" size={16} />}
            value={b.email}
            onChange={(e) => update('business', { ...b, email: e.target.value })}
          />
        </div>
        <Input
          label="Website"
          leftIcon={<Icon name="Globe" size={16} />}
          value={b.website}
          onChange={(e) => update('business', { ...b, website: e.target.value })}
        />
        <div className={styles.logoUpload}>
          <label className={styles.logoLabel}>Logo</label>
          <div className={styles.logoArea}>
            <div className={styles.logoPreview}>
              {b.logo ? (
                <img src={b.logo} alt="Business logo" className={styles.logoImage} />
              ) : (
                <div className={styles.logoPlaceholder}>
                  <Icon name="Image" size={28} />
                  <span>No logo uploaded</span>
                </div>
              )}
            </div>
            <div className={styles.logoActions}>
              <Button variant="outline" size="sm" leftIcon={<Icon name="Upload" size={16} />}>
                Upload Logo
              </Button>
              {b.logo && (
                <Button variant="ghost" size="sm" leftIcon={<Icon name="Trash2" size={16} />} onClick={() => update('business', { ...b, logo: '' })}>
                  Remove
                </Button>
              )}
              <span className={styles.logoHint}>PNG or SVG, max 1MB. Recommended 240×80px.</span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ---------- Document Numbering ---------- */
function NumberingSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}) {
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
        <Input
          label="Prefix"
          value={prefix}
          onChange={(e) => onPrefixChange(e.target.value)}
        />
        <Input
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

/* ---------- Tax ---------- */
function TaxSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}) {
  const t = settings.tax;
  return (
    <SectionCard title="Tax" description="Default tax rate applied to your products and documents" icon="Percent">
      <div className={styles.form}>
        <div className={styles.formRow}>
          <Input
            label="Default Tax Rate"
            type="number"
            leftIcon={<Icon name="Percent" size={16} />}
            value={String(t.taxRate)}
            onChange={(e) => update('tax', { ...t, taxRate: parseFloat(e.target.value) || 0 })}
            helperText="Applied as a percentage (e.g. 10 = 10%)"
          />
          <Input
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

/* ---------- Currency ---------- */
function CurrencySection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}) {
  const c = settings.currency;
  return (
    <SectionCard title="Currency" description="How monetary values are displayed across the app" icon="Coins">
      <div className={styles.form}>
        <Select
          label="Currency"
          options={currencyOptions}
          value={c.currency}
          onChange={(e) => update('currency', { ...c, currency: e.target.value })}
        />
        <div className={styles.formRow}>
          <Input
            label="Currency Symbol"
            value={c.currencySymbol}
            onChange={(e) => update('currency', { ...c, currencySymbol: e.target.value })}
          />
          <Select
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
          <Input
            label="Decimal Places"
            type="number"
            value={String(c.decimalPlaces)}
            onChange={(e) => update('currency', { ...c, decimalPlaces: parseInt(e.target.value) || 0 })}
          />
          <Input
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

/* ---------- Theme ---------- */
function ThemeSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}) {
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

/* ---------- Print Settings ---------- */
function PrintSection({
  settings,
  update,
}: {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}) {
  const p = settings.print;
  return (
    <SectionCard title="Print Settings" description="Defaults for printing invoices, quotations, and receipts" icon="Printer">
      <div className={styles.form}>
        <div className={styles.formRow}>
          <Select
            label="Page Size"
            options={[
              { value: 'a4', label: 'A4 (210 × 297 mm)' },
              { value: 'letter', label: 'Letter (8.5 × 11 in)' },
            ]}
            value={p.pageSize}
            onChange={(e) => update('print', { ...p, pageSize: e.target.value as 'a4' | 'letter' })}
          />
          <Select
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

        <Textarea
          label="Footer Text"
          rows={2}
          value={p.footerText}
          onChange={(e) => update('print', { ...p, footerText: e.target.value })}
        />
      </div>
    </SectionCard>
  );
}

/* ---------- Toggle Switch ---------- */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

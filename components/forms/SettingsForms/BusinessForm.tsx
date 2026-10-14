'use client';

import React from 'react';
import InputField from '../form_elements/input';
import TextareaField from '../form_elements/textarea';
import Button from '../../ui/Button';
import Icon from '../../ui/Icon';
import { Phone, Mail, Globe } from 'lucide-react';
import type { AppSettings } from '../../../types';
import { ImageWithFallback } from '../../ui/ImageWithFallback';
import SectionCard from './SectionCard';
import styles from './SettingsForms.module.scss';

type UpdateFn = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;

interface BusinessFormProps {
  settings: AppSettings;
  update: UpdateFn;
}

export default function BusinessForm({ settings, update }: BusinessFormProps) {
  const b = settings.business;
  return (
    <SectionCard title="Business Information" description="This appears on your invoices, quotations, and receipts" icon="Building2">
      <div className={styles.form}>
        <InputField
          label="Business Name"
          required
          value={b.businessName}
          onChange={(e) => update('business', { ...b, businessName: e.target.value })}
        />
        <TextareaField
          label="Address"
          rows={2}
          value={b.address}
          onChange={(e) => update('business', { ...b, address: e.target.value })}
        />
        <div className={styles.formRow}>
          <InputField
            label="Phone"
            icon={Phone}
            value={b.phone}
            onChange={(e) => update('business', { ...b, phone: e.target.value })}
          />
          <InputField
            label="Email"
            type="email"
            icon={Mail}
            value={b.email}
            onChange={(e) => update('business', { ...b, email: e.target.value })}
          />
        </div>
        <InputField
          label="Website"
          icon={Globe}
          value={b.website}
          onChange={(e) => update('business', { ...b, website: e.target.value })}
        />
        <div className={styles.logoUpload}>
          <label className={styles.logoLabel}>Logo</label>
          <div className={styles.logoArea}>
            <div className={styles.logoPreview}>
              {b.logo ? (
                <ImageWithFallback
                  src={b.logo}
                  alt="Business logo"
                  fill
                  animation="none"
                  className={styles.logoImage}
                />
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
        <div className={styles.logoUpload}>
          <label className={styles.logoLabel}>Authorised Signature</label>
          <div className={styles.logoArea}>
            <div className={styles.logoPreview}>
              {b.signature ? (
                <ImageWithFallback
                  src={b.signature}
                  alt="Authorised signature"
                  fill
                  animation="none"
                  className={styles.logoImage}
                />
              ) : (
                <div className={styles.logoPlaceholder}>
                  <Icon name="PenTool" size={28} />
                  <span>No signature uploaded</span>
                </div>
              )}
            </div>
            <div className={styles.logoActions}>
              <Button variant="outline" size="sm" leftIcon={<Icon name="Upload" size={16} />}>
                Upload Signature
              </Button>
              {b.signature && (
                <Button variant="ghost" size="sm" leftIcon={<Icon name="Trash2" size={16} />} onClick={() => update('business', { ...b, signature: '' })}>
                  Remove
                </Button>
              )}
              <span className={styles.logoHint}>PNG with transparency, max 1MB. Recommended 280×80px.</span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import SelectField from './form_elements/select';
import TextareaField from './form_elements/textarea';
import CheckboxField from './form_elements/checkbox';
import Button from '../ui/Button';
import { Lead } from '../../types';
import { leadFormSchema, LeadFormData } from '../../schema/formSchema';
import styles from './LeadForm.module.scss';

interface LeadFormProps {
  mode: 'add' | 'edit';
  initialValues?: Lead | null;
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const serviceOptions = [
  { value: 'Solar', label: 'Solar' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Boreholes', label: 'Boreholes' },
  { value: 'Irrigation', label: 'Irrigation' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Other', label: 'Other' },
];

const defaultValues: LeadFormData = {
  company_name: '',
  contact_person: '',
  phone: '',
  email: '',
  location: '',
  interested_service: 'Solar',
  lead_source: '',
  status: 'new',
  last_contact_date: '',
  follow_up_date: '',
  notes: '',
  marketing_consent: false,
};

export default function LeadForm({ mode, initialValues, onSubmit, onCancel }: LeadFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        company_name: initialValues.company_name,
        contact_person: initialValues.contact_person,
        phone: initialValues.phone,
        email: initialValues.email,
        location: initialValues.location,
        interested_service: initialValues.interested_service as LeadFormData['interested_service'],
        lead_source: initialValues.lead_source,
        status: initialValues.status,
        last_contact_date: initialValues.last_contact_date ?? '',
        follow_up_date: initialValues.follow_up_date ?? '',
        notes: initialValues.notes,
        marketing_consent: initialValues.marketing_consent,
      });
    } else {
      reset(defaultValues);
    }
  }, [mode, initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <InputField label="Company Name" required register={register} name="company_name" error={errors.company_name ?? null} />
      <div className={styles.formRow}>
        <InputField label="Contact Person" register={register} name="contact_person" error={errors.contact_person ?? null} />
        <InputField label="Phone / WhatsApp" register={register} name="phone" error={errors.phone ?? null} />
      </div>
      <div className={styles.formRow}>
        <InputField label="Email" type="email" register={register} name="email" error={errors.email ?? null} />
        <InputField label="Location" register={register} name="location" error={errors.location ?? null} />
      </div>
      <div className={styles.formRow}>
        <SelectField label="Interested Service" options={serviceOptions} register={register} name="interested_service" error={errors.interested_service ?? null} />
        <InputField label="Lead Source" register={register} name="lead_source" error={errors.lead_source ?? null} />
      </div>
      <div className={styles.formRow}>
        <SelectField label="Status" options={statusOptions} register={register} name="status" error={errors.status ?? null} />
        <InputField label="Last Contact Date" type="date" register={register} name="last_contact_date" error={errors.last_contact_date ?? null} />
      </div>
      <div className={styles.formRow}>
        <InputField label="Follow-up Date" type="date" register={register} name="follow_up_date" error={errors.follow_up_date ?? null} />
        <div className={styles.consentWrapper}>
          <CheckboxField label="Marketing consent granted" register={register} name="marketing_consent" error={errors.marketing_consent ?? null} />
        </div>
      </div>
      <TextareaField label="Notes" rows={3} register={register} name="notes" error={errors.notes ?? null} />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Save Lead'}
        </Button>
      </div>
    </form>
  );
}

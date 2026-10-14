'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import SelectField from './form_elements/select';
import Button from '../ui/Button';
import { Supplier } from '../../types';
import { supplierFormSchema, SupplierFormData } from '../../schema/formSchema';
import styles from './SupplierForm.module.scss';

interface SupplierFormProps {
  mode: 'add' | 'edit';
  initialValues?: Supplier | null;
  onSubmit: (data: SupplierFormData) => void;
  onCancel: () => void;
}

const paymentTermsOptions = [
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 45', label: 'Net 45' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Prepaid', label: 'Prepaid' },
  { value: 'COD', label: 'COD' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const defaultValues: SupplierFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxId: '',
  paymentTerms: 'Net 30',
  leadTime: '',
  status: 'active',
  rating: '',
  categories: '',
};

export default function SupplierForm({ mode, initialValues, onSubmit, onCancel }: SupplierFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        name: initialValues.name,
        email: initialValues.email,
        phone: initialValues.phone,
        address: initialValues.address,
        city: initialValues.city,
        country: initialValues.country,
        taxId: initialValues.taxId,
        paymentTerms: initialValues.paymentTerms,
        leadTime: String(initialValues.leadTime),
        status: initialValues.status,
        rating: String(initialValues.rating),
        categories: initialValues.categories.join(', '),
      });
    } else {
      reset(defaultValues);
    }
  }, [mode, initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <InputField label="Supplier Name" required register={register} name="name" error={errors.name ?? null} />
      <div className={styles.formRow}>
        <InputField label="Email" type="email" required register={register} name="email" error={errors.email ?? null} />
        <InputField label="Phone" register={register} name="phone" error={errors.phone ?? null} />
      </div>
      <InputField label="Address" register={register} name="address" error={errors.address ?? null} />
      <div className={styles.formRow}>
        <InputField label="City" register={register} name="city" error={errors.city ?? null} />
        <InputField label="Country" register={register} name="country" error={errors.country ?? null} />
      </div>
      <div className={styles.formRow}>
        <InputField label="Tax ID" register={register} name="taxId" error={errors.taxId ?? null} />
        <InputField label="Categories (comma-separated)" placeholder="Beverages, Food" register={register} name="categories" error={errors.categories ?? null} />
      </div>
      <div className={styles.formRow}>
        <SelectField label="Payment Terms" options={paymentTermsOptions} register={register} name="paymentTerms" error={errors.paymentTerms ?? null} />
        <InputField label="Lead Time (days)" type="number" register={register} name="leadTime" error={errors.leadTime ?? null} />
      </div>
      <div className={styles.formRow}>
        <InputField label="Rating (0-5)" type="number" register={register} name="rating" error={errors.rating ?? null} />
        <SelectField label="Status" options={statusOptions} register={register} name="status" error={errors.status ?? null} />
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Save Supplier'}
        </Button>
      </div>
    </form>
  );
}

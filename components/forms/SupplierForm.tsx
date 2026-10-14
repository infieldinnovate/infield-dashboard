'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import TextareaField from './form_elements/textarea';
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

const defaultValues: SupplierFormData = {
  name: '',
  email: '',
  phone: '',
  phone2: '',
  address: '',
  city: '',
  country: '',
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
        phone2: initialValues.phone2,
        address: initialValues.address,
        city: initialValues.city,
        country: initialValues.country,
        categories: initialValues.categories,
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
      <div className={styles.formRow}>
        <InputField label="Phone 2" register={register} name="phone2" error={errors.phone2 ?? null} />
        <InputField label="Country" register={register} name="country" error={errors.country ?? null} />
      </div>
      <InputField label="Address" register={register} name="address" error={errors.address ?? null} />
      <div className={styles.formRow}>
        <InputField label="City" register={register} name="city" error={errors.city ?? null} />
      </div>
      <TextareaField label="Categories" placeholder="List categories, one per line or comma-separated" rows={3} register={register} name="categories" error={errors.categories ?? null} />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Save Supplier'}
        </Button>
      </div>
    </form>
  );
}
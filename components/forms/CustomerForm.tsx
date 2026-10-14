'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import SelectField from './form_elements/select';
import Button from '../ui/Button';
import { Customer } from '../../types';
import { customerFormSchema, CustomerFormData } from '../../schema/formSchema';
import styles from './CustomerForm.module.scss';

interface CustomerFormProps {
  mode: 'add' | 'edit';
  initialValues?: Customer | null;
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
}

const typeOptions = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const defaultValues: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxId: '',
  creditLimit: '',
  type: 'individual',
  status: 'active',
};

export default function CustomerForm({ mode, initialValues, onSubmit, onCancel }: CustomerFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
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
        creditLimit: String(initialValues.creditLimit),
        type: initialValues.type,
        status: initialValues.status,
      });
    } else {
      reset(defaultValues);
    }
  }, [mode, initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <InputField label="Customer Name" required register={register} name="name" error={errors.name ?? null} />
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
        <InputField label="Credit Limit" type="number" register={register} name="creditLimit" error={errors.creditLimit ?? null} />
      </div>
      <div className={styles.formRow}>
        <SelectField label="Type" options={typeOptions} register={register} name="type" error={errors.type ?? null} />
        <SelectField label="Status" options={statusOptions} register={register} name="status" error={errors.status ?? null} />
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Save Customer'}
        </Button>
      </div>
    </form>
  );
}

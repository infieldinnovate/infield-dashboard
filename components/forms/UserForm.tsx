'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import SelectField from './form_elements/select';
import Button from '../ui/Button';
import { User } from '../../types';
import { userFormSchema, UserFormData } from '../../schema/formSchema';
import styles from './UserForm.module.scss';

interface UserFormProps {
  mode: 'add' | 'edit';
  initialValues?: User | null;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
}

const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'sales', label: 'Sales' },
  { value: 'cashier', label: 'Cashier' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const defaultValues: UserFormData = {
  name: '',
  email: '',
  phone: '',
  role: 'cashier',
  status: 'active',
  jobTitle: '',
  signature: '',
};

export default function UserForm({ mode, initialValues, onSubmit, onCancel }: UserFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        name: initialValues.name,
        email: initialValues.email,
        phone: initialValues.phone,
        role: initialValues.role,
        status: initialValues.status,
        jobTitle: initialValues.jobTitle,
        signature: initialValues.signature,
      });
    } else {
      reset(defaultValues);
    }
  }, [mode, initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <InputField label="Full Name" required register={register} name="name" error={errors.name ?? null} />
      <div className={styles.formRow}>
        <InputField label="Email" type="email" required register={register} name="email" error={errors.email ?? null} />
        <InputField label="Phone" register={register} name="phone" error={errors.phone ?? null} />
      </div>
      <InputField label="Job Title" register={register} name="jobTitle" error={errors.jobTitle ?? null} placeholder="e.g. Operations Manager" />
      <div className={styles.formRow}>
        <SelectField label="Role" options={roleOptions} register={register} name="role" error={errors.role ?? null} />
        <SelectField label="Status" options={statusOptions} register={register} name="status" error={errors.status ?? null} />
      </div>
      <InputField
        label="Signature Image URL"
        register={register}
        name="signature"
        error={errors.signature ?? null}
        placeholder="/signature.png"
        helperText="Image path or URL for the user's signature"
      />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Save User'}
        </Button>
      </div>
    </form>
  );
}

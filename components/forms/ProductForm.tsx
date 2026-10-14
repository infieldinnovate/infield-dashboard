'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import SelectField from './form_elements/select';
import TextareaField from './form_elements/textarea';
import Button from '../ui/Button';
import { Product } from '../../types';
import { productFormSchema, ProductFormData } from '../../schema/formSchema';
import { categories } from '../../data/categories';
import styles from './ProductForm.module.scss';

interface ProductFormProps {
  mode: 'add' | 'edit';
  initialValues?: Product | null;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
}

const categoryOptions = categories.map((c) => ({ value: c.name, label: c.name }));

const defaultValues: ProductFormData = {
  name: '',
  price: '',
  cost: '',
  stock: '',
  category: '',
  sku: '',
  unit: '',
  description: '',
};

export default function ProductForm({ mode, initialValues, onSubmit, onCancel }: ProductFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        name: initialValues.name,
        price: String(initialValues.price),
        cost: String(initialValues.cost),
        stock: String(initialValues.stock),
        category: initialValues.category,
        sku: initialValues.sku,
        unit: initialValues.unit,
        description: initialValues.description,
      });
    } else {
      reset(defaultValues);
    }
  }, [mode, initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <InputField label="Product Name" required register={register} name="name" error={errors.name ?? null} />
      <div className={styles.formRow}>
        <InputField label="Price" type="number" required register={register} name="price" error={errors.price ?? null} />
        <InputField label="Cost" type="number" required register={register} name="cost" error={errors.cost ?? null} />
      </div>
      <div className={styles.formRow}>
        <InputField label="Stock" type="number" required register={register} name="stock" error={errors.stock ?? null} />
        <InputField label="Unit" required register={register} name="unit" error={errors.unit ?? null} />
      </div>
      <div className={styles.formRow}>
        <InputField label="SKU" required register={register} name="sku" error={errors.sku ?? null} />
        <SelectField label="Category" options={categoryOptions} register={register} name="category" error={errors.category ?? null} />
      </div>
      <TextareaField label="Description" register={register} name="description" error={errors.description ?? null} />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}

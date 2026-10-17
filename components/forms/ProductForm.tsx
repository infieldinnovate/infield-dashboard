'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import SelectField from './form_elements/select';
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
  productName: '',
  size: '',
  price: '',
  stock: '',
  category: '',
  unit: '',
};

export default function ProductForm({ mode, initialValues, onSubmit, onCancel }: ProductFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        productName: initialValues.productName,
        size: initialValues.size,
        price: String(initialValues.price),
        stock: String(initialValues.stock),
        category: initialValues.category,
        unit: initialValues.unit,
      });
    } else {
      reset(defaultValues);
    }
  }, [mode, initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <InputField label="Product Name" required register={register} name="productName" error={errors.productName ?? null} />
      <div className={styles.formRow}>
        <InputField label="Size" required placeholder="e.g. 400W, 200Ah, 50mm" register={register} name="size" error={errors.size ?? null} />
        <InputField label="Unit" required placeholder="e.g. panel, metre, piece" register={register} name="unit" error={errors.unit ?? null} />
      </div>
      <div className={styles.formRow}>
        <InputField label="Price" type="number" required register={register} name="price" error={errors.price ?? null} />
        <InputField label="Stock" type="number" required register={register} name="stock" error={errors.stock ?? null} />
      </div>
      <SelectField label="Category" options={categoryOptions} register={register} name="category" error={errors.category ?? null} />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}

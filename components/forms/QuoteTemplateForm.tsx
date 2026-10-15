'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import TextareaField from './form_elements/textarea';
import SelectField from './form_elements/select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { QuoteTemplate, QuotationItem, Product } from '../../types';
import { quoteTemplateFormSchema, QuoteTemplateFormData } from '../../schema/formSchema';
import { formatCurrency, calcItemTotal, calcTemplateTotals } from '../../lib/documentUtils';
import styles from './QuoteTemplateForm.module.scss';

interface QuoteTemplateFormProps {
  mode: 'create' | 'edit';
  initialValues?: QuoteTemplate | null;
  onSubmit: (data: QuoteTemplateFormData) => void;
  onCancel: () => void;
  productOptions: { value: string; label: string }[];
  products: Product[];
  categoryOptions: { value: string; label: string }[];
}

const discountTypeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount' },
];

const taxRateOptions = [
  { value: '0', label: '0% (No Tax)' },
  { value: '8', label: '8%' },
  { value: '16', label: '16% (Standard)' },
];

function getDefaultValues(): QuoteTemplateFormData {
  return {
    name: '',
    description: '',
    category: 'Solar Solutions',
    items: [],
    discount: '0',
    discountType: 'percentage',
    taxRate: '16',
    notes: '',
  };
}

export default function QuoteTemplateForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  productOptions,
  products,
  categoryOptions,
}: QuoteTemplateFormProps) {
  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } =
    useForm<QuoteTemplateFormData>({
      resolver: zodResolver(quoteTemplateFormSchema),
      defaultValues: getDefaultValues(),
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount');
  const watchedDiscountType = watch('discountType');
  const watchedTaxRate = watch('taxRate');

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        name: initialValues.name,
        description: initialValues.description,
        category: initialValues.category,
        items: initialValues.items.map((i) => ({ ...i })),
        discount: String(initialValues.discount),
        discountType: initialValues.discountType,
        taxRate: String(initialValues.taxRate),
        notes: initialValues.notes,
      });
    } else {
      reset(getDefaultValues());
    }
  }, [mode, initialValues, reset]);

  const totals = useMemo(() => {
    const items = (watchedItems || []) as QuotationItem[];
    return calcTemplateTotals(
      items,
      parseFloat(watchedDiscount) || 0,
      (watchedDiscountType ?? 'percentage') as 'percentage' | 'fixed',
      parseFloat(watchedTaxRate) || 0,
    );
  }, [watchedItems, watchedDiscount, watchedDiscountType, watchedTaxRate]);

  const addItem = () => {
    append({ productId: '', productName: '', quantity: 1, unitPrice: 0 });
  };

  const onProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setValue(`items.${index}.productName`, product?.name || '');
    const unitPrice = product?.price || 0;
    setValue(`items.${index}.unitPrice`, unitPrice);
  };

  const onQtyChange = (index: number, rawValue: string) => {
    const qty = parseInt(rawValue) || 0;
    return qty;
  };

  const onPriceChange = (index: number, rawValue: string) => {
    const price = parseFloat(rawValue) || 0;
    return price;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formTop}>
        <InputField
          label="Template Name"
          required
          placeholder="e.g. Off-Grid Solar System"
          register={register}
          name="name"
          error={errors.name ?? null}
        />
        <SelectField
          label="Category"
          options={categoryOptions}
          register={register}
          name="category"
          error={errors.category ?? null}
        />
      </div>

      <TextareaField
        label="Description"
        register={register}
        name="description"
        error={errors.description ?? null}
        placeholder="Brief description of what this template covers..."
        rows={2}
      />

      <div className={styles.itemsSection}>
        <div className={styles.itemsHeader}>
          <h4 className={styles.sectionTitle}>Items</h4>
          <Button size="sm" variant="ghost" leftIcon={<Icon name="Plus" size={14} />} onClick={addItem}>
            Add Item
          </Button>
        </div>
        {errors.items?.message && (
          <p style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>{String(errors.items.message)}</p>
        )}
        {fields.length === 0 ? (
          <div className={styles.emptyItems}>
            <Icon name="Package" size={24} />
            <p>No items added yet. Click &ldquo;Add Item&rdquo; to get started.</p>
          </div>
        ) : (
          <div className={styles.itemsList}>
            {fields.map((item, index) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemProduct}>
                  <Controller
                    control={control}
                    name={`items.${index}.productId`}
                    render={({ field, fieldState }) => (
                      <SelectField
                        options={productOptions}
                        placeholder="Select product"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          onProductChange(index, e.target.value);
                        }}
                        error={fieldState.error ?? null}
                      />
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name={`items.${index}.quantity`}
                  render={({ field, fieldState }) => (
                    <InputField
                      type="number"
                      placeholder="Qty"
                      value={field.value}
                      onChange={(e) => field.onChange(onQtyChange(index, e.target.value))}
                      error={fieldState.error ?? null}
                      className={styles.itemQty}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`items.${index}.unitPrice`}
                  render={({ field, fieldState }) => (
                    <InputField
                      type="number"
                      placeholder="Price"
                      value={field.value}
                      onChange={(e) => field.onChange(onPriceChange(index, e.target.value))}
                      error={fieldState.error ?? null}
                      className={styles.itemPrice}
                    />
                  )}
                />
                <div className={styles.itemTotal}>
                  {formatCurrency(calcItemTotal(watchedItems?.[index] ?? { quantity: 0, unitPrice: 0 }))}
                </div>
                <button className={styles.removeItem} onClick={() => remove(index)}>
                  <Icon name="X" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.formBottom}>
        <div className={styles.calcFields}>
          <div className={styles.calcRow}>
            <SelectField
              label="Discount Type"
              options={discountTypeOptions}
              register={register}
              name="discountType"
              error={errors.discountType ?? null}
            />
            <InputField
              label="Discount"
              type="number"
              register={register}
              name="discount"
              error={errors.discount ?? null}
            />
            <SelectField
              label="Tax Rate"
              options={taxRateOptions}
              register={register}
              name="taxRate"
              error={errors.taxRate ?? null}
            />
          </div>
        </div>
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Discount</span>
            <span>-{formatCurrency(totals.discountAmount)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Tax ({watchedTaxRate || 0}%)</span>
            <span>{formatCurrency(totals.tax)}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Grand Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>

      <TextareaField
        label="Notes"
        register={register}
        name="notes"
        error={errors.notes ?? null}
        placeholder="Default notes to include when generating quotations from this template..."
        rows={2}
      />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}

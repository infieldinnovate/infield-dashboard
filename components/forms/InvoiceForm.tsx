'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import TextareaField from './form_elements/textarea';
import SelectField from './form_elements/select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { Invoice, InvoiceItem, Product } from '../../types';
import { invoiceFormSchema, InvoiceFormData } from '../../schema/formSchema';
import { formatCurrency } from '../../lib/documentUtils';
import styles from './InvoiceForm.module.scss';

interface InvoiceFormProps {
  mode: 'create' | 'edit';
  initialValues?: Invoice | null;
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
  customerOptions: { value: string; label: string }[];
  productOptions: { value: string; label: string }[];
  products: Product[];
}

const discountTypeOptions = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount' },
];

function getDefaultValues(): InvoiceFormData {
  return {
    customerId: '',
    items: [],
    discount: '0',
    discountType: 'percentage',
    taxRate: '10',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '',
  };
}

function calcTotals(
  items: InvoiceItem[],
  discount: number,
  discountType: 'percentage' | 'fixed',
  taxRate: number,
) {
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + tax;
  return { subtotal, discountAmount, tax, total };
}

export default function InvoiceForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  customerOptions,
  productOptions,
  products,
}: InvoiceFormProps) {
  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } =
    useForm<InvoiceFormData>({
      resolver: zodResolver(invoiceFormSchema),
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
      const discountPercent = initialValues.discountType === 'percentage' ? initialValues.discount : 0;
      const discountFixed = initialValues.discountType === 'fixed' ? initialValues.discount : 0;
      reset({
        customerId: initialValues.customerId,
        items: initialValues.items.map((i) => ({ ...i })),
        discount: initialValues.discountType === 'percentage' ? String(discountPercent) : String(discountFixed),
        discountType: initialValues.discountType || 'percentage',
        taxRate: String(initialValues.taxRate || 10),
        issueDate: initialValues.issueDate,
        dueDate: initialValues.dueDate,
        notes: initialValues.notes,
      });
    } else {
      reset(getDefaultValues());
    }
  }, [mode, initialValues, reset]);

  const totals = useMemo(() => {
    const items = (watchedItems || []) as InvoiceItem[];
    return calcTotals(
      items,
      parseFloat(watchedDiscount) || 0,
      (watchedDiscountType ?? 'percentage') as 'percentage' | 'fixed',
      parseFloat(watchedTaxRate) || 0,
    );
  }, [watchedItems, watchedDiscount, watchedDiscountType, watchedTaxRate]);

  const addItem = () => {
    append({ productId: '', productName: '', description: '', quantity: 1, unitPrice: 0, total: 0 });
  };

  const onProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setValue(`items.${index}.productName`, product?.name || '');
    const unitPrice = product?.price || 0;
    setValue(`items.${index}.unitPrice`, unitPrice);
    const qty = watchedItems?.[index]?.quantity ?? 0;
    setValue(`items.${index}.total`, unitPrice * qty);
  };

  const onQtyChange = (index: number, rawValue: string) => {
    const qty = parseInt(rawValue) || 0;
    const price = watchedItems?.[index]?.unitPrice ?? 0;
    setValue(`items.${index}.total`, qty * price);
    return qty;
  };

  const onPriceChange = (index: number, rawValue: string) => {
    const price = parseFloat(rawValue) || 0;
    const qty = watchedItems?.[index]?.quantity ?? 0;
    setValue(`items.${index}.total`, qty * price);
    return price;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formTop}>
        <SelectField
          label="Customer"
          required
          options={customerOptions}
          placeholder="Select customer"
          register={register}
          name="customerId"
          error={errors.customerId ?? null}
        />
        <InputField
          label="Issue Date"
          type="date"
          required
          register={register}
          name="issueDate"
          error={errors.issueDate ?? null}
        />
        <InputField
          label="Due Date"
          type="date"
          required
          register={register}
          name="dueDate"
          error={errors.dueDate ?? null}
        />
      </div>

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
            <Icon name="FileText" size={24} />
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
                <InputField
                  placeholder="Description"
                  register={register}
                  name={`items.${index}.description`}
                  className={styles.itemDesc}
                />
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
                  {formatCurrency(watchedItems?.[index]?.total ?? 0)}
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
            <InputField
              label="Tax Rate (%)"
              type="number"
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
        placeholder="Add any notes for the customer..."
      />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}

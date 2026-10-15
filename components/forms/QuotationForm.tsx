'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import TextareaField from './form_elements/textarea';
import SelectField from './form_elements/select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { Customer, Quotation, QuotationItem, Product } from '../../types';
import { quotationFormSchema, QuotationFormData } from '../../schema/formSchema';
import { formatCurrency } from '../../lib/documentUtils';
import styles from './QuotationForm.module.scss';

interface QuotationFormProps {
  mode: 'create' | 'edit';
  initialValues?: Quotation | null;
  prefillData?: QuotationFormData | null;
  onSubmit: (data: QuotationFormData) => void;
  onCancel: () => void;
  customerOptions: { value: string; label: string }[];
  onCreateCustomer: () => void;
  createdCustomer: Customer | null;
  productOptions: { value: string; label: string }[];
  products: Product[];
  customers: Customer[];
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

function getDefaultValues(): QuotationFormData {
  return {
    customerId: '',
    customerAddress: '',
    customerContact: '',
    quoteFor: '',
    items: [],
    discount: '0',
    discountType: 'percentage',
    taxRate: '16',
    validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: '',
  };
}

function calcTotals(
  items: QuotationItem[],
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

export default function QuotationForm({
  mode,
  initialValues,
  prefillData,
  onSubmit,
  onCancel,
  customerOptions,
  onCreateCustomer,
  createdCustomer,
  productOptions,
  products,
  customers,
}: QuotationFormProps) {
  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } =
    useForm<QuotationFormData>({
      resolver: zodResolver(quotationFormSchema),
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
  const watchedCustomerId = watch('customerId');

  useEffect(() => {
    if (prefillData) {
      reset(prefillData);
    } else if (mode === 'edit' && initialValues) {
      reset({
        customerId: initialValues.customerId,
        customerAddress: initialValues.customerAddress || '',
        customerContact: initialValues.customerContact || '',
        quoteFor: initialValues.quoteFor || '',
        items: initialValues.items.map((i) => ({ ...i })),
        discount: String(initialValues.discount),
        discountType: initialValues.discountType,
        taxRate: String(initialValues.taxRate),
        validUntil: initialValues.validUntil,
        notes: initialValues.notes,
      });
    } else {
      reset(getDefaultValues());
    }
  }, [mode, initialValues, prefillData, reset]);

  useEffect(() => {
    if (createdCustomer) {
      setValue('customerId', createdCustomer.id);
    }
  }, [createdCustomer, setValue]);

  useEffect(() => {
    if (watchedCustomerId) {
      const customer = customers.find((c) => c.id === watchedCustomerId);
      if (customer) {
        const currentContact = watch('customerContact');
        if (!currentContact) {
          setValue('customerContact', customer.phone || customer.email);
        }
        const currentAddress = watch('customerAddress');
        if (!currentAddress && customer.address) {
          setValue('customerAddress', `${customer.address}, ${customer.city}`);
        }
      }
    }
  }, [watchedCustomerId, customers, setValue, watch]);

  const totals = useMemo(() => {
    const items = (watchedItems || []) as QuotationItem[];
    return calcTotals(
      items,
      parseFloat(watchedDiscount) || 0,
      (watchedDiscountType ?? 'percentage') as 'percentage' | 'fixed',
      parseFloat(watchedTaxRate) || 0,
    );
  }, [watchedItems, watchedDiscount, watchedDiscountType, watchedTaxRate]);

  const addItem = () => {
    append({ productId: '', productName: '', quantity: 1, unitPrice: 0, total: 0, size: '' });
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
        <Controller
          control={control}
          name="customerId"
          render={({ field }) => (
            <SelectField
              label="Customer"
              required
              options={[
                ...customerOptions,
                { value: '__create_customer__', label: '+ Create new customer' },
              ]}
              placeholder="Select customer"
              value={field.value}
              onChange={(event) => {
                if (event.target.value === '__create_customer__') {
                  field.onChange('');
                  onCreateCustomer();
                  return;
                }
                field.onChange(event.target.value);
              }}
              error={errors.customerId ?? null}
            />
          )}
        />
        <InputField
          label="Valid Until"
          type="date"
          required
          register={register}
          name="validUntil"
          error={errors.validUntil ?? null}
        />
      </div>

      <div className={styles.formTop}>
        <InputField
          label="Customer Contact (phone or email)"
          required
          placeholder="e.g. +254 712 345 678 or email@example.com"
          register={register}
          name="customerContact"
          error={errors.customerContact ?? null}
        />
        <InputField
          label="Customer Address (optional)"
          placeholder="Customer address"
          register={register}
          name="customerAddress"
          error={errors.customerAddress ?? null}
        />
      </div>

      <InputField
        label="Quote For (description of what this quote is for)"
        required
        placeholder="e.g. Off-grid solar system installation"
        register={register}
        name="quoteFor"
        error={errors.quoteFor ?? null}
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
                <InputField
                  placeholder="Size"
                  register={register}
                  name={`items.${index}.size`}
                  className={styles.itemQty}
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
        placeholder="Add any notes for the customer..."
      />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Create Quotation'}
        </Button>
      </div>
    </form>
  );
}

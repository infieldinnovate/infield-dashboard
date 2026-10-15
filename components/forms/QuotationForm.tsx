'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import TextareaField from './form_elements/textarea';
import SelectField from './form_elements/select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { Customer, Quotation, QuotationItem, Product } from '../../types';
import { quotationFormSchema, QuotationFormData } from '../../schema/formSchema';
import { formatCurrency, calcItemTotal, calcQuotationTotals } from '../../lib/documentUtils';
import styles from './QuotationForm.module.scss';

const DEFAULT_NOTES = 'Prices are valid for 14 days from the date of this quotation.';

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
    taxRate: '16',
    notes: DEFAULT_NOTES,
  };
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

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = useWatch({ control, name: 'items' }) as QuotationItem[];
  const watchedTaxRate = useWatch({ control, name: 'taxRate' }) as string;
  const watchedCustomerId = useWatch({ control, name: 'customerId' }) as string;

  useEffect(() => {
    if (prefillData) {
      reset({ ...prefillData, notes: prefillData.notes || DEFAULT_NOTES });
    } else if (mode === 'edit' && initialValues) {
      reset({
        customerId: initialValues.customerId,
        customerAddress: initialValues.customerAddress || '',
        customerContact: initialValues.customerContact || '',
        quoteFor: initialValues.quoteFor || '',
        items: initialValues.items.map((i) => ({ ...i })),
        taxRate: String(initialValues.taxRate),
        notes: initialValues.notes || DEFAULT_NOTES,
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
        setValue('customerContact', customer.phone || customer.email);
        setValue('customerAddress', customer.address ? `${customer.address}, ${customer.city}` : '');
      }
    }
  }, [watchedCustomerId, customers, setValue]);

  const totals = useMemo(() => {
    const items = (watchedItems || []) as QuotationItem[];
    const taxRate = parseFloat(watchedTaxRate) || 0;
    return calcQuotationTotals(items, taxRate);
  }, [watchedItems, watchedTaxRate]);

  const addItem = () => {
    append({ productId: '', productName: '', quantity: 1, unitPrice: 0, unit: '' });
  };

  const onProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setValue(`items.${index}.productName`, product?.name || '');
    const unitPrice = product?.price || 0;
    setValue(`items.${index}.unitPrice`, unitPrice);
    setValue(`items.${index}.unit`, product?.unit || '');
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
          label="Customer Contact (auto-filled from customer)"
          required
          placeholder="Auto-filled when customer selected"
          register={register}
          name="customerContact"
          error={errors.customerContact ?? null}
        />
      </div>

      <div className={styles.formTop}>
        <InputField
          label="Customer Address (auto-filled from customer)"
          placeholder="Auto-filled when customer selected"
          register={register}
          name="customerAddress"
          error={errors.customerAddress ?? null}
        />
        <InputField
          label="Quote For (description of what this quote is for)"
          required
          placeholder="e.g. Off-grid solar system installation"
          register={register}
          name="quoteFor"
          error={errors.quoteFor ?? null}
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
            <Icon name="Package" size={24} />
            <p>No items added yet. Click &ldquo;Add Item&rdquo; to get started.</p>
          </div>
        ) : (
          <div className={styles.itemsList}>
            <div className={styles.itemRowHeader}>
              <div className={styles.itemProduct}>Product</div>
              <span className={styles.colHeadingUnit}>Unit</span>
              <span className={styles.colHeadingQty}>Qty</span>
              <span className={styles.colHeadingPrice}>Price</span>
              <span className={styles.itemTotal}>Total</span>
              <span style={{ width: 28 }} />
            </div>
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
                  placeholder="Unit"
                  register={register}
                  name={`items.${index}.unit`}
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
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 0;
                        field.onChange(qty);
                      }}
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
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0;
                        field.onChange(price);
                      }}
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

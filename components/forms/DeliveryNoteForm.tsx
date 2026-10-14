'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from './form_elements/input';
import TextareaField from './form_elements/textarea';
import SelectField from './form_elements/select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { DeliveryNote, Invoice, Product } from '../../types';
import { deliveryNoteFormSchema, DeliveryNoteFormData } from '../../schema/formSchema';
import styles from './DeliveryNoteForm.module.scss';

interface DeliveryNoteFormProps {
  mode: 'create' | 'edit';
  initialValues?: DeliveryNote | null;
  onSubmit: (data: DeliveryNoteFormData) => void;
  onCancel: () => void;
  invoiceOptions: { value: string; label: string }[];
  invoices: Invoice[];
  productOptions: { value: string; label: string }[];
  products: Product[];
}

const carrierOptions = [
  { value: 'FedEx', label: 'FedEx' },
  { value: 'UPS Ground', label: 'UPS Ground' },
  { value: 'DHL Express', label: 'DHL Express' },
  { value: 'DHL Freight', label: 'DHL Freight' },
  { value: 'GLS Italy', label: 'GLS Italy' },
  { value: 'USPS', label: 'USPS' },
  { value: 'Other', label: 'Other' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
];

function getDefaultValues(): DeliveryNoteFormData {
  return {
    invoiceId: '',
    customerName: '',
    customerAddress: '',
    recipient: '',
    recipientPhone: '',
    items: [],
    status: 'pending',
    shipDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    carrier: '',
    trackingNumber: '',
    notes: '',
  };
}

export default function DeliveryNoteForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  invoiceOptions,
  invoices,
  productOptions,
  products,
}: DeliveryNoteFormProps) {
  const { register, handleSubmit, reset, control, setValue, formState: { errors } } =
    useForm<DeliveryNoteFormData>({
      resolver: zodResolver(deliveryNoteFormSchema),
      defaultValues: getDefaultValues(),
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      reset({
        invoiceId: initialValues.invoiceId,
        customerName: initialValues.customerName,
        customerAddress: initialValues.customerAddress,
        recipient: initialValues.recipient,
        recipientPhone: initialValues.recipientPhone,
        items: initialValues.items.map((i) => ({ ...i })),
        status: initialValues.status,
        shipDate: initialValues.shipDate,
        deliveryDate: initialValues.deliveryDate || '',
        carrier: initialValues.carrier,
        trackingNumber: initialValues.trackingNumber,
        notes: initialValues.notes,
      });
    } else {
      reset(getDefaultValues());
    }
  }, [mode, initialValues, reset]);

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setValue('invoiceId', invoiceId);
      setValue('customerName', invoice.customerName);
      setValue(
        'customerAddress',
        invoice.customerName === 'Acme Corporation' ? '123 Industrial Parkway, Suite 400, Austin, USA' :
          invoice.customerName === 'Bright Solutions Ltd' ? '45 Baker Street, London, UK' :
            invoice.customerName === 'Delta Logistics GmbH' ? 'Industriestraße 12, Munich, Germany' :
              invoice.customerName === 'Fresh Foods Inc' ? '890 Market Street, San Francisco, USA' :
                invoice.customerName === 'Elena Rossi' ? 'Via Roma 15, Milan, Italy' : 'Unknown Address'
      );
      setValue('items', invoice.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        quantityDelivered: 0,
      })));
    }
  };

  const onProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setValue(`items.${index}.productName`, product?.name || '');
  };

  const addItem = () => {
    append({ productId: '', productName: '', quantity: 1, quantityDelivered: 0 });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formRow}>
        <Controller
          control={control}
          name="invoiceId"
          render={({ field }) => (
            <SelectField
              label="Invoice (Optional)"
              options={[{ value: '', label: 'Select invoice...' }, ...invoiceOptions]}
              value={field.value}
              onChange={(e) => {
                field.onChange(e.target.value);
                handleInvoiceSelect(e.target.value);
              }}
              placeholder="Auto-fill from invoice"
            />
          )}
        />
      </div>

      <div className={styles.formGrid}>
        <InputField
          label="Customer Name"
          required
          register={register}
          name="customerName"
          error={errors.customerName ?? null}
        />
        <InputField
          label="Recipient"
          required
          register={register}
          name="recipient"
          error={errors.recipient ?? null}
        />
      </div>

      <InputField
        label="Delivery Address"
        required
        register={register}
        name="customerAddress"
        error={errors.customerAddress ?? null}
      />
      <InputField
        label="Recipient Phone"
        register={register}
        name="recipientPhone"
        error={errors.recipientPhone ?? null}
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
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      error={fieldState.error ?? null}
                      className={styles.itemQty}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`items.${index}.quantityDelivered`}
                  render={({ field, fieldState }) => (
                    <InputField
                      type="number"
                      placeholder="Delivered"
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      error={fieldState.error ?? null}
                      className={styles.itemQty}
                    />
                  )}
                />
                <button className={styles.removeItem} onClick={() => remove(index)}>
                  <Icon name="X" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.formGrid}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <SelectField
              label="Status"
              options={statusOptions}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          control={control}
          name="carrier"
          render={({ field }) => (
            <SelectField
              label="Carrier"
              options={[{ value: '', label: 'Select carrier...' }, ...carrierOptions]}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
      </div>

      <div className={styles.formGrid}>
        <InputField
          type="date"
          label="Ship Date"
          required
          register={register}
          name="shipDate"
          error={errors.shipDate ?? null}
        />
        <InputField
          type="date"
          label="Delivery Date"
          register={register}
          name="deliveryDate"
          error={errors.deliveryDate ?? null}
        />
      </div>

      <InputField
        label="Tracking Number"
        register={register}
        name="trackingNumber"
        error={errors.trackingNumber ?? null}
        placeholder="Enter tracking number or leave as PENDING"
      />
      <TextareaField
        label="Notes"
        register={register}
        name="notes"
        error={errors.notes ?? null}
        placeholder="Add delivery instructions or notes..."
      />

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>
          {mode === 'edit' ? 'Save Changes' : 'Create Delivery Note'}
        </Button>
      </div>
    </form>
  );
}

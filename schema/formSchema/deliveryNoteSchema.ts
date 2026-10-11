import { z } from 'zod';

export const deliveryItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().min(0, 'Quantity must be >= 0'),
  quantityDelivered: z.number().min(0, 'Delivered quantity must be >= 0'),
});

export const deliveryNoteFormSchema = z.object({
  invoiceId: z.string(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerAddress: z.string().min(1, 'Delivery address is required'),
  recipient: z.string().min(1, 'Recipient is required'),
  recipientPhone: z.string(),
  items: z
    .array(deliveryItemSchema)
    .min(1, 'At least one item is required'),
  status: z.enum(['pending', 'shipped', 'delivered', 'returned']),
  shipDate: z.string().min(1, 'Ship date is required'),
  deliveryDate: z.string(),
  carrier: z.string(),
  trackingNumber: z.string(),
  notes: z.string(),
});

export type DeliveryItemData = z.infer<typeof deliveryItemSchema>;
export type DeliveryNoteFormData = z.infer<typeof deliveryNoteFormSchema>;

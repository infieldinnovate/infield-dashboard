import { z } from 'zod';

export const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string(),
  description: z.string(),
  quantity: z.number().min(0, 'Quantity must be >= 0'),
  unitPrice: z.number().min(0, 'Unit price must be >= 0'),
  total: z.number().min(0),
});

export const invoiceFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z
    .array(invoiceItemSchema)
    .min(1, 'At least one item is required'),
  discount: z
    .string()
    .refine((v) => !isNaN(Number(v)), 'Discount must be a valid number')
    .refine((v) => Number(v) >= 0, 'Discount must be >= 0'),
  discountType: z.enum(['percentage', 'fixed']),
  taxRate: z
    .string()
    .refine((v) => !isNaN(Number(v)), 'Tax rate must be a valid number')
    .refine((v) => Number(v) >= 0, 'Tax rate must be >= 0'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string(),
});

export type InvoiceItemData = z.infer<typeof invoiceItemSchema>;
export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

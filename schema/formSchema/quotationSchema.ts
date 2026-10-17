import { z } from 'zod';

export const quotationItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string(),
  size: z.string().optional(),
  quantity: z.number().min(0, 'Quantity must be >= 0'),
  unitPrice: z.number().min(0, 'Unit price must be >= 0'),
  unit: z.string().optional(),
});

export const quotationFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  customerAddress: z.string(),
  customerContact: z.string().min(1, 'Contact is required (phone or email)'),
  quoteFor: z.string().min(1, 'Description of what the quote is for is required'),
  items: z
    .array(quotationItemSchema)
    .min(1, 'At least one item is required'),
  taxRate: z
    .string()
    .refine((v) => !isNaN(Number(v)), 'Tax rate must be a valid number')
    .refine((v) => Number(v) >= 0, 'Tax rate must be >= 0'),
  notes: z.string(),
});

export type QuotationItemData = z.infer<typeof quotationItemSchema>;
export type QuotationFormData = z.infer<typeof quotationFormSchema>;

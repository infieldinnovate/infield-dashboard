import { z } from 'zod';

export const quoteTemplateItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string(),
  quantity: z.number().min(0, 'Quantity must be >= 0'),
  unitPrice: z.number().min(0, 'Unit price must be >= 0'),
  total: z.number().min(0),
});

export const quoteTemplateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string(),
  category: z.string().min(1, 'Category is required'),
  items: z
    .array(quoteTemplateItemSchema)
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
  notes: z.string(),
});

export type QuoteTemplateItemData = z.infer<typeof quoteTemplateItemSchema>;
export type QuoteTemplateFormData = z.infer<typeof quoteTemplateFormSchema>;

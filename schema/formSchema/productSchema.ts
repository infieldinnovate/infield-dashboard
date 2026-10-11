import { z } from 'zod';

export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(Number(v)), 'Price must be a valid number')
    .refine((v) => Number(v) >= 0, 'Price must be greater than or equal to 0'),
  cost: z
    .string()
    .min(1, 'Cost is required')
    .refine((v) => !isNaN(Number(v)), 'Cost must be a valid number')
    .refine((v) => Number(v) >= 0, 'Cost must be greater than or equal to 0'),
  stock: z
    .string()
    .min(1, 'Stock is required')
    .refine((v) => !isNaN(Number(v)), 'Stock must be a valid number')
    .refine((v) => Number(v) >= 0, 'Stock must be greater than or equal to 0')
    .refine((v) => Number.isInteger(Number(v)), 'Stock must be a whole number'),
  category: z.string().min(1, 'Category is required'),
  sku: z.string().min(1, 'SKU is required'),
  unit: z.string().min(1, 'Unit is required'),
  description: z.string(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

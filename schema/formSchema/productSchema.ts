import { z } from 'zod';

export const productFormSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  size: z.string().min(1, 'Size is required'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((v) => !isNaN(Number(v)), 'Price must be a valid number')
    .refine((v) => Number(v) >= 0, 'Price must be greater than or equal to 0'),
  stock: z
    .string()
    .min(1, 'Stock is required')
    .refine((v) => !isNaN(Number(v)), 'Stock must be a valid number')
    .refine((v) => Number(v) >= 0, 'Stock must be greater than or equal to 0')
    .refine((v) => Number.isInteger(Number(v)), 'Stock must be a whole number'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

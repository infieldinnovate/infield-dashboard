import { z } from 'zod';

export const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z.string(),
  phone2: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  categories: z.string().min(1, 'At least one category is required'),
});

export type SupplierFormData = z.infer<typeof supplierFormSchema>;

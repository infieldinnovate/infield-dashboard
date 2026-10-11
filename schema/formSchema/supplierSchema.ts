import { z } from 'zod';

export const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  taxId: z.string(),
  paymentTerms: z.string().min(1, 'Payment terms are required'),
  leadTime: z
    .string()
    .refine((v) => v === '' || !isNaN(Number(v)), 'Lead time must be a valid number')
    .refine((v) => v === '' || Number(v) >= 0, 'Lead time must be greater than or equal to 0'),
  status: z.enum(['active', 'inactive']),
  rating: z
    .string()
    .refine((v) => v === '' || !isNaN(Number(v)), 'Rating must be a valid number')
    .refine((v) => v === '' || (Number(v) >= 0 && Number(v) <= 5), 'Rating must be between 0 and 5'),
  categories: z.string().min(1, 'At least one category is required'),
});

export type SupplierFormData = z.infer<typeof supplierFormSchema>;

import { z } from 'zod';

export const customerFormSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  taxId: z.string(),
  creditLimit: z
    .string()
    .refine((v) => v === '' || !isNaN(Number(v)), 'Credit limit must be a valid number'),
  type: z.enum(['individual', 'business']),
  status: z.enum(['active', 'inactive']),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

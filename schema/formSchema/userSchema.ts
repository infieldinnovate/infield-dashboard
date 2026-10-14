import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  phone: z.string(),
  role: z.enum(['admin', 'manager', 'cashier', 'sales']),
  status: z.enum(['active', 'inactive']),
  jobTitle: z.string(),
  signature: z.string(),
});

export type UserFormData = z.infer<typeof userFormSchema>;

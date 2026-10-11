import { z } from 'zod';

export const leadFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_person: z.string(),
  phone: z.string(),
  email: z
    .string()
    .refine(
      (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'Invalid email address',
    ),
  location: z.string(),
  interested_service: z.enum(['Solar', 'Electrical', 'Boreholes', 'Irrigation', 'Plumbing', 'Other']),
  lead_source: z.string(),
  status: z.enum(['new', 'contacted', 'interested', 'quoted', 'won', 'lost']),
  last_contact_date: z.string(),
  follow_up_date: z.string(),
  notes: z.string(),
  marketing_consent: z.boolean(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

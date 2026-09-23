import { AppSettings } from '../types';

export const defaultSettings: AppSettings = {
  business: {
    businessName: 'INFIELD INNOVATIONS',
    address: 'Meru Makutano, C91, Opp. Equity Bank',
    phone: '+254 702 393 677',
    email: 'infieldinnovations@gmail.com',
    website: '',
    logo: '',
  },
  numbering: {
    quotationPrefix: 'QUO',
    quotationNextNumber: 6,
    invoicePrefix: 'INV',
    invoiceNextNumber: 7,
    receiptPrefix: 'RCP',
    receiptNextNumber: 8,
    deliveryPrefix: 'DN',
    deliveryNextNumber: 6,
  },
  tax: {
    taxRate: 16,
    taxId: 'KRA-PIN-AVAILABLE-ON-REQUEST',
    taxInclusive: false,
  },
  currency: {
    currency: 'KES - Kenya Shilling',
    currencySymbol: 'KSh',
    currencyPosition: 'before',
    decimalPlaces: 0,
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  theme: {
    mode: 'light',
    color: 'blue',
    fontSize: 'medium',
  },
  print: {
    pageSize: 'a4',
    orientation: 'portrait',
    showLogo: true,
    showBusinessInfo: true,
    showTaxId: true,
    footerText: 'Thank you for choosing Infield Innovations!',
    accentColor: true,
  },
};

export const currencyOptions = [
  { value: 'KES - Kenya Shilling', label: 'KES - Kenya Shilling (KSh)' },
  { value: 'USD - US Dollar', label: 'USD - US Dollar ($)' },
  { value: 'EUR - Euro', label: 'EUR - Euro (€)' },
  { value: 'GBP - British Pound', label: 'GBP - British Pound (£)' },
  { value: 'TZS - Tanzanian Shilling', label: 'TZS - Tanzanian Shilling (TSh)' },
  { value: 'UGX - Ugandan Shilling', label: 'UGX - Ugandan Shilling (USh)' },
];

export const themeColorOptions = [
  { value: 'blue', label: 'Ocean Blue' },
  { value: 'teal', label: 'Teal' },
  { value: 'green', label: 'Emerald' },
  { value: 'amber', label: 'Amber' },
  { value: 'rose', label: 'Rose' },
  { value: 'violet', label: 'Violet' },
];

export const businessCategories = [
  'Solar Solutions',
  'Electrical Installations',
  'Plumbing Services',
  'Borehole Solutions',
  'Irrigation Systems',
];

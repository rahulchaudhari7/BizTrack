export const NEPAL_PROVINCES = [
  'Koshi Province',
  'Madhesh Province',
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province',
] as const;

export type NepalProvince = (typeof NEPAL_PROVINCES)[number];

export const DISTRICTS_BY_PROVINCE: Record<NepalProvince, string[]> = {
  'Koshi Province': [
    'Bhojpur',
    'Dhankuta',
    'Ilam',
    'Jhapa',
    'Khotang',
    'Morang',
    'Okhaldhunga',
    'Panchthar',
    'Sankhuwasabha',
    'Solukhumbu',
    'Sunsari',
    'Taplejung',
    'Terhathum',
    'Udayapur',
  ],
  'Madhesh Province': [
    'Bara',
    'Dhanusha',
    'Mahottari',
    'Parsa',
    'Rautahat',
    'Saptari',
    'Sarlahi',
    'Siraha',
  ],
  'Bagmati Province': [
    'Bhaktapur',
    'Chitwan',
    'Dhading',
    'Dolakha',
    'Kathmandu',
    'Kavrepalanchok',
    'Lalitpur',
    'Makwanpur',
    'Nuwakot',
    'Ramechhap',
    'Rasuwa',
    'Sindhuli',
    'Sindhupalchok',
  ],
  'Gandaki Province': [
    'Baglung',
    'Gorkha',
    'Kaski',
    'Lamjung',
    'Manang',
    'Mustang',
    'Myagdi',
    'Nawalpur',
    'Parbat',
    'Syangja',
    'Tanahun',
  ],
  'Lumbini Province': [
    'Arghakhanchi',
    'Banke',
    'Bardiya',
    'Dang',
    'Gulmi',
    'Kapilvastu',
    'Parasi',
    'Palpa',
    'Pyuthan',
    'Rolpa',
    'Rukum East',
    'Rupandehi',
  ],
  'Karnali Province': [
    'Dailekh',
    'Dolpa',
    'Humla',
    'Jajarkot',
    'Jumla',
    'Kalikot',
    'Mugu',
    'Salyan',
    'Surkhet',
    'Western Rukum',
  ],
  'Sudurpashchim Province': [
    'Achham',
    'Baitadi',
    'Bajhang',
    'Bajura',
    'Dadeldhura',
    'Darchula',
    'Doti',
    'Kailali',
    'Kanchanpur',
  ],
};

export const NEPAL_BUSINESS_TYPES = [
  'Retail Shop',
  'Wholesale & Distribution',
  'Grocery & General Store',
  'Restaurant & Cafe',
  'Hardware & Sanitary',
  'Mobile & Electronics',
  'Pharmacy & Clinic',
  'Clothing & Fashion Boutique',
  'Handicraft & Pashmina',
  'Hotel, Lodge & Resort',
  'Automobile & Spare Parts',
  'Printing & Stationery',
  'Bakery & Confectionery',
  'Service, Repair & Maintenance',
  'IT & Software Agency',
  'Agriculture & Poultry',
  'Other Business',
];

export const NEPAL_BUSINESS_CATEGORIES = [
  'Trading & Retail',
  'Food & Beverages',
  'Electronics & Tech',
  'Health & Medical',
  'Apparel & Textiles',
  'Construction & Hardware',
  'Tourism & Hospitality',
  'Services & Consulting',
  'Manufacturing & Production',
  'Agriculture & Livestock',
  'Education & Training',
  'Automotive',
  'Personal Care & Salon',
  'General Commerce',
];

export const NEPAL_PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Fonepay',
  'eSewa',
  'Khalti',
  'IME Pay',
  'ConnectIPS',
  'Debit Card',
  'Credit Card',
  'Cheque',
  'Other',
];

export const NEPAL_BUSINESS_EXPENSE_CATEGORIES = [
  'Inventory / Stock',
  'Rent',
  'Salary',
  'Transportation',
  'Utilities',
  'Marketing',
  'Advertising',
  'Office Supplies',
  'Equipment',
  'Maintenance',
  'Internet',
  'Phone',
  'Bank Charges',
  'Taxes',
  'Other',
];

export const NEPAL_PERSONAL_EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Shopping',
  'Education',
  'Family',
  'Entertainment',
  'Medical',
  'Travel',
  'Other',
];

export const CURRENCIES = [
  { code: 'NPR', symbol: 'रु', label: 'NPR (रु) - Nepalese Rupee' },
];

/**
 * Validate and format Nepal phone numbers
 * Accepts: 9841234567, +9779841234567, +977 9841234567, 014234567, 97...
 */
export function formatNepalPhone(input: string): string {
  if (!input) return '';
  const cleaned = input.trim();
  if (cleaned.startsWith('+977')) {
    const rest = cleaned.substring(4).replace(/\s+/g, '');
    return `+977 ${rest}`;
  }
  const digits = cleaned.replace(/\D/g, '');
  if (digits.startsWith('977')) {
    return `+977 ${digits.substring(3)}`;
  }
  if (digits.length >= 7) {
    return `+977 ${digits}`;
  }
  return cleaned;
}

export function isValidNepalPhone(phone: string): boolean {
  if (!phone) return true; // Optional in some forms
  const digits = phone.replace(/\D/g, '');
  // Mobile numbers in Nepal are 10 digits (often starts with 98 or 97)
  // Landlines are 8-9 digits with area code
  // If +977 prefix was included: 12-13 digits
  if (digits.startsWith('977')) {
    const local = digits.substring(3);
    return local.length >= 8 && local.length <= 10;
  }
  return digits.length >= 7 && digits.length <= 10;
}

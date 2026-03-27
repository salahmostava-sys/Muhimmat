// ─── Salary Slip Multi-Language Translation Dictionary ────────────────────────
// Supports: Arabic (ar) | English (en) | Urdu (ur)
// RTL languages: ar, ur  |  LTR languages: en

export type SlipLanguage = 'ar' | 'en' | 'ur';

export const LANGUAGE_META: Record<SlipLanguage, { label: string; dir: 'rtl' | 'ltr'; flag: string; fontFamily: string }> = {
  ar: { label: 'العربية',  dir: 'rtl', flag: '🇸🇦', fontFamily: 'Arial, sans-serif' },
  en: { label: 'English',  dir: 'ltr', flag: '🇬🇧', fontFamily: 'Arial, sans-serif' },
  ur: { label: 'اردو',     dir: 'rtl', flag: '🇵🇰', fontFamily: 'Arial, sans-serif' },
};

export interface SlipTranslations {
  // Header
  title: string;
  subtitle: string;
  // Employee Info
  sectionEmployee: string;
  name: string;
  nationalId: string;
  city: string;
  month: string;
  status: string;
  paymentMethod: string;
  // Status values
  statusPending: string;
  statusApproved: string;
  statusPaid: string;
  // Payment methods
  payBank: string;
  payCash: string;
  // Platforms
  sectionPlatforms: string;
  orders: string;
  platformTotal: string;
  // Additions
  sectionAdditions: string;
  incentives: string;
  sickAllowance: string;
  totalWithSalary: string;
  // Earnings section label
  sectionEarnings: string;
  // Deductions
  sectionDeductions: string;
  advanceInstallment: string;
  externalDeductions: string;
  violations: string;
  walletHunger: string;
  walletTuyo: string;
  walletJahiz: string;
  foodDamage: string;
  totalDeductions: string;
  // Net
  netSalary: string;
  transfer: string;
  remaining: string;
  advanceBalance: string;
  // Footer
  signatureDriver: string;
  signatureAdmin: string;
  // Currency
  currency: string;
  // Buttons
  printPdf: string;
  approve: string;
  close: string;
}

const SLIP_KEYS = [
  'title',
  'subtitle',
  'sectionEmployee',
  'name',
  'nationalId',
  'city',
  'month',
  'status',
  'paymentMethod',
  'statusPending',
  'statusApproved',
  'statusPaid',
  'payBank',
  'payCash',
  'sectionPlatforms',
  'orders',
  'platformTotal',
  'sectionAdditions',
  'incentives',
  'sickAllowance',
  'totalWithSalary',
  'sectionEarnings',
  'sectionDeductions',
  'advanceInstallment',
  'externalDeductions',
  'violations',
  'walletHunger',
  'walletTuyo',
  'walletJahiz',
  'foodDamage',
  'totalDeductions',
  'netSalary',
  'transfer',
  'remaining',
  'advanceBalance',
  'signatureDriver',
  'signatureAdmin',
  'currency',
  'printPdf',
  'approve',
  'close',
] as const satisfies readonly (keyof SlipTranslations)[];

const toSlipTranslations = (values: readonly string[]): SlipTranslations => {
  if (values.length !== SLIP_KEYS.length) {
    throw new Error(`salarySlipTranslations: expected ${SLIP_KEYS.length} values, got ${values.length}`);
  }
  return Object.fromEntries(SLIP_KEYS.map((key, idx) => [key, values[idx]])) as SlipTranslations;
};

const translations: Record<SlipLanguage, SlipTranslations> = {
  ar: toSlipTranslations([
    'كشف راتب',
    'نظام إدارة التوصيل',
    'بيانات المندوب',
    'الاسم',
    'رقم الهوية',
    'المدينة',
    'الشهر',
    'الحالة',
    'طريقة الصرف',
    'معلّق',
    'معتمد',
    'مصروف',
    '🏦 بنك',
    '💵 كاش',
    'الطلبات حسب المنصة',
    'طلب',
    'إجمالي الراتب الأساسي',
    'الإضافات',
    'الحوافز',
    'بدل مرضي',
    'المجموع مع الراتب',
    'الاستحقاقات',
    'المستقطعات',
    'قسط سلفة',
    'خصومات خارجية',
    'المخالفات',
    'محفظة هنقرستيشن',
    'محفظة تويو',
    'محفظة جاهز',
    'تلف طعام',
    'إجمالي المستقطعات',
    'إجمالي الراتب الصافي',
    'التحويل',
    'المتبقي',
    'رصيد السلفة المتبقي',
    'توقيع المندوب',
    'اعتماد الإدارة',
    'ر.س',
    'طباعة PDF',
    'اعتماد',
    'إغلاق',
  ]),
  en: toSlipTranslations([
    'Salary Slip',
    'Delivery Management System',
    'Employee Information',
    'Name',
    'ID Number',
    'City',
    'Month',
    'Status',
    'Payment Method',
    'Pending',
    'Approved',
    'Paid',
    '🏦 Bank Transfer',
    '💵 Cash',
    'Orders by Platform',
    'orders',
    'Total Base Salary',
    'Additions',
    'Incentives',
    'Sick Leave Allowance',
    'Total with Salary',
    'Earnings',
    'Deductions',
    'Advance Installment',
    'External Deductions',
    'Violations',
    'HungerStation Wallet',
    'Tuyo Wallet',
    'Jahiz Wallet',
    'Food Damage',
    'Total Deductions',
    'Net Salary',
    'Transfer',
    'Remaining',
    'Remaining Advance Balance',
    "Driver's Signature",
    'Management Approval',
    'SAR',
    'Print PDF',
    'Approve',
    'Close',
  ]),
  ur: toSlipTranslations([
    'تنخواہ سلپ',
    'ڈیلیوری مینجمنٹ سسٹم',
    'ملازم کی معلومات',
    'نام',
    'شناختی نمبر',
    'شہر',
    'مہینہ',
    'حیثیت',
    'ادائیگی کا طریقہ',
    'زیر التواء',
    'منظور شدہ',
    'ادا شدہ',
    '🏦 بینک',
    '💵 نقد',
    'پلیٹ فارم کے مطابق آرڈرز',
    'آرڈر',
    'بنیادی تنخواہ کا مجموعہ',
    'اضافے',
    'مراعات',
    'بیماری الاؤنس',
    'تنخواہ سمیت کل',
    'آمدنی',
    'کٹوتیاں',
    'پیشگی قسط',
    'بیرونی کٹوتیاں',
    'خلاف ورزیاں',
    'ہنگر اسٹیشن والٹ',
    'تویو والٹ',
    'جاہز والٹ',
    'کھانے کا نقصان',
    'کل کٹوتیاں',
    'خالص تنخواہ',
    'ٹرانسفر',
    'باقی',
    'باقی پیشگی رقم',
    'ڈرائیور کے دستخط',
    'انتظامیہ کی منظوری',
    'ریال',
    'PDF پرنٹ',
    'منظور کریں',
    'بند کریں',
  ]),
};

export const getSlipTranslations = (lang: SlipLanguage): SlipTranslations => translations[lang];

export const getStatusLabel = (status: string, lang: SlipLanguage): string => {
  const t = translations[lang];
  if (status === 'approved') return t.statusApproved;
  if (status === 'paid') return t.statusPaid;
  return t.statusPending;
};

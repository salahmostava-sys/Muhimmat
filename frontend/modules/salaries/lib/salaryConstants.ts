import type { SalaryRow } from '@modules/salaries/types/salary.types';

/** يُحدَّث من واجهة الرواتب عند تحميل ألوان المنصات */
export const PLATFORM_COLORS: Record<
  string,
  { header: string; headerText: string; cellBg: string; valueColor: string; focusBorder: string }
> = {};

export const statusLabels: Record<string, string> = { pending: 'معلّق', approved: 'معتمد', paid: 'مصروف' };
export const statusStyles: Record<string, string> = { pending: 'badge-warning', approved: 'badge-info', paid: 'badge-success' };

export const SALARY_CARD_SKELETON_KEYS = [
  'salary-card-skeleton-1',
  'salary-card-skeleton-2',
  'salary-card-skeleton-3',
  'salary-card-skeleton-4',
  'salary-card-skeleton-5',
  'salary-card-skeleton-6',
  'salary-card-skeleton-7',
  'salary-card-skeleton-8',
] as const;

export const getStatusStyleForPrint = (status: SalaryRow['status']) => {
  if (status === 'paid') return 'background:#dcfce7;color:#15803d';
  if (status === 'approved') return 'background:#dbeafe;color:#1d4ed8';
  return 'background:#fef9c3;color:#92400e';
};

export const getOrdersCellBackground = (
  orders: number,
  hitTarget: boolean,
  defaultBackground: string | undefined
) => {
  if (orders === 0) return undefined;
  if (hitTarget) return 'rgba(34,197,94,0.08)';
  return defaultBackground;
};

export const toComparableSortValue = (value: unknown): string | number => {
  if (typeof value === 'number' || typeof value === 'string') return value;
  return Number(value) || 0;
};

export const shortEmployeeName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[1]}`;
};

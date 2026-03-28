import { format } from 'date-fns';

export function generateMonths() {
  const months: { v: string; l: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const v = format(d, 'yyyy-MM');
    const l = d.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
    months.push({ v, l });
  }
  return months;
}

export const months = generateMonths();

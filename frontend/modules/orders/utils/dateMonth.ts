export const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

export const monthLabel = (y: number, m: number) =>
  new Date(y, m - 1, 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

export const dateStr = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export const monthYear = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;

export const shiftMonth = (y: number, m: number, delta: number) => {
  const d = new Date(y, m - 1 + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
};

export const isPastMonth = (y: number, m: number) => {
  const now = new Date();
  const currentMonthIndex = now.getFullYear() * 12 + (now.getMonth() + 1);
  const selectedMonthIndex = y * 12 + m;
  return selectedMonthIndex < currentMonthIndex;
};

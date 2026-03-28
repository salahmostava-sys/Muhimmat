export const toCityArabic = (city?: string | null, fallback = '') => {
  if (city === 'makkah') return 'مكة';
  if (city === 'jeddah') return 'جدة';
  return fallback;
};

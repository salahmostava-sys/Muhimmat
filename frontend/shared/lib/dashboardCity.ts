export type DashboardCityKey = 'makkah' | 'jeddah';

export const getDashboardCityKey = (city: string | null): DashboardCityKey | null => {
  const normalized = String(city ?? '').trim().toLowerCase();
  if (normalized === 'makkah' || normalized === 'mecca' || normalized === 'مكة' || normalized === 'مكة المكرمة') {
    return 'makkah';
  }
  if (normalized === 'jeddah' || normalized === 'jedda' || normalized === 'جدة') {
    return 'jeddah';
  }
  return null;
};

export const mapDashboardCityLabel = (city: string) => {
  const key = getDashboardCityKey(city);
  if (key === 'makkah') return 'مكة المكرمة';
  if (key === 'jeddah') return 'جدة';
  return city;
};


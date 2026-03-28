import { useMemo } from 'react';
import type { DailyOrder } from '@services/orderService';

/** صف تحليلات: إما `DailyOrder` أو صف عام (منصة + تاريخ + عدد اختياري). */
export type AnalyticsOrderRow =
  | DailyOrder
  | {
      employee_id: string;
      app_id?: string;
      platform_id?: string;
      date?: string;
      created_at?: string;
      orders_count?: number;
    };

export type AnalyticsAggregates = {
  /** إجمالي الطلبات لكل منصة (`app_id` أو `platform_id`) */
  platform: Record<string, number>;
  employee: Record<string, number>;
  daily: Record<string, number>;
  topPlatform: [string, number] | undefined;
  topEmployee: [string, number] | undefined;
};

function platformKey(o: AnalyticsOrderRow): string {
  if ('app_id' in o && o.app_id) return o.app_id;
  if ('platform_id' in o && o.platform_id) return o.platform_id;
  return '';
}

function dayKey(o: AnalyticsOrderRow): string {
  let d = '';
  if ('date' in o && o.date) d = o.date;
  else if ('created_at' in o && o.created_at) d = o.created_at;
  if (!d) return '';
  return d.includes('T') ? d.split('T')[0] : d;
}

function countForRow(o: AnalyticsOrderRow): number {
  if ('orders_count' in o && o.orders_count != null && typeof o.orders_count === 'number') {
    return o.orders_count;
  }
  return 1;
}

/**
 * يجمع الطلبات حسب المنصة والموظف واليوم.
 * لصفوف `daily_orders` يُستخدم `orders_count`؛ إن وُجد صف بلا `orders_count` يُعامل كـ +1 (مثل سجل حدث واحد).
 */
export function useAnalytics(
  orders: AnalyticsOrderRow[] | null | undefined,
): AnalyticsAggregates | null {
  return useMemo(() => {
    if (!orders?.length) return null;

    const platform: Record<string, number> = {};
    const employee: Record<string, number> = {};
    const daily: Record<string, number> = {};

    for (const o of orders) {
      const n = countForRow(o);
      const pk = platformKey(o);
      const date = dayKey(o);

      if (pk) {
        platform[pk] = (platform[pk] ?? 0) + n;
      }
      employee[o.employee_id] = (employee[o.employee_id] ?? 0) + n;
      if (date) {
        daily[date] = (daily[date] ?? 0) + n;
      }
    }

    const sortedPlatform = Object.entries(platform).sort((a, b) => b[1] - a[1]);
    const sortedEmployee = Object.entries(employee).sort((a, b) => b[1] - a[1]);
    const topPlatform = sortedPlatform[0];
    const topEmployee = sortedEmployee[0];

    return {
      platform,
      employee,
      daily,
      topPlatform,
      topEmployee,
    };
  }, [orders]);
}

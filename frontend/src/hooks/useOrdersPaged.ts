import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import type { BranchKey } from '@/components/table/GlobalTableFilters';
import { authQueryUserId, useAuthQueryGate } from '@/hooks/useAuthQueryGate';
import { useQueryErrorToast } from '@/hooks/useQueryErrorToast';

export type OrdersPagedFilters = {
  driverId?: string | 'all';
  platformAppId?: string | 'all';
  branch?: BranchKey;
  search?: string;
};

export function useOrdersMonthPaged(params: {
  monthYear: string;
  page: number;
  pageSize: number;
  filters: OrdersPagedFilters;
}) {
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(userId);
  const { monthYear, page, pageSize, filters } = params;
  const driverId = filters.driverId && filters.driverId !== 'all' ? filters.driverId : undefined;
  const appId = filters.platformAppId && filters.platformAppId !== 'all' ? filters.platformAppId : undefined;
  const branch = filters.branch && filters.branch !== 'all' ? (filters.branch as 'makkah' | 'jeddah') : undefined;
  const search = filters.search?.trim() ? filters.search.trim() : undefined;

  const q = useQuery({
    queryKey: ['orders', uid, 'month-paged', monthYear, page, pageSize, driverId ?? null, appId ?? null, branch ?? null, search ?? null] as const,
    queryFn: async () => {
      const res = await orderService.getMonthPaged({
        monthYear,
        page,
        pageSize,
        filters: { employeeId: driverId, appId, branch, search },
      });
      return res;
    },
    retry: 1,
    staleTime: 15_000,
    enabled,
  });
  useQueryErrorToast(q.isError, q.error, 'تعذر تحميل الطلبات');
  return q;
}


import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@shared/components/ui/sonner';
import { TOAST_ERROR_GENERIC, TOAST_SUCCESS_ACTION } from '@shared/lib/toastMessages';
import { authQueryUserId, useAuthQueryGate } from '@shared/hooks/useAuthQueryGate';
import { defaultQueryRetry } from '@shared/lib/query';
import { orderService } from '@services/orderService';
import { filterVisibleEmployeesInMonth } from '@shared/lib/employeeVisibility';
import { useMonthlyActiveEmployeeIds } from '@shared/hooks/useMonthlyActiveEmployeeIds';
import { useOrdersMonthPaged, type OrdersMonthPagedRow } from '@shared/hooks/useOrdersPaged';
import { createDefaultGlobalFilters, type GlobalTableFilterState } from '@shared/components/table/GlobalTableFilters';
import type { PagedResult } from '@shared/types/pagination';
import type { App, Employee } from '@modules/orders/types';
import { monthYear } from '@modules/orders/utils/dateMonth';
import { loadXlsx } from '@modules/orders/utils/xlsx';
import { toCityArabic } from '@modules/orders/utils/cityLabel';

export function useOrdersListTab() {
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(userId);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const monthKey = monthYear(year, month);
  const { data: activeIdsData } = useMonthlyActiveEmployeeIds(monthKey);
  const activeEmployeeIdsInMonth = activeIdsData?.employeeIds;

  const [filters, setFilters] = useState<GlobalTableFilterState>(() => createDefaultGlobalFilters());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data: baseData } = useQuery({
    queryKey: ['orders', uid, 'list', 'base'] as const,
    queryFn: async () => {
      const [empRows, apps] = await Promise.all([
        orderService.getActiveEmployees(),
        orderService.getActiveApps(),
      ]);
      return {
        employees: filterVisibleEmployeesInMonth(
          (empRows || []) as unknown as { id: string; sponsorship_status?: string | null }[],
          activeEmployeeIdsInMonth,
        ) as unknown as Employee[],
        apps: (apps || []) as App[],
      };
    },
    enabled: enabled && !!activeIdsData,
    staleTime: 60_000,
    retry: defaultQueryRetry,
  });

  useEffect(() => {
    setPage(1);
  }, [filters, monthKey]);

  const paged = useOrdersMonthPaged({
    monthYear: monthKey,
    page,
    pageSize,
    filters: {
      branch: filters.branch,
      driverId: filters.driverId,
      platformAppIds: filters.platformAppIds,
      search: filters.search,
    },
  });

  const pageData = paged.data as PagedResult<OrdersMonthPagedRow> | undefined;
  const total = pageData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rows: OrdersMonthPagedRow[] = pageData?.rows ?? [];

  const handleExportMonth = async () => {
    try {
      const XLSX = await loadXlsx();
      const raw = await orderService.getMonthRaw(year, month);
      const empMap = Object.fromEntries((baseData?.employees ?? []).map((e) => [e.id, e]));
      const appMap = Object.fromEntries((baseData?.apps ?? []).map((a) => [a.id, a]));
      const out = (raw || []).map((r) => ({
        التاريخ: r.date,
        المندوب: empMap[r.employee_id]?.name ?? r.employee_id,
        الفرع: toCityArabic(empMap[r.employee_id]?.city, ''),
        المنصة: appMap[r.app_id]?.name ?? r.app_id,
        الطلبات: r.orders_count,
      }));
      const ws = XLSX.utils.json_to_sheet(out);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      XLSX.writeFile(wb, `orders_${monthKey}.xlsx`);
      toast.success(TOAST_SUCCESS_ACTION, { description: `orders_${monthKey}.xlsx` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'تعذر تصدير البيانات';
      toast.error(TOAST_ERROR_GENERIC, { description: msg });
    }
  };

  return {
    year,
    setYear,
    month,
    setMonth,
    monthKey,
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    baseData,
    paged,
    total,
    totalPages,
    rows,
    handleExportMonth,
  };
}

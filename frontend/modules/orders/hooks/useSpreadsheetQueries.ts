import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@services/orderService';
import { filterVisibleEmployeesInMonth } from '@shared/lib/employeeVisibility';
import { defaultQueryRetry } from '@shared/lib/query';
import type { App, DailyData, Employee, EmployeeAppAssignmentRow, OrderRawRow } from '@modules/orders/types';
import { buildAppEmployeeIdsMap, buildDailyDataMap } from '@modules/orders/utils/gridHelpers';
import { monthYear } from '@modules/orders/utils/dateMonth';
import { ordersQueryKeys } from '@modules/orders/hooks/ordersQueryKeys';

export function useSpreadsheetQueries(
  uid: string,
  enabled: boolean,
  year: number,
  month: number,
  activeEmployeeIdsInMonth: ReadonlySet<string> | undefined,
) {
  const qk = ordersQueryKeys(uid);

  const {
    data: spreadsheetBaseData,
    error: spreadsheetBaseError,
    isLoading: spreadsheetBaseLoading,
  } = useQuery({
    queryKey: qk.spreadsheetBase,
    enabled,
    queryFn: async () => {
      const [employees, apps, employeeApps] = await Promise.all([
        orderService.getActiveEmployees(),
        orderService.getActiveApps(),
        orderService.getEmployeeAppAssignments(),
      ]);
      return {
        employees: (employees || []) as Employee[],
        apps: (apps || []) as App[],
        employeeApps: (employeeApps || []) as EmployeeAppAssignmentRow[],
      };
    },
    select: (base) => ({
      employees: base.employees,
      apps: base.apps,
      appEmployeeIdsMap: buildAppEmployeeIdsMap(base.employeeApps),
    }),
    retry: defaultQueryRetry,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const {
    data: spreadsheetMonthData = {},
    error: spreadsheetMonthError,
    isLoading: spreadsheetMonthLoading,
  } = useQuery({
    queryKey: qk.spreadsheetMonthRaw(year, month),
    enabled,
    queryFn: async () => {
      const rows = await orderService.getMonthRaw(year, month);
      return (rows || []) as OrderRawRow[];
    },
    select: (rows) => buildDailyDataMap(rows),
    retry: defaultQueryRetry,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: spreadsheetMonthLock = false, error: spreadsheetLockError } = useQuery({
    queryKey: qk.spreadsheetMonthLock(year, month),
    enabled,
    queryFn: async () => {
      const my = monthYear(year, month);
      return orderService.getMonthLockStatus(my);
    },
    select: (res) => res.locked,
    retry: defaultQueryRetry,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const loading = spreadsheetBaseLoading || spreadsheetMonthLoading;

  const apps = useMemo<App[]>(() => spreadsheetBaseData?.apps ?? [], [spreadsheetBaseData]);
  const appEmployeeIds = useMemo(
    () => spreadsheetBaseData?.appEmployeeIdsMap ?? {},
    [spreadsheetBaseData],
  );
  const employees = useMemo<Employee[]>(
    () => filterVisibleEmployeesInMonth(spreadsheetBaseData?.employees ?? [], activeEmployeeIdsInMonth),
    [spreadsheetBaseData, activeEmployeeIdsInMonth],
  );

  return {
    qk,
    spreadsheetBaseData,
    spreadsheetBaseError,
    spreadsheetMonthData: spreadsheetMonthData as DailyData,
    spreadsheetMonthError,
    spreadsheetMonthLock,
    spreadsheetLockError,
    loading,
    apps,
    appEmployeeIds,
    employees,
  };
}

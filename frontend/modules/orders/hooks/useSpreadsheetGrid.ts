import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useMonthlyActiveEmployeeIds } from '@shared/hooks/useMonthlyActiveEmployeeIds';
import { usePermissions } from '@shared/hooks/usePermissions';
import { toast } from '@shared/components/ui/sonner';
import { TOAST_ERROR_GENERIC, TOAST_SUCCESS_ACTION } from '@shared/lib/toastMessages';
import { authQueryUserId, useAuthQueryGate } from '@shared/hooks/useAuthQueryGate';
import { orderService } from '@services/orderService';
import type { DailyData } from '@modules/orders/types';
import type { OrdersPopoverState } from '@shared/components/orders/OrdersCellPopover';
import { useSpreadsheetQueries } from '@modules/orders/hooks/useSpreadsheetQueries';
import {
  calculatePlatformTotals,
  collectEmployeeIdsWithOrdersOnApp,
} from '@modules/orders/utils/gridHelpers';
import {
  exportSpreadsheetExcel,
  runSpreadsheetImport,
  downloadSpreadsheetTemplate,
  printSpreadsheetTable,
  saveSpreadsheetMonth,
} from '@modules/orders/utils/spreadsheetFileOps';
import { getDaysInMonth, monthYear, shiftMonth, isPastMonth } from '@modules/orders/utils/dateMonth';

export function useSpreadsheetGrid() {
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(userId);
  const { permissions } = usePermissions('orders');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const [data, setData] = useState<DailyData>({});
  const [saving, setSaving] = useState(false);
  const [expandedEmp, setExpandedEmp] = useState<Set<string>>(new Set());
  const [cellPopover, setCellPopover] = useState<OrdersPopoverState | null>(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [isMonthLocked, setIsMonthLocked] = useState(false);
  const [lockingMonth, setLockingMonth] = useState(false);

  const monthKey = monthYear(year, month);
  const { data: activeIdsData } = useMonthlyActiveEmployeeIds(monthKey);
  const activeEmployeeIdsInMonth = activeIdsData?.employeeIds;

  const sq = useSpreadsheetQueries(uid, enabled, year, month, activeEmployeeIdsInMonth);
  const canEditMonth = permissions.can_edit && !isMonthLocked;

  useEffect(() => {
    setData(sq.spreadsheetMonthData);
  }, [sq.spreadsheetMonthData]);

  useEffect(() => {
    setIsMonthLocked(sq.spreadsheetMonthLock);
  }, [sq.spreadsheetMonthLock]);

  useEffect(() => {
    const error = sq.spreadsheetBaseError || sq.spreadsheetMonthError || sq.spreadsheetLockError;
    if (!error) return;
    const message = error instanceof Error ? error.message : 'فشل تحميل بيانات الطلبات';
    toast.error(TOAST_ERROR_GENERIC, { description: message });
  }, [sq.spreadsheetBaseError, sq.spreadsheetMonthError, sq.spreadsheetLockError]);

  const employeeIdsWithOrdersOnFilteredPlatform = useMemo(() => {
    if (platformFilter === 'all') return new Set<string>();
    return collectEmployeeIdsWithOrdersOnApp(data, platformFilter);
  }, [data, platformFilter]);

  const baseEmployees = useMemo(() => {
    if (platformFilter === 'all') return sq.employees;
    const assigned = sq.appEmployeeIds[platformFilter];
    const withOrders = employeeIdsWithOrdersOnFilteredPlatform;
    return sq.employees.filter((e) => Boolean(assigned?.has(e.id)) || withOrders.has(e.id));
  }, [sq.employees, platformFilter, sq.appEmployeeIds, employeeIdsWithOrdersOnFilteredPlatform]);

  const filteredEmployees = useMemo(
    () => baseEmployees.filter((emp) => emp.name.includes(search)),
    [baseEmployees, search],
  );
  const visibleApps = platformFilter === 'all' ? sq.apps : sq.apps.filter((a) => a.id === platformFilter);
  const days = getDaysInMonth(year, month);
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);
  const today = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : -1;

  const getVal = useCallback(
    (empId: string, appId: string, day: number) => data[`${empId}::${appId}::${day}`] ?? 0,
    [data],
  );
  const getActiveApps = useCallback(
    (empId: string) => visibleApps.filter((app) => dayArr.some((d) => getVal(empId, app.id, d) > 0)),
    [visibleApps, dayArr, getVal],
  );
  const empDayTotal = useCallback(
    (empId: string, day: number) => visibleApps.reduce((s, a) => s + getVal(empId, a.id, day), 0),
    [visibleApps, getVal],
  );
  const empMonthTotal = useCallback(
    (empId: string) => dayArr.reduce((s, d) => s + empDayTotal(empId, d), 0),
    [dayArr, empDayTotal],
  );
  const empAppMonthTotal = useCallback(
    (empId: string, appId: string) => dayArr.reduce((s, d) => s + getVal(empId, appId, d), 0),
    [dayArr, getVal],
  );

  const monthGrandTotal = useMemo(
    () => filteredEmployees.reduce((s, e) => s + empMonthTotal(e.id), 0),
    [filteredEmployees, empMonthTotal],
  );
  const monthDailyAvg = days > 0 ? Math.round(monthGrandTotal / days) : 0;
  const platformOrderTotals = useMemo(
    () => calculatePlatformTotals(sq.apps, filteredEmployees, dayArr, data),
    [sq.apps, filteredEmployees, dayArr, data],
  );

  const prevMonth = () => {
    const n = shiftMonth(year, month, -1);
    setYear(n.y);
    setMonth(n.m);
  };
  const nextMonth = () => {
    const n = shiftMonth(year, month, 1);
    setYear(n.y);
    setMonth(n.m);
  };

  const toggleExpand = (empId: string) => {
    setExpandedEmp((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  const handleCellClick = useCallback(
    (e: React.MouseEvent, empId: string, day: number) => {
      if (!canEditMonth) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setCellPopover({ empId, day, x: rect.left, y: rect.bottom });
    },
    [canEditMonth],
  );

  const handlePopoverApply = useCallback((empId: string, day: number, vals: Record<string, number>) => {
    setData((prev) => {
      const next = { ...prev };
      Object.entries(vals).forEach(([appId, count]) => {
        const key = `${empId}::${appId}::${day}`;
        if (count > 0) next[key] = count;
        else delete next[key];
      });
      return next;
    });
  }, []);

  const exportExcel = () =>
    void exportSpreadsheetExcel({
      year,
      month,
      dayArr,
      filteredEmployees,
      empDayTotal,
      empMonthTotal,
    });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await runSpreadsheetImport({
      file,
      dayArr,
      employees: sq.employees,
      apps: sq.apps,
      data,
      onApplyData: setData,
    });
    e.target.value = '';
  };

  const handleTemplate = () => void downloadSpreadsheetTemplate(dayArr);

  const handlePrint = () =>
    printSpreadsheetTable({
      tableEl: tableRef.current,
      year,
      month,
      filteredEmployeeCount: filteredEmployees.length,
    });

  const handleSave = () =>
    void saveSpreadsheetMonth({
      isMonthLocked,
      year,
      month,
      days,
      data,
      setSaving,
    });

  const handleLockMonth = async () => {
    const my = monthYear(year, month);
    if (!isPastMonth(year, month) || isMonthLocked) return;
    setLockingMonth(true);
    try {
      await orderService.lockMonth(my);
    } catch (e: unknown) {
      setLockingMonth(false);
      const message = e instanceof Error ? e.message : 'فشل قفل الشهر';
      toast.error(TOAST_ERROR_GENERIC, { description: message });
      return;
    }
    setLockingMonth(false);
    setIsMonthLocked(true);
    setCellPopover(null);
    toast.success(TOAST_SUCCESS_ACTION);
  };

  const seqColMin = 36;
  const repColMin = 132;

  return {
    uid,
    loading: sq.loading,
    apps: sq.apps,
    employees: sq.employees,
    data,
    setData,
    year,
    month,
    search,
    setSearch,
    importRef,
    tableRef,
    saving,
    expandedEmp,
    cellPopover,
    setCellPopover,
    platformFilter,
    setPlatformFilter,
    isMonthLocked,
    lockingMonth,
    permissions,
    canEditMonth,
    filteredEmployees,
    visibleApps,
    days,
    dayArr,
    today,
    getVal,
    getActiveApps,
    empDayTotal,
    empMonthTotal,
    empAppMonthTotal,
    monthGrandTotal,
    monthDailyAvg,
    platformOrderTotals,
    prevMonth,
    nextMonth,
    toggleExpand,
    handleCellClick,
    handlePopoverApply,
    exportExcel,
    handleImport,
    handleTemplate,
    handlePrint,
    handleSave,
    handleLockMonth,
    seqColMin,
    repColMin,
  };
}

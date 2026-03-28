import type { App, DailyData, Employee, EmployeeAppAssignmentRow, OrderRawRow, OrdersEmployeeSortField } from '@modules/orders/types';

export const buildAppEmployeeIdsMap = (rows: EmployeeAppAssignmentRow[]): Record<string, Set<string>> => {
  const map: Record<string, Set<string>> = {};
  rows.forEach((row) => {
    if (!map[row.app_id]) map[row.app_id] = new Set();
    map[row.app_id].add(row.employee_id);
  });
  return map;
};

export function collectEmployeeIdsWithOrdersOnApp(data: DailyData, appId: string): Set<string> {
  const ids = new Set<string>();
  for (const key of Object.keys(data)) {
    const parts = key.split('::');
    if (parts.length !== 3) continue;
    const [empId, rowAppId] = parts;
    if (rowAppId !== appId) continue;
    if ((data[key] ?? 0) > 0) ids.add(empId);
  }
  return ids;
}

export const buildDailyDataMap = (rows: OrderRawRow[]): DailyData => {
  const mapped: DailyData = {};
  rows.forEach((row) => {
    const day = new Date(`${row.date}T00:00:00`).getDate();
    mapped[`${row.employee_id}::${row.app_id}::${day}`] = row.orders_count;
  });
  return mapped;
};

export const calculatePlatformTotals = (
  apps: App[],
  filteredEmployees: Employee[],
  dayArr: number[],
  data: DailyData,
): Record<string, number> => {
  const totals: Record<string, number> = {};
  apps.forEach((app) => {
    totals[app.id] = filteredEmployees.reduce((sum, emp) => {
      const employeeAppTotal = dayArr.reduce(
        (daySum, d) => daySum + (data[`${emp.id}::${app.id}::${d}`] ?? 0),
        0,
      );
      return sum + employeeAppTotal;
    }, 0);
  });
  return totals;
};

export function getOrdersEmployeeSortPair(
  a: Employee,
  b: Employee,
  sortField: OrdersEmployeeSortField,
  empTotal: (id: string) => number,
  dayArr: number[],
  data: DailyData,
): [number | string, number | string] {
  if (sortField === 'name') {
    return [a.name, b.name];
  }
  if (sortField === 'total') {
    return [empTotal(a.id), empTotal(b.id)];
  }
  const appId = sortField.replace('app:', '');
  const aSum = dayArr.reduce((s, d) => s + (data[`${a.id}::${appId}::${d}`] ?? 0), 0);
  const bSum = dayArr.reduce((s, d) => s + (data[`${b.id}::${appId}::${d}`] ?? 0), 0);
  return [aSum, bSum];
}

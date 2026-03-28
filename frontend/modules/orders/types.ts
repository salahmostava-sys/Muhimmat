export type Employee = {
  id: string;
  name: string;
  salary_type: string;
  status: string;
  sponsorship_status: string | null;
  city?: string | null;
};

export type App = { id: string; name: string; name_en: string | null; logo_url?: string | null };

export type DailyData = Record<string, number>;

export type AppTargetRow = { app_id: string; target_orders: number };

export type EmployeeAppAssignmentRow = { employee_id: string; app_id: string };

export type OrderRawRow = { employee_id: string; app_id: string; date: string; orders_count: number };

export type OrdersEmployeeSortField = 'name' | 'total' | `app:${string}`;

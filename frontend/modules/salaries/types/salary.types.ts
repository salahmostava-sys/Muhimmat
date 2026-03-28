import type { SlipLanguage } from '@shared/lib/salarySlipTranslations';
import type { PricingRule } from '@services/salaryService';

export type SortDir = 'asc' | 'desc' | null;

export interface SalaryRow {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  nationalId: string;
  city: string;
  cityKey: 'makkah' | 'jeddah' | null;
  bankAccount: string;
  hasIban: boolean;
  paymentMethod: 'bank' | 'cash';
  registeredApps: string[];
  platformOrders: Record<string, number>;
  platformSalaries: Record<string, number>;
  incentives: number;
  sickAllowance: number;
  violations: number;
  customDeductions: Record<string, number>;
  transfer: number;
  advanceDeduction: number;
  advanceInstallmentIds: string[];
  advanceRemaining: number;
  externalDeduction: number;
  status: 'pending' | 'approved' | 'paid';
  isDirty?: boolean;
  preferredLanguage: SlipLanguage;
  phone?: string | null;
  workDays: number;
  fuelCost: number;
  platformIncome: number;
  engineBaseSalary?: number;
}

export interface SchemeData {
  id: string;
  name: string;
  name_en: string | null;
  status: string;
  scheme_type?: 'order_based' | 'fixed_monthly';
  monthly_amount?: number | null;
  target_orders: number | null;
  target_bonus: number | null;
  salary_scheme_tiers?: {
    from_orders: number;
    to_orders: number | null;
    price_per_order: number;
    tier_order: number;
    tier_type?: 'total_multiplier' | 'fixed_amount' | 'base_plus_incremental';
    incremental_threshold?: number | null;
    incremental_price?: number | null;
  }[];
  snapshot?: unknown;
  scheme_id?: string;
}

export type OrderWithAppRow = {
  employee_id: string;
  orders_count: number;
  apps?: { name?: string | null } | null;
};

export type AppWithSchemeRow = {
  id: string;
  name: string;
  salary_schemes?: SchemeData | null;
};

export type SalaryDraftPatch = Pick<
  SalaryRow,
  | 'platformOrders'
  | 'incentives'
  | 'sickAllowance'
  | 'violations'
  | 'customDeductions'
  | 'transfer'
  | 'advanceDeduction'
  | 'externalDeduction'
  | 'platformIncome'
>;

export type MergedPdfComputed = {
  totalPlatformSalary: number;
  totalAdditions: number;
  totalWithSalary: number;
  totalDeductions: number;
  netSalary: number;
  remaining: number;
};

export type SalaryBaseContextData = {
  monthlyContext: {
    employees: unknown;
    orders: unknown;
    appsWithSchemeRes: { data: unknown };
    attendanceRows: unknown;
    fuelRes: { data: unknown };
    savedRecords: unknown;
    allAdvances: unknown;
  };
  previewData: unknown;
};

export type PreparedSalaryState = {
  appNameToId: Record<string, string>;
  rulesMap: Record<string, PricingRule[]>;
  appsWithoutPricingRules: string[];
  appsWithoutScheme: string[];
  builtEmpPlatformScheme: Record<string, Record<string, SchemeData | null>>;
  hydratedRows: SalaryRow[];
};

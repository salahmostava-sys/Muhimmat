import * as XLSX from '@e965/xlsx';
import {
  isEmployeeIdUuid,
  isValidSalaryMonthYear,
  monthYearFromParts,
  parseSalaryAmount,
} from '@/lib/salaryValidation';

/** Single-row template headers (Arabic) — must match `parseSalaryImportWorkbook` mapping. */
export const SALARY_IMPORT_TEMPLATE_HEADERS = [
  'معرف الموظف',
  'الشهر والسنة',
  'الراتب الأساسي',
  'البدلات',
  'خصم الحضور',
  'خصم السلفة',
  'خصم خارجي',
  'خصم يدوي',
  'صافي الراتب',
  'معتمد',
] as const;

/** Alternate headers (optional columns instead of «الشهر والسنة»). */
const HEADER_ALIASES: Record<string, keyof SalaryImportMapped> = {
  'معرف الموظف': 'employee_id',
  'الشهر والسنة': 'month_year',
  'السنة': 'year',
  'الشهر': 'month',
  'الراتب الأساسي': 'base_salary',
  'البدلات': 'allowances',
  'خصم الحضور': 'attendance_deduction',
  'خصم السلفة': 'advance_deduction',
  'خصم خارجي': 'external_deduction',
  'خصم يدوي': 'manual_deduction',
  'صافي الراتب': 'net_salary',
  'معتمد': 'is_approved',
};

type SalaryImportMapped = {
  employee_id?: string;
  month_year?: string;
  year?: number;
  month?: number;
  base_salary?: number;
  allowances?: number;
  attendance_deduction?: number;
  advance_deduction?: number;
  external_deduction?: number;
  manual_deduction?: number;
  net_salary?: number;
  is_approved?: boolean;
};

function normalizeHeader(raw: unknown): string {
  return String(raw ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseApproved(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  const s = String(val ?? '').trim().toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes' || s === 'نعم' || s === 'معتمد') return true;
  return false;
}

export type SalaryImportRowResult = {
  record: Record<string, unknown>;
  rowIndex: number;
};

/**
 * Parse first sheet: map Arabic headers to DB fields; coerce amounts with `parseSalaryAmount`.
 * `defaultMonthYear` applies when row has no month column (must be valid YYYY-MM).
 */
export function parseSalaryImportWorkbook(
  buffer: ArrayBuffer,
  options: { defaultMonthYear?: string }
): { rows: SalaryImportRowResult[]; parseErrors: string[] } {
  const parseErrors: string[] = [];
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  } catch {
    return { rows: [], parseErrors: ['تعذر قراءة ملف Excel'] };
  }
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], parseErrors: ['الملف لا يحتوي على أوراق عمل'] };

  const ws = wb.Sheets[sheetName];
  const matrix: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (matrix.length < 2) return { rows: [], parseErrors: ['لا توجد صفوف بيانات'] };

  const headerRow = matrix[0].map(normalizeHeader);
  const colToKey: (keyof SalaryImportMapped | null)[] = headerRow.map((h) => {
    const key = HEADER_ALIASES[h];
    if (!h) return null;
    if (!key) parseErrors.push(`عمود غير معروف: ${h}`);
    return key ?? null;
  });

  if (!colToKey.some(Boolean)) {
    return { rows: [], parseErrors: ['لم يُعثر على أعمدة مطابقة — استخدم تحميل القالب'] };
  }

  const defaultMy = options.defaultMonthYear?.trim();
  const rows: SalaryImportRowResult[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    if (!line || line.every((c) => c === '' || c === null || c === undefined)) continue;

    const raw: Partial<SalaryImportMapped> = {};
    for (let c = 0; c < colToKey.length; c++) {
      const key = colToKey[c];
      if (!key) continue;
      const cell = line[c];
      if (cell === '' || cell === null || cell === undefined) continue;

      switch (key) {
        case 'employee_id':
          raw.employee_id = String(cell).trim();
          break;
        case 'month_year':
          raw.month_year = String(cell).trim();
          break;
        case 'year': {
          const y = parseInt(String(cell).replace(/,/g, '').trim(), 10);
          if (Number.isInteger(y)) raw.year = y;
          break;
        }
        case 'month': {
          const mo = parseInt(String(cell).replace(/,/g, '').trim(), 10);
          if (Number.isInteger(mo)) raw.month = mo;
          break;
        }
        case 'base_salary':
          raw.base_salary = parseSalaryAmount(cell);
          break;
        case 'allowances':
          raw.allowances = parseSalaryAmount(cell);
          break;
        case 'attendance_deduction':
          raw.attendance_deduction = parseSalaryAmount(cell);
          break;
        case 'advance_deduction':
          raw.advance_deduction = parseSalaryAmount(cell);
          break;
        case 'external_deduction':
          raw.external_deduction = parseSalaryAmount(cell);
          break;
        case 'manual_deduction':
          raw.manual_deduction = parseSalaryAmount(cell);
          break;
        case 'net_salary':
          raw.net_salary = parseSalaryAmount(cell);
          break;
        case 'is_approved':
          raw.is_approved = parseApproved(cell);
          break;
        default:
          break;
      }
    }

    let monthYear = raw.month_year?.trim();
    if (!monthYear && raw.year !== undefined && raw.month !== undefined) {
      monthYear = monthYearFromParts(raw.year, raw.month) ?? undefined;
    }
    if (!monthYear && defaultMy && isValidSalaryMonthYear(defaultMy)) {
      monthYear = defaultMy;
    }

    const employeeId = raw.employee_id?.trim();
    if (!employeeId || !isEmployeeIdUuid(employeeId)) {
      parseErrors.push(`صف ${r + 1}: معرف موظف غير صالح`);
      continue;
    }
    if (!monthYear || !isValidSalaryMonthYear(monthYear)) {
      parseErrors.push(`صف ${r + 1}: الشهر والسنة غير صالحين`);
      continue;
    }

    const record: Record<string, unknown> = {
      employee_id: employeeId,
      month_year: monthYear,
      base_salary: Number(raw.base_salary ?? 0),
      allowances: Number(raw.allowances ?? 0),
      attendance_deduction: Number(raw.attendance_deduction ?? 0),
      advance_deduction: Number(raw.advance_deduction ?? 0),
      external_deduction: Number(raw.external_deduction ?? 0),
      manual_deduction: Number(raw.manual_deduction ?? 0),
      net_salary: Number(raw.net_salary ?? 0),
      is_approved: raw.is_approved ?? false,
      payment_method: 'cash',
    };

    rows.push({ record, rowIndex: r + 1 });
  }

  return { rows, parseErrors: [...new Set(parseErrors)] };
}

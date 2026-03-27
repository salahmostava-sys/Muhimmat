import * as XLSX from '@e965/xlsx';
import { parseExcelDate } from '@shared/lib/excelDateParse';
import { employeeService } from '@services/employeeService';
import { EMPLOYEE_IMPORT_COLUMNS } from '@shared/constants/excelSchemas';

export const EMPLOYEE_TEMPLATE_AR_HEADERS = EMPLOYEE_IMPORT_COLUMNS.map((c) => c.label);

type DbKey =
  | 'employee_code'
  | 'name'
  | 'name_en'
  | 'national_id'
  | 'phone'
  | 'email'
  | 'city'
  | 'nationality'
  | 'job_title'
  | 'join_date'
  | 'birth_date'
  | 'probation_end_date'
  | 'residency_expiry'
  | 'health_insurance_expiry'
  | 'license_expiry'
  | 'license_status'
  | 'sponsorship_status'
  | 'bank_account_number'
  | 'iban'
  | 'salary_type'
  | 'status'
  | 'base_salary';

const HEADER_TO_DB: Record<string, DbKey> = Object.fromEntries(
  EMPLOYEE_IMPORT_COLUMNS.map((c) => [c.label, c.key])
) as Record<string, DbKey>;

function normalizeHeaderCell(raw: unknown): string {
  return String(raw ?? '')
    .replaceAll('\uFEFF', '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function parseCity(val: string): 'makkah' | 'jeddah' | null {
  const v = val.trim().toLowerCase();
  if (!v) return null;
  if (v === 'makkah' || v === 'مكة' || v === 'مكه') return 'makkah';
  if (v === 'jeddah' || v === 'جدة' || v === 'جده') return 'jeddah';
  return null;
}

function strVal(v: unknown): string | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

export type EmployeeArabicRow = Partial<Record<DbKey, string | number | null>>;
const DATE_DB_KEYS = new Set<DbKey>([
  'join_date',
  'birth_date',
  'probation_end_date',
  'residency_expiry',
  'health_insurance_expiry',
  'license_expiry',
]);

function isDateDbKey(key: DbKey): boolean {
  return DATE_DB_KEYS.has(key);
}

function parseEnumValue(
  key: DbKey,
  raw: unknown
): string | undefined {
  const v = String(raw).trim().toLowerCase();
  if (key === 'salary_type') return v === 'orders' || v === 'shift' ? v : undefined;
  if (key === 'status') return v === 'active' || v === 'inactive' || v === 'ended' ? v : undefined;
  if (key === 'license_status') return v === 'has_license' || v === 'no_license' || v === 'applied' ? v : undefined;
  if (key === 'sponsorship_status') {
    return ['sponsored', 'not_sponsored', 'absconded', 'terminated'].includes(v) ? v : undefined;
  }
  return undefined;
}

function parseCellByDbKey(key: DbKey, raw: unknown): string | undefined {
  if (isDateDbKey(key)) return parseExcelDate(raw) ?? undefined;
  if (key === 'city') return parseCity(String(raw)) ?? undefined;
  const enumValue = parseEnumValue(key, raw);
  if (enumValue !== undefined) return enumValue;
  return strVal(raw);
}

async function resolveEmployeeIdByKeys(
  row: EmployeeArabicRow,
  svc: typeof employeeService
) : Promise<string | null> {
  const code = strVal(row.employee_code);
  if (code) {
    const existingByCode = await svc.findByEmployeeCode(code);
    if (existingByCode?.id) return existingByCode.id;
  }

  const nid = strVal(row.national_id);
  if (!nid) return null;
  const existingByNid = await svc.findByNationalId(nid);
  return existingByNid?.id ?? null;
}

function isMatrixRowEmpty(line: unknown[] | undefined): boolean {
  if (!line) return true;
  return line.every((cell) => cell === '' || cell === null || cell === undefined);
}

function mapHeadersToDbKeysStrict(
  headerRow: string[],
  headerErrors: string[]
): (DbKey | null)[] {
  if (headerRow.length !== EMPLOYEE_TEMPLATE_AR_HEADERS.length) {
    headerErrors.push(`عدد الأعمدة غير صحيح: المتوقع ${EMPLOYEE_TEMPLATE_AR_HEADERS.length}، والموجود ${headerRow.length}`);
    return [];
  }
  return headerRow.map((h, idx) => {
    const expected = EMPLOYEE_TEMPLATE_AR_HEADERS[idx];
    if (h !== expected) {
      headerErrors.push(`العمود رقم ${idx + 1} غير صحيح: المتوقع "${expected}" والموجود "${h || 'فارغ'}"`);
      return null;
    }
    return HEADER_TO_DB[h] ?? null;
  });
}

function parseEmployeeDataRow(
  line: unknown[],
  colIndexToKey: (DbKey | null)[]
): EmployeeArabicRow | null {
  const obj: EmployeeArabicRow = {};
  let hasAny = false;
  for (let c = 0; c < colIndexToKey.length; c++) {
    const key = colIndexToKey[c];
    if (!key) continue;
    const raw = line[c];
    if (raw === '' || raw === null || raw === undefined) continue;
    hasAny = true;
    const parsed = parseCellByDbKey(key, raw);
    if (parsed !== undefined) obj[key] = parsed;
  }
  return hasAny ? obj : null;
}

/**
 * Read first sheet: row 0 = headers (Arabic), following rows = data.
 * Maps Arabic headers to DB field keys.
 */
export function parseEmployeeArabicWorkbook(buffer: ArrayBuffer): {
  rows: EmployeeArabicRow[];
  headerErrors: string[];
} {
  const headerErrors: string[] = [];
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  } catch {
    return { rows: [], headerErrors: ['تعذر قراءة ملف Excel'] };
  }
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], headerErrors: ['الملف لا يحتوي على أوراق عمل'] };

  const ws = wb.Sheets[sheetName];
  const matrix: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (matrix.length < 2) return { rows: [], headerErrors: ['لا توجد صفوف بيانات'] };

  const headerRow = matrix[0].map(normalizeHeaderCell);
  const colIndexToKey = mapHeadersToDbKeysStrict(headerRow, headerErrors);
  if (headerErrors.length > 0 || !colIndexToKey.every(Boolean)) {
    return { rows: [], headerErrors: headerErrors.length > 0 ? headerErrors : ['هيكل الأعمدة غير مطابق للقالب'] };
  }

  const rows: EmployeeArabicRow[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    if (isMatrixRowEmpty(line)) continue;
    const parsedRow = parseEmployeeDataRow(line, colIndexToKey);
    if (!parsedRow) continue;
    rows.push(parsedRow);
  }

  return { rows, headerErrors: [...new Set(headerErrors)] };
}

function buildPayload(row: EmployeeArabicRow): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys: DbKey[] = [
    'employee_code',
    'name',
    'name_en',
    'national_id',
    'phone',
    'email',
    'city',
    'nationality',
    'job_title',
    'join_date',
    'birth_date',
    'probation_end_date',
    'residency_expiry',
    'health_insurance_expiry',
    'license_expiry',
    'license_status',
    'sponsorship_status',
    'bank_account_number',
    'iban',
    'salary_type',
    'status',
  ];
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  const st = row.salary_type;
  if (typeof st === 'string' && (st === 'orders' || st === 'shift')) out.salary_type = st;
  else out.salary_type = 'shift';

  out.base_salary = 0;
  if (!out.status) out.status = 'active';
  if (!out.sponsorship_status) out.sponsorship_status = 'not_sponsored';
  return out;
}

/**
 * Upsert rows: match by employee_code, else national_id; otherwise insert.
 */
export async function upsertEmployeeArabicRows(
  rows: EmployeeArabicRow[],
  svc: typeof employeeService = employeeService
): Promise<{ processed: number; failures: { name: string; error: string }[] }> {
  const failures: { name: string; error: string }[] = [];
  let processed = 0;

  for (const row of rows) {
    const nameHint = strVal(row.name) ?? strVal(row.employee_code) ?? strVal(row.national_id) ?? '—';
    try {
      const nm = strVal(row.name);
      if (!nm) { failures.push({ name: nameHint, error: 'الاسم مطلوب' }); continue; }

      const payload = buildPayload({ ...row, name: nm });
      const empId = await resolveEmployeeIdByKeys(row, svc);

      if (empId) {
        await svc.updateEmployee(empId, payload);
      } else {
        await svc.createEmployee(payload);
      }
      processed++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      failures.push({ name: nameHint, error: msg });
    }
  }

  return { processed, failures };
}

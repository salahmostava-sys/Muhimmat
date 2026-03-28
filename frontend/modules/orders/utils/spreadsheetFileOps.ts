import { toast } from '@shared/components/ui/sonner';
import {
  TOAST_ERROR_GENERIC,
  TOAST_ERROR_RETRY_SHORT,
  TOAST_SUCCESS_ACTION,
  TOAST_SUCCESS_OPERATION,
} from '@shared/lib/toastMessages';
import { buildOrdersIoHeaders } from '@shared/constants/excelSchemas';
import { logError } from '@shared/lib/logger';
import { orderService } from '@services/orderService';
import type { App, DailyData, Employee } from '@modules/orders/types';
import { mergeImportedOrdersFromMatrix, ordersImportHeadersMatch } from '@modules/orders/utils/importHelpers';
import { dateStr, monthLabel } from '@modules/orders/utils/dateMonth';
import { loadXlsx } from '@modules/orders/utils/xlsx';

export async function exportSpreadsheetExcel(params: {
  year: number;
  month: number;
  dayArr: number[];
  filteredEmployees: Employee[];
  empDayTotal: (empId: string, day: number) => number;
  empMonthTotal: (empId: string) => number;
}): Promise<void> {
  const XLSX = await loadXlsx();
  const { year, month, dayArr, filteredEmployees, empDayTotal, empMonthTotal } = params;
  const headers = buildOrdersIoHeaders(dayArr);
  const rows = filteredEmployees.map((emp) => {
    const values: Array<string | number> = [emp.name];
    dayArr.forEach((d) => values.push(empDayTotal(emp.id, d) || ''));
    values.push(empMonthTotal(emp.id));
    return values;
  });
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الطلبات');
  XLSX.writeFile(wb, `طلبات_${month}_${year}.xlsx`);
  toast.success(TOAST_SUCCESS_ACTION);
}

export async function runSpreadsheetImport(params: {
  file: File;
  dayArr: number[];
  employees: Employee[];
  apps: App[];
  data: DailyData;
  onApplyData: (next: DailyData) => void;
}): Promise<void> {
  const { file, dayArr, employees, apps, data, onApplyData } = params;
  try {
    const XLSX = await loadXlsx();
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });
    if (matrix.length < 2) {
      toast.error(TOAST_ERROR_GENERIC, { description: 'الملف فارغ' });
      return;
    }
    const expectedHeaders = buildOrdersIoHeaders(dayArr);
    const actualHeaders = (matrix[0] || []).map((h) => String(h ?? '').trim());
    if (!ordersImportHeadersMatch(actualHeaders, expectedHeaders)) {
      toast.error(TOAST_ERROR_GENERIC, {
        description:
          'هيكل الأعمدة غير مطابق للقالب — تأكد من تحميل القالب واستخدامه بدون تعديل ترتيب أو أسماء الأعمدة',
      });
      return;
    }
    const { newData, imported } = mergeImportedOrdersFromMatrix(
      matrix.slice(1),
      dayArr,
      employees,
      apps,
      data,
    );
    onApplyData(newData);
    toast.success(TOAST_SUCCESS_ACTION, { description: `تم استيراد ${imported} إدخال` });
  } catch (err) {
    logError('[Orders] import spreadsheet failed', err);
    toast.error(TOAST_ERROR_GENERIC);
  }
}

export async function downloadSpreadsheetTemplate(dayArr: number[]): Promise<void> {
  const XLSX = await loadXlsx();
  const ws = XLSX.utils.aoa_to_sheet([buildOrdersIoHeaders(dayArr)]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قالب الطلبات');
  XLSX.writeFile(wb, 'template_orders.xlsx');
}

export function printSpreadsheetTable(params: {
  tableEl: HTMLTableElement | null;
  year: number;
  month: number;
  filteredEmployeeCount: number;
}): void {
  const { tableEl, year, month, filteredEmployeeCount } = params;
  if (!tableEl) return;
  const printWindow = globalThis.open('', '_blank');
  if (!printWindow) return;
  const doc = printWindow.document;
  const html = doc.documentElement;
  const head = doc.head;
  const body = doc.body;
  if (!html || !head || !body) return;
  html.setAttribute('dir', 'rtl');
  html.setAttribute('lang', 'ar');
  const metaCharset = doc.createElement('meta');
  metaCharset.setAttribute('charset', 'UTF-8');
  head.appendChild(metaCharset);
  const docTitle = doc.createElement('title');
  docTitle.textContent = `طلبات ${month}/${year}`;
  head.appendChild(docTitle);
  const styleEl = doc.createElement('style');
  styleEl.textContent =
    '*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:10px;direction:rtl;color:#111;background:#fff}h2{text-align:center;margin-bottom:8px;font-size:14px}p.sub{text-align:center;color:#666;font-size:10px;margin-bottom:10px}table{width:100%;border-collapse:collapse}th{background:#1e3a5f;color:#fff;padding:5px 6px;text-align:right;font-size:9px;white-space:nowrap}td{padding:4px 6px;border-bottom:1px solid #e0e0e0;text-align:right;white-space:nowrap}tr:nth-child(even) td{background:#f9f9f9}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
  head.appendChild(styleEl);
  const title = doc.createElement('h2');
  title.textContent = `طلبات شهر ${month}/${year}`;
  const subtitle = doc.createElement('p');
  subtitle.className = 'sub';
  subtitle.textContent = `المجموع: ${filteredEmployeeCount} مندوب — ${new Date().toLocaleDateString('ar-SA')}`;
  while (body.firstChild) body.removeChild(body.firstChild);
  body.appendChild(title);
  body.appendChild(subtitle);
  body.appendChild(tableEl.cloneNode(true));
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
}

export async function saveSpreadsheetMonth(params: {
  isMonthLocked: boolean;
  year: number;
  month: number;
  days: number;
  data: DailyData;
  setSaving: (v: boolean) => void;
}): Promise<void> {
  const { isMonthLocked, year, month, days, data, setSaving } = params;
  if (isMonthLocked) return;
  setSaving(true);
  const rows: { employee_id: string; app_id: string; date: string; orders_count: number }[] = [];
  Object.entries(data).forEach(([key, count]) => {
    const [empId, appId, dayStr] = key.split('::');
    const day = Number.parseInt(dayStr, 10);
    if (!Number.isNaN(day) && day >= 1 && day <= days) {
      rows.push({
        employee_id: empId,
        app_id: appId,
        date: dateStr(year, month, day),
        orders_count: count,
      });
    }
  });
  try {
    const { saved, failed } = await orderService.bulkUpsert(rows);
    if (failed.length > 0) {
      toast.error(TOAST_ERROR_GENERIC, {
        description: `فشل في حفظ ${failed.length} إدخال — تم حفظ ${saved} بنجاح`,
      });
    } else {
      toast.success(TOAST_SUCCESS_OPERATION, {
        description: `${saved} إدخال — ${monthLabel(year, month)}`,
      });
    }
  } catch (e: unknown) {
    toast.error(TOAST_ERROR_RETRY_SHORT);
    logError('Orders.handleSave', e);
  } finally {
    setSaving(false);
  }
}

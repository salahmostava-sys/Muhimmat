import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

type Employee = { id: string; name: string; national_id: string | null; salary_type: string; base_salary: number };
type AttendanceRow = { employee_id: string; status: string };

interface Props {
  selectedMonth: number;
  selectedYear: number;
}

const MonthlyRecord = ({ selectedMonth, selectedYear }: Props) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const startDate = `${selectedYear}-${monthStr}-01`;
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const endDate = `${selectedYear}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

      const [empRes, attRes] = await Promise.all([
        supabase.from('employees').select('id, name, national_id, salary_type, base_salary')
          .eq('status', 'active').order('name'),
        supabase.from('attendance').select('employee_id, status')
          .gte('date', startDate).lte('date', endDate),
      ]);

      if (empRes.data) setEmployees(empRes.data as Employee[]);
      if (attRes.data) setAttendanceRows(attRes.data as AttendanceRow[]);
      setLoading(false);
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const data = employees.map(emp => {
    const rows = attendanceRows.filter(r => r.employee_id === emp.id);
    const presentDays = rows.filter(r => r.status === 'present').length;
    const absentDays = rows.filter(r => r.status === 'absent').length;
    const leaveDays = rows.filter(r => r.status === 'leave').length;
    const sickDays = rows.filter(r => r.status === 'sick').length;
    const lateDays = rows.filter(r => r.status === 'late').length;
    const unpaidLeaveDays = rows.filter(r => r.status === 'unpaid_leave').length;
    const totalHours = (presentDays + lateDays) * 8;
    const workDays = daysInMonth - leaveDays - sickDays;
    const earnedSalary = workDays > 0 ? Math.round(emp.base_salary * (presentDays / workDays)) : 0;
    return { ...emp, presentDays, absentDays, leaveDays, sickDays, lateDays, unpaidLeaveDays, totalHours, earnedSalary };
  });

  const totals = data.reduce(
    (acc, d) => ({
      presentDays: acc.presentDays + d.presentDays,
      absentDays: acc.absentDays + d.absentDays,
      leaveDays: acc.leaveDays + d.leaveDays,
      sickDays: acc.sickDays + d.sickDays,
      lateDays: acc.lateDays + d.lateDays,
      unpaidLeaveDays: acc.unpaidLeaveDays + d.unpaidLeaveDays,
      totalHours: acc.totalHours + d.totalHours,
      earnedSalary: acc.earnedSalary + d.earnedSalary,
    }),
    { presentDays: 0, absentDays: 0, leaveDays: 0, sickDays: 0, lateDays: 0, unpaidLeaveDays: 0, totalHours: 0, earnedSalary: 0 }
  );

  return (
    <div className="space-y-5">
      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-right p-3 font-semibold text-muted-foreground sticky right-0 bg-muted/30">المندوب</th>
                <th className="text-right p-3 font-semibold text-muted-foreground">رقم الهوية</th>
                <th className="text-center p-3 font-semibold text-muted-foreground"><span className="badge-success">حضور</span></th>
                <th className="text-center p-3 font-semibold text-muted-foreground"><span className="badge-urgent">غياب</span></th>
                <th className="text-center p-3 font-semibold text-muted-foreground"><span className="badge-warning">إجازة</span></th>
                <th className="text-center p-3 font-semibold text-muted-foreground">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">مريض</span>
                </th>
                <th className="text-center p-3 font-semibold text-muted-foreground">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">متأخر</span>
                </th>
                <th className="text-center p-3 font-semibold text-muted-foreground">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">بدون راتب</span>
                </th>
                <th className="text-center p-3 font-semibold text-muted-foreground">ساعات العمل</th>
                <th className="text-center p-3 font-semibold text-muted-foreground">المستحق</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="p-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={10} className="p-10 text-center text-muted-foreground">لا توجد بيانات لهذا الشهر</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="p-3 sticky right-0 bg-card">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {row.name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground whitespace-nowrap">{row.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground font-mono text-xs" dir="ltr">{row.national_id || '—'}</td>
                    <td className="p-3 text-center font-semibold text-green-600 dark:text-green-400">{row.presentDays}</td>
                    <td className="p-3 text-center font-semibold text-destructive">{row.absentDays}</td>
                    <td className="p-3 text-center font-semibold text-yellow-600 dark:text-yellow-400">{row.leaveDays}</td>
                    <td className="p-3 text-center font-semibold text-purple-600 dark:text-purple-400">{row.sickDays}</td>
                    <td className="p-3 text-center text-orange-600 dark:text-orange-400">{row.lateDays}</td>
                    <td className="p-3 text-center text-muted-foreground">{row.unpaidLeaveDays}</td>
                    <td className="p-3 text-center text-muted-foreground">{row.totalHours} س</td>
                    <td className="p-3 text-center font-semibold text-foreground">{row.earnedSalary.toLocaleString()} ر.س</td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && data.length > 0 && (
              <tfoot>
                <tr className="bg-muted/40 font-semibold">
                  <td className="p-3 sticky right-0 bg-muted/40 text-foreground">الإجمالي</td>
                  <td className="p-3" />
                  <td className="p-3 text-center text-green-600 dark:text-green-400">{totals.presentDays}</td>
                  <td className="p-3 text-center text-destructive">{totals.absentDays}</td>
                  <td className="p-3 text-center text-yellow-600 dark:text-yellow-400">{totals.leaveDays}</td>
                  <td className="p-3 text-center text-purple-600 dark:text-purple-400">{totals.sickDays}</td>
                  <td className="p-3 text-center text-orange-600 dark:text-orange-400">{totals.lateDays}</td>
                  <td className="p-3 text-center text-muted-foreground">{totals.unpaidLeaveDays}</td>
                  <td className="p-3 text-center text-muted-foreground">{totals.totalHours} س</td>
                  <td className="p-3 text-center text-foreground">{totals.earnedSalary.toLocaleString()} ر.س</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyRecord;

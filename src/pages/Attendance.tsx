import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, CalendarDays, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DailyAttendance from '@/components/attendance/DailyAttendance';
import MonthlyRecord from '@/components/attendance/MonthlyRecord';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 2, currentYear - 1, currentYear];

const Attendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const handleExportAttendance = () => {
    const ws = XLSX.utils.json_to_sheet([{ 'ملاحظة': `سجل الحضور — ${MONTHS[Number(selectedMonth)]} ${selectedYear}` }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الحضور');
    XLSX.writeFile(wb, `الحضور_${selectedYear}-${String(Number(selectedMonth) + 1).padStart(2, '0')}.xlsx`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الحضور والانصراف</h1>
          <p className="text-sm text-muted-foreground mt-1">تسجيل ومتابعة حضور المناديب</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2"><Download size={15} /> 📥 تحميل تقرير ▾</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportAttendance}>📊 تصدير Excel (ملخص شهري)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Shared month/year filter */}
      <div className="flex items-center gap-3 flex-wrap bg-muted/30 rounded-xl border border-border/50 px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">عرض سجلات شهر:</span>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {MONTHS[Number(selectedMonth)]} {selectedYear}
        </span>
      </div>

      <Tabs defaultValue="daily" className="space-y-5">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="daily" className="gap-2">
            <ClipboardCheck size={16} />
            التسجيل اليومي
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <CalendarDays size={16} />
            السجل الشهري
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyAttendance selectedMonth={Number(selectedMonth)} selectedYear={Number(selectedYear)} />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyRecord selectedMonth={Number(selectedMonth)} selectedYear={Number(selectedYear)} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;

import { useRef, useState } from 'react';
import { Globe, CheckCircle, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSlipTranslations, getStatusLabel, LANGUAGE_META } from '@/lib/salarySlipTranslations';
import { salarySlipService } from '@/services/salarySlipService';
import type { SalaryRow } from './types';

type MonthOption = { v: string; l: string };

export interface PayslipModalProps {
  row: SalaryRow;
  onClose: () => void;
  onApprove: () => void;
  selectedMonth: string;
  companyName?: string;
  months: MonthOption[];
}

export const PayslipModal = ({
  row,
  onClose,
  onApprove,
  selectedMonth,
  companyName,
  months,
}: PayslipModalProps) => {
  const t = getSlipTranslations(row.preferredLanguage);
  const meta = LANGUAGE_META[row.preferredLanguage];
  const dir = meta.dir;
  const slipRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const platformRows = row.registeredApps
    .filter((app) => (row.platformOrders[app] || 0) > 0)
    .map((app) => ({
      app,
      orders: row.platformOrders[app] || 0,
      salary: row.platformSalaries[app] || 0,
    }));

  const totalPlatformSalary = platformRows.reduce((s, r) => s + r.salary, 0);
  const totalEarnings = totalPlatformSalary + row.incentives + row.sickAllowance;

  const allDeductions = [
    { key: 'advance', label: t.advanceInstallment, val: row.advanceDeduction },
    { key: 'external', label: t.externalDeductions, val: row.externalDeduction },
    { key: 'violation', label: t.violations, val: row.violations },
    ...Object.entries(row.customDeductions || {}).map(([k, v]) => ({
      key: k,
      label: k.split('___')[1] || k,
      val: v,
    })),
  ];

  const totalDeductions = allDeductions.reduce((s, d) => s + d.val, 0);
  const netSalary = totalEarnings - totalDeductions;
  const monthLabel = months.find((m) => m.v === selectedMonth)?.l || selectedMonth;

  const exportPDF = async () => {
    if (!slipRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const finalHeight = Math.min(imgHeight, pageHeight);
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, finalHeight);
      pdf.save(`salary-slip-${row.employeeName}-${selectedMonth}.pdf`);
    } catch {
      const simpleSlipBlob = salarySlipService.generateSalaryPDF(
        { name: row.employeeName, nationalId: row.nationalId || null },
        netSalary,
        selectedMonth,
        Object.values(row.platformOrders).reduce((sum, count) => sum + count, 0)
      );
      const blobUrl = URL.createObjectURL(simpleSlipBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `salary-slip-${row.employeeName}-${selectedMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir={dir} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {t.title} — <span className="text-foreground">{row.employeeName}</span>
            <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
              <Globe size={12} /> {meta.flag} {meta.label}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div
          ref={slipRef}
          className="bg-white text-[#2a1a0f] border border-[#8c6239] p-4 rounded-md space-y-4 text-sm"
        >
          <div className="flex items-start justify-between text-[12px] font-semibold">
            <div className="space-y-1 text-left">
              <div>{companyName || 'شركة مهمة التوصيل للخدمات اللوجستية'}</div>
              <div className="font-bold">C.R. 4030530671 | VAT: 3118873674</div>
            </div>
            <div className="text-center px-2 pt-1">
              <div className="text-2xl tracking-widest text-[#8c6239]">⌁</div>
            </div>
            <div className="space-y-1 text-right">
              <div>{companyName || 'شركة مهمة التوصيل للخدمات اللوجستية'}</div>
              <div className="font-bold">س. ت: 4030530671 - الرقم الضريبي: 3118873674</div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <p className="font-extrabold text-3xl text-[#8c6239]">{t.title}</p>
            <p className="font-bold text-lg">راتب شهر {monthLabel}</p>
            <p className="font-bold text-xl">اسم الموظف: {row.employeeName}</p>
          </div>

          <table className="w-full border border-[#8c6239] border-collapse text-center">
            <thead>
              <tr className="bg-[#8c6239] text-white">
                {(row.registeredApps.length > 0 ? row.registeredApps : ['المنصات']).map((app) => (
                  <th key={app} className="border border-[#8c6239] px-2 py-1 font-bold">
                    {app}
                  </th>
                ))}
                <th className="border border-[#8c6239] px-2 py-1 font-bold">إجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white text-[#2a1a0f]">
                {(row.registeredApps.length > 0 ? row.registeredApps : ['المنصات']).map((app) => (
                  <td key={`orders-${app}`} className="border border-[#8c6239] px-2 py-1 font-bold">
                    {(row.platformOrders[app] || 0).toLocaleString()}
                  </td>
                ))}
                <td className="border border-[#8c6239] px-2 py-1 font-extrabold">
                  {platformRows.reduce((s, p) => s + p.orders, 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-0 border border-[#8c6239]">
            <div className="border-l border-[#8c6239]">
              <div className="bg-[#8c6239] text-white text-center font-bold py-1">الاستحقاقات (ر.س)</div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border border-[#8c6239] px-2 py-1 font-semibold">الراتب الأساسي</td>
                    <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                      {Math.round(totalPlatformSalary).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#8c6239] px-2 py-1 font-semibold">{t.incentives}</td>
                    <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                      {Math.round(row.incentives).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#8c6239] px-2 py-1 font-semibold">{t.sickAllowance}</td>
                    <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                      {Math.round(row.sickAllowance).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#8c6239] px-2 py-1 font-semibold">الحالة</td>
                    <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                      {getStatusLabel(row.status, row.preferredLanguage)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#8c6239] px-2 py-1 font-semibold">طريقة الصرف</td>
                    <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                      {row.paymentMethod === 'bank' ? 'تحويل بنكي' : 'كاش'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="bg-[#8c6239] text-white text-center font-bold py-1">الاستقطاعات (ر.س)</div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border border-[#8c6239] px-2 py-1 font-semibold">{t.advanceInstallment}</td>
                    <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                      {Math.round(row.advanceDeduction).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#8c6239] px-2 py-1 font-semibold">{t.externalDeductions}</td>
                    <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                      {Math.round(row.externalDeduction).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-[#8c6239] px-2 py-1 font-semibold">{t.violations}</td>
                    <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                      {Math.round(row.violations).toLocaleString()}
                    </td>
                  </tr>
                  {Object.entries(row.customDeductions || {}).map(([k, v]) => {
                    const label = k.split('___').slice(1).join('___') || k;
                    return (
                      <tr key={k}>
                        <td className="border border-[#8c6239] px-2 py-1 font-semibold">{label}</td>
                        <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                          {Math.round(v).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="border border-[#8c6239] px-2 py-1 font-semibold">{t.advanceBalance}</td>
                    <td className="border border-[#8c6239] px-2 py-1 text-center font-bold">
                      {Math.round(row.advanceRemaining).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 border border-[#8c6239] font-bold text-lg">
            <div className="border-l border-[#8c6239] text-center py-2 bg-[#f4ece5]">
              إجمالي الاستقطاعات: {Math.round(totalDeductions).toLocaleString()}
            </div>
            <div className="text-center py-2 bg-[#f4ece5]">
              إجمالي الراتب: {Math.round(totalEarnings).toLocaleString()}
            </div>
          </div>

          <div className="border border-[#8c6239] bg-[#8c6239] text-white text-center py-3 text-2xl font-extrabold">
            الراتب المستحق: {Math.round(netSalary).toLocaleString()} ر.س
          </div>

          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="text-center text-xs">
              <div className="h-8 border-b border-[#8c6239] mb-1" />
              <span>{t.signatureDriver}</span>
            </div>
            <div className="text-center text-xs">
              <div className="h-8 border-b border-[#8c6239] mb-1" />
              <span>{t.signatureAdmin}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-between pt-2">
          <Button variant="outline" onClick={onClose}>
            {t.close}
          </Button>
          <div className="flex gap-2">
            {row.status === 'pending' && (
              <Button variant="default" className="gap-2" onClick={onApprove}>
                <CheckCircle size={14} /> {t.approve}
              </Button>
            )}
            <Button onClick={exportPDF} disabled={exporting} className="gap-2">
              <Printer size={14} /> {exporting ? '...' : t.printPdf}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


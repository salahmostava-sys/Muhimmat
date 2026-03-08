import { useState } from 'react';
import { ArrowRight, User, FileText, Wallet, Bike, CreditCard, Clock, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { differenceInDays, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface Props {
  employee: Employee;
  onBack: () => void;
}

const statusLabels: Record<string, string> = { active: 'نشط', suspended: 'موقوف', terminated: 'منتهي', inactive: 'موقوف', ended: 'منتهي' };
const statusStyles: Record<string, string> = { active: 'badge-success', suspended: 'badge-warning', terminated: 'badge-urgent', inactive: 'badge-warning', ended: 'badge-urgent' };

const EmployeeProfile = ({ employee, onBack }: Props) => {
  const [activeTab, setActiveTab] = useState('basic');

  const residencyDays = differenceInDays(parseISO(employee.residencyExpiry), new Date());
  const empAdvances = advances.filter(a => a.employeeId === employee.id);
  const empSalaries = salaryRecords.filter(s => s.employeeId === employee.id);

  return (
    <div className="space-y-5">
      {/* Back Button + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground">
          <ArrowRight size={16} />
          العودة للقائمة
        </Button>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {employee.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{employee.name}</h2>
              <span className={statusStyles[employee.status]}>{statusLabels[employee.status]}</span>
              <span className={`badge-${employee.salaryType === 'orders' ? 'info' : 'success'}`}>
                {employee.salaryType === 'orders' ? 'طلبات' : 'دوام'}
              </span>
            </div>
            <div className="flex gap-4 mt-2 flex-wrap text-sm text-muted-foreground">
              <span>📱 {employee.phone}</span>
              <span>🪪 {employee.nationalId}</span>
              {employee.iban && <span>🏦 SA••••••••{employee.iban.slice(-4)}</span>}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {employee.apps.map(app => (
                <span key={app} className="badge-info">{app}</span>
              ))}
            </div>
          </div>
          <div className="text-left">
            <div className={`text-sm font-medium ${residencyDays < 30 ? 'text-destructive' : residencyDays < 60 ? 'text-warning' : 'text-success'}`}>
              الإقامة: {residencyDays < 0 ? 'منتهية' : `${residencyDays} يوم`}
            </div>
            {employee.vehicleId && (
              <div className="text-sm text-muted-foreground mt-1">🏍️ {employee.vehicleId}</div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="basic" className="gap-1.5"><User size={14} /> البيانات الأساسية</TabsTrigger>
          <TabsTrigger value="docs" className="gap-1.5"><FileText size={14} /> الوثائق والتواريخ</TabsTrigger>
          <TabsTrigger value="salary" className="gap-1.5"><Wallet size={14} /> الراتب والسكيمة</TabsTrigger>
          <TabsTrigger value="vehicles" className="gap-1.5"><Bike size={14} /> الدراجات</TabsTrigger>
          <TabsTrigger value="apps" className="gap-1.5"><Package size={14} /> التطبيقات</TabsTrigger>
          <TabsTrigger value="advances" className="gap-1.5"><CreditCard size={14} /> السلف</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5"><Clock size={14} /> الحضور</TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5"><Package size={14} /> الطلبات</TabsTrigger>
          <TabsTrigger value="salaries" className="gap-1.5"><DollarSign size={14} /> الرواتب</TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Data */}
        <TabsContent value="basic">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-5">البيانات الأساسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoField label="الاسم الكامل (عربي)" value={employee.name} />
              <InfoField label="رقم الهاتف" value={employee.phone} dir="ltr" />
              <InfoField label="رقم الهوية" value={employee.nationalId} dir="ltr" />
              <InfoField label="رقم IBAN" value={employee.iban ? `SA••••••••${employee.iban.slice(-4)}` : '—'} />
              <InfoField label="البريد الإلكتروني" value={employee.email || '—'} />
              <InfoField label="تاريخ الميلاد" value={employee.birthDate || '—'} />
              <InfoField label="الكفيل / الراعي" value={employee.sponsor || '—'} />
              <InfoField label="الحالة" value={statusLabels[employee.status]} />
            </div>
            <div className="mt-5 flex gap-2">
              <Button className="gap-2">✏️ تعديل البيانات</Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Documents */}
        <TabsContent value="docs">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-5">الوثائق والتواريخ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-muted-foreground mb-1">تاريخ انتهاء الإقامة</p>
                <p className={`text-sm font-medium ${residencyDays < 30 ? 'text-destructive' : residencyDays < 60 ? 'text-warning' : 'text-foreground'}`}>
                  {employee.residencyExpiry}
                  {residencyDays < 60 && <span className="mr-2 text-xs">({residencyDays} يوم متبق)</span>}
                </p>
              </div>
              {employee.licenseExpiry && (
                <InfoField label="تاريخ انتهاء رخصة القيادة" value={employee.licenseExpiry} />
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <Button className="gap-2">✏️ تعديل الوثائق</Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Salary */}
        <TabsContent value="salary">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-5">الراتب والسكيمة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoField label="نوع الراتب" value={employee.salaryType === 'orders' ? 'طلبات (Orders)' : 'دوام ثابت (Shift)'} />
              {employee.salaryType === 'shift' && (
                <InfoField label="الراتب الشهري" value={`${employee.monthlySalary?.toLocaleString()} ر.س`} />
              )}
              {employee.salaryType === 'orders' && (
                <InfoField label="السكيمة المطبقة" value={employee.schemeName || 'لم تحدد بعد'} />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Vehicles */}
        <TabsContent value="vehicles">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-5">الدراجات المعيّنة</h3>
            {employee.vehicleId ? (
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Bike size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{employee.vehicleId}</p>
                  <p className="text-sm text-muted-foreground">المركبة الحالية</p>
                </div>
                <span className="badge-success mr-auto">نشط</span>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">لا توجد مركبة معيّنة حالياً</p>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Apps */}
        <TabsContent value="apps">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-5">التطبيقات المرتبطة</h3>
            <div className="space-y-3">
              {employee.apps.map(app => (
                <div key={app} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {app.charAt(0)}
                    </div>
                    <span className="font-medium text-foreground">{app}</span>
                  </div>
                  <span className="badge-success">نشط</span>
                </div>
              ))}
              {employee.apps.length === 0 && (
                <p className="text-muted-foreground text-sm">لا توجد تطبيقات مرتبطة</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 6: Advances */}
        <TabsContent value="advances">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-5">السلف</h3>
            {empAdvances.length === 0 ? (
              <p className="text-muted-foreground text-sm">لا توجد سلف مسجلة</p>
            ) : (
              <div className="space-y-3">
                {empAdvances.map(adv => (
                  <div key={adv.id} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-foreground">{adv.amount.toLocaleString()} ر.س</p>
                        <p className="text-sm text-muted-foreground">قسط شهري: {adv.monthlyInstallment.toLocaleString()} ر.س</p>
                      </div>
                      <span className={adv.status === 'active' ? 'badge-warning' : adv.status === 'completed' ? 'badge-success' : 'badge-info'}>
                        {adv.status === 'active' ? 'نشطة' : adv.status === 'completed' ? 'مكتملة' : 'موقوفة'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      مدفوع: {adv.paidAmount.toLocaleString()} ر.س — متبقي: {(adv.amount - adv.paidAmount).toLocaleString()} ر.س
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 7: Attendance */}
        <TabsContent value="attendance">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-5">سجل الحضور</h3>
            <p className="text-muted-foreground text-sm">يتطلب فلتر الشهر لعرض بيانات الحضور</p>
          </div>
        </TabsContent>

        {/* Tab 8: Orders */}
        <TabsContent value="orders">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-5">سجل الطلبات</h3>
            <p className="text-muted-foreground text-sm">يتطلب فلتر الشهر والتطبيق لعرض البيانات</p>
          </div>
        </TabsContent>

        {/* Tab 9: Salaries */}
        <TabsContent value="salaries">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
            <h3 className="font-semibold text-foreground mb-5">سجل الرواتب</h3>
            {empSalaries.length === 0 ? (
              <p className="text-muted-foreground text-sm">لا يوجد سجل رواتب</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-right p-3 text-muted-foreground">الشهر</th>
                      <th className="text-right p-3 text-muted-foreground">الأساسي</th>
                      <th className="text-right p-3 text-muted-foreground">البدلات</th>
                      <th className="text-right p-3 text-muted-foreground">الخصومات</th>
                      <th className="text-right p-3 text-muted-foreground font-semibold">الصافي</th>
                      <th className="text-right p-3 text-muted-foreground">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empSalaries.map(s => (
                      <tr key={s.id} className="border-b border-border/30">
                        <td className="p-3 font-medium">{s.month}</td>
                        <td className="p-3">{s.baseSalary.toLocaleString()}</td>
                        <td className="p-3">{s.allowances.toLocaleString()}</td>
                        <td className="p-3 text-destructive">
                          -{(s.absenceDeduction + s.advanceDeduction + s.externalDeduction + s.manualDeduction).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold text-success">{s.netSalary.toLocaleString()} ر.س</td>
                        <td className="p-3">
                          <span className={s.status === 'approved' || s.status === 'paid' ? 'badge-success' : 'badge-warning'}>
                            {s.status === 'approved' ? 'معتمد' : s.status === 'paid' ? 'مصروف' : 'معلق'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const InfoField = ({ label, value, dir }: { label: string; value: string; dir?: string }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-sm font-medium text-foreground" dir={dir}>{value}</p>
  </div>
);

export default EmployeeProfile;

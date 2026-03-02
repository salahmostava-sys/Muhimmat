import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { salarySchemes } from '@/data/mock';

interface Props {
  onClose: () => void;
}

const STEPS = ['البيانات الأساسية', 'بيانات العمل', 'الوثائق والتطبيقات'];

const AddEmployeeModal = ({ onClose }: Props) => {
  const [step, setStep] = useState(0);
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', phone: '', nationalId: '', iban: '', email: '', birthDate: '', sponsor: '',
    salaryType: 'orders', baseSalary: '', housingAllowance: '', transportAllowance: '',
    schemeId: '', schemeStartDate: '', joinDate: '',
    residencyExpiry: '', residencyNumber: '', licenseNumber: '', licenseExpiry: '',
    apps: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const appsList = ['هنقرستيشن', 'جاهز', 'كيتا', 'توبو', 'نينجا'];

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.name || form.name.length < 3) errs.name = 'الاسم مطلوب (3 أحرف على الأقل)';
      if (!form.phone || !/^(05|966)\d{8,9}$/.test(form.phone)) errs.phone = 'رقم هاتف غير صحيح';
      if (!form.nationalId || !/^[12]\d{9}$/.test(form.nationalId)) errs.nationalId = 'رقم هوية غير صحيح (10 أرقام)';
      if (!form.iban || !/^SA\d{22}$/.test(form.iban)) errs.iban = 'IBAN غير صحيح (SA + 22 رقم)';
      if (!form.birthDate) errs.birthDate = 'تاريخ الميلاد مطلوب';
    }
    if (s === 1) {
      if (form.salaryType === 'shift' && (!form.baseSalary || parseFloat(form.baseSalary) <= 0)) errs.baseSalary = 'الراتب مطلوب';
      if (form.salaryType === 'orders' && !form.schemeId) errs.schemeId = 'السكيمة مطلوبة';
      if (!form.joinDate) errs.joinDate = 'تاريخ الانضمام مطلوب';
    }
    if (s === 2) {
      if (!form.residencyExpiry) errs.residencyExpiry = 'تاريخ انتهاء الإقامة مطلوب';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => Math.min(s + 1, 2)); };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const save = () => {
    if (!validateStep(2)) return;
    toast({ title: 'تم إضافة المندوب بنجاح', description: form.name });
    onClose();
  };

  const toggleApp = (app: string) => {
    setForm(f => ({
      ...f,
      apps: f.apps.includes(app) ? f.apps.filter(a => a !== app) : [...f.apps, app],
    }));
  };

  const F = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
    <div>
      <Label className="text-sm mb-1.5 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">إضافة مندوب جديد</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-0 px-6 pt-5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${i < step ? 'bg-success text-success-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-sm hidden sm:block ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1 */}
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <F label="الاسم الكامل (عربي)" required error={errors.name}>
                <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="أحمد محمد العمري" />
              </F>
              <F label="رقم الهاتف" required error={errors.phone}>
                <Input value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="0551234567" dir="ltr" />
              </F>
              <F label="رقم الهوية" required error={errors.nationalId}>
                <Input value={form.nationalId} onChange={e => setField('nationalId', e.target.value)} placeholder="2xxxxxxxx" dir="ltr" />
              </F>
              <F label="رقم IBAN" required error={errors.iban}>
                <Input value={form.iban} onChange={e => setField('iban', e.target.value)} placeholder="SA00 0000 0000 0000 0000 0000" dir="ltr" />
              </F>
              <F label="تاريخ الميلاد" required error={errors.birthDate}>
                <Input type="date" value={form.birthDate} onChange={e => setField('birthDate', e.target.value)} />
              </F>
              <F label="البريد الإلكتروني">
                <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="example@email.com" dir="ltr" />
              </F>
              <F label="الكفيل / الراعي">
                <Input value={form.sponsor} onChange={e => setField('sponsor', e.target.value)} />
              </F>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <F label="نوع الراتب" required>
                  <div className="flex gap-3 mt-1">
                    {['orders', 'shift'].map(t => (
                      <button key={t} onClick={() => setField('salaryType', t)}
                        className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors
                          ${form.salaryType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                        {t === 'orders' ? '📦 طلبات (Orders)' : '🕐 دوام ثابت (Shift)'}
                      </button>
                    ))}
                  </div>
                </F>
              </div>
              {form.salaryType === 'shift' ? (
                <>
                  <F label="الراتب الشهري (ر.س)" required error={errors.baseSalary}>
                    <Input type="number" value={form.baseSalary} onChange={e => setField('baseSalary', e.target.value)} />
                  </F>
                  <F label="بدل السكن (ر.س)">
                    <Input type="number" value={form.housingAllowance} onChange={e => setField('housingAllowance', e.target.value)} />
                  </F>
                  <F label="بدل النقل (ر.س)">
                    <Input type="number" value={form.transportAllowance} onChange={e => setField('transportAllowance', e.target.value)} />
                  </F>
                </>
              ) : (
                <>
                  <F label="السكيمة المطبقة" required error={errors.schemeId}>
                    <Select value={form.schemeId} onValueChange={v => setField('schemeId', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر السكيمة" /></SelectTrigger>
                      <SelectContent>
                        {salarySchemes.filter(s => s.status === 'active').map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </F>
                  <F label="تاريخ بداية السكيمة" required>
                    <Input type="date" value={form.schemeStartDate} onChange={e => setField('schemeStartDate', e.target.value)} />
                  </F>
                </>
              )}
              <F label="تاريخ الانضمام" required error={errors.joinDate}>
                <Input type="date" value={form.joinDate} onChange={e => setField('joinDate', e.target.value)} />
              </F>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <F label="تاريخ انتهاء الإقامة" required error={errors.residencyExpiry}>
                <Input type="date" value={form.residencyExpiry} onChange={e => setField('residencyExpiry', e.target.value)} />
              </F>
              <F label="رقم الإقامة">
                <Input value={form.residencyNumber} onChange={e => setField('residencyNumber', e.target.value)} maxLength={8} dir="ltr" />
              </F>
              <F label="رقم رخصة القيادة">
                <Input value={form.licenseNumber} onChange={e => setField('licenseNumber', e.target.value)} dir="ltr" />
              </F>
              <F label="تاريخ انتهاء الرخصة">
                <Input type="date" value={form.licenseExpiry} onChange={e => setField('licenseExpiry', e.target.value)} />
              </F>
              <div className="sm:col-span-2">
                <F label="التطبيقات المرتبطة">
                  <div className="flex gap-2 flex-wrap mt-1">
                    {['هنقرستيشن', 'جاهز', 'كيتا', 'توبو', 'نينجا'].map(app => (
                      <button key={app} onClick={() => toggleApp(app)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-colors
                          ${form.apps.includes(app) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                        {app}
                      </button>
                    ))}
                  </div>
                </F>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <Button variant="outline" onClick={step === 0 ? onClose : back} className="gap-2">
            {step === 0 ? 'إلغاء' : <><ChevronLeft size={16} /> السابق</>}
          </Button>
          <Button onClick={step === 2 ? save : next} className="gap-2">
            {step === 2 ? <><Check size={16} /> حفظ المندوب</> : <>التالي <ChevronRight size={16} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;

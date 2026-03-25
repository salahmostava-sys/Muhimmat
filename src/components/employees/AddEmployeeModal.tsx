import { useState, useRef, useEffect } from 'react';
import { X, Check, Trash2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, parseISO } from 'date-fns';
import { employeeService, type EmployeeAppOption } from '@/services/employeeService';
import { useSignedUrl, extractStoragePath } from '@/hooks/useSignedUrl';
import { validateUploadFile } from '@/lib/validation';
import { useEmployeeWizardStore } from '@/stores/useEmployeeWizardStore';


interface EmployeeData {
  id: string;
  name: string;
  employee_code?: string | null;
  job_title?: string | null;
  phone?: string | null;
  email?: string | null;
  national_id?: string | null;
  bank_account_number?: string | null;
  city?: string | null;
  join_date?: string | null;
  birth_date?: string | null;
  residency_expiry?: string | null;
  health_insurance_expiry?: string | null;
  probation_end_date?: string | null;
  license_status?: string | null;
  sponsorship_status?: string | null;
  id_photo_url?: string | null;
  license_photo_url?: string | null;
  personal_photo_url?: string | null;
  status: string;
  salary_type: string;
  base_salary: number;
  preferred_language?: string | null;
  nationality?: string | null;
}

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
  editEmployee?: EmployeeData | null;
}

const STEPS = ['البيانات الأساسية', 'الإقامة والوثائق', 'نوع الراتب', 'رفع المستندات'];

const SectionTitle = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="text-sm font-bold text-foreground">{title}</span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

const F = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-sm mb-1.5 block text-foreground/80">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

// ─── Secure Upload Area — uses signed URLs for existing private docs ──────────
const UploadArea = ({ label, icon, file, existingStoragePath, onFile, onRemove }: {
  label: string; icon: string; file: File | null; existingStoragePath?: string | null;
  onFile: (f: File) => void; onRemove: () => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  // Generate a signed URL for existing document (private bucket)
  const storagePath = extractStoragePath(existingStoragePath);
  const signedUrl = useSignedUrl('employee-documents', storagePath);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  const hasContent = file || existingStoragePath;

  return (
    <div className="flex-1 min-w-[130px]">
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${drag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
        {hasContent ? (
          <div className="space-y-1">
            {file ? (
              file.type.startsWith('image/')
                ? <img src={URL.createObjectURL(file)} className="w-16 h-16 object-cover rounded-lg mx-auto" alt="" />
                : <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto text-2xl">📄</div>
            ) : signedUrl ? (
              <img src={signedUrl} className="w-16 h-16 object-cover rounded-lg mx-auto" alt="" />
            ) : existingStoragePath ? (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto text-xl">📄</div>
            ) : null}
            <p className="text-xs text-foreground truncate max-w-[120px] mx-auto">{file ? file.name : 'مرفوع مسبقاً 🔒'}</p>
            <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} className="text-xs text-destructive hover:underline flex items-center gap-1 mx-auto">
              <Trash2 size={10} /> حذف
            </button>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2">{icon}</div>
            <p className="text-xs font-medium text-foreground/70">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">اضغط للرفع أو اسحب هنا</p>
            <p className="text-[10px] text-muted-foreground">JPG, PNG, PDF — 5MB</p>
          </>
        )}
      </div>
    </div>
  );
};

const AddEmployeeModal = ({ onClose, onSuccess, editEmployee }: Props) => {
  const isEdit = !!editEmployee;
  const { toast } = useToast();
  const step = useEmployeeWizardStore((s) => s.step);
  const saving = useEmployeeWizardStore((s) => s.saving);
  const errors = useEmployeeWizardStore((s) => s.errors);
  const form = useEmployeeWizardStore((s) => s.form);
  const files = useEmployeeWizardStore((s) => s.files);
  const setStep = useEmployeeWizardStore((s) => s.setStep);
  const setSaving = useEmployeeWizardStore((s) => s.setSaving);
  const setErrors = useEmployeeWizardStore((s) => s.setErrors);
  const setField = useEmployeeWizardStore((s) => s.setField);
  const setFiles = useEmployeeWizardStore((s) => s.setFiles);
  const resetWizard = useEmployeeWizardStore((s) => s.reset);
  const hydrateForEdit = useEmployeeWizardStore((s) => s.hydrateForEdit);
  const [schemes, setSchemes] = useState<{ id: string; name: string }[]>([]);
  const [availableApps, setAvailableApps] = useState<EmployeeAppOption[]>([]);
  const NATIONALITIES: { value: string; label: string }[] = [
    { value: 'سعودي', label: 'سعودي' },
    { value: 'يمني', label: 'يمني' },
    { value: 'مصري', label: 'مصري' },
    { value: 'سوداني', label: 'سوداني' },
    { value: 'سوري', label: 'سوري' },
    { value: 'أردني', label: 'أردني' },
    { value: 'فلسطيني', label: 'فلسطيني' },
    { value: 'لبناني', label: 'لبناني' },
    { value: 'هندي', label: 'هندي' },
    { value: 'باكستاني', label: 'باكستاني' },
    { value: 'بنغلاديشي', label: 'بنغلاديشي' },
    { value: 'فلبيني', label: 'فلبيني' },
    { value: 'إندونيسي', label: 'إندونيسي' },
    { value: 'نيبالي', label: 'نيبالي' },
    { value: 'إثيوبي', label: 'إثيوبي' },
    { value: 'إريتري', label: 'إريتري' },
    { value: 'صومالي', label: 'صومالي' },
  ];

  const APP_COLOR_FALLBACKS: Record<string, { bg: string; fg: string }> = {
    'هنقرستيشن': { bg: '#ea580c', fg: '#ffffff' },
    'هنجر': { bg: '#ea580c', fg: '#ffffff' },
    'كيتا': { bg: '#7c3aed', fg: '#ffffff' },
  };

  const getAppChipColors = (appName: string) => {
    const app = availableApps.find((a) => a.name === appName);
    if (app?.brand_color) {
      return {
        bg: app.brand_color,
        fg: app.text_color || '#ffffff',
      };
    }
    return APP_COLOR_FALLBACKS[appName] || { bg: '#6366f1', fg: '#ffffff' };
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      employeeService.getActiveSalarySchemes(),
      employeeService.getActiveApps(),
    ]).then(([schemesRes, appsRes]) => {
      if (!isMounted) return;
      if (schemesRes.data) setSchemes(schemesRes.data);
      if (appsRes.data) setAvailableApps(appsRes.data);
    });

    if (editEmployee) {
      employeeService.getEmployeeAssignedAppNames(editEmployee.id).then(({ data }) => {
        if (!isMounted || !data) return;
        setField('selected_apps', data);
      });
      employeeService.getEmployeeScheme(editEmployee.id).then(({ data }) => {
        if (!isMounted) return;
        if (data?.scheme_id) setField('scheme_id', data.scheme_id);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [editEmployee, setField]);


  // Pre-fill form when editing
  useEffect(() => {
    if (editEmployee) {
      hydrateForEdit({
        name: editEmployee.name || '',
        employee_code: editEmployee.employee_code || '',
        job_title: editEmployee.job_title || '',
        phone: editEmployee.phone || '',
        email: editEmployee.email || '',
        national_id: editEmployee.national_id || '',
        nationality: editEmployee.nationality || '',
        bank_account_number: editEmployee.bank_account_number || '',
        city: (editEmployee.city as 'makkah' | 'jeddah' | '') || '',
        join_date: editEmployee.join_date || '',
        birth_date: editEmployee.birth_date || '',
        residency_expiry: editEmployee.residency_expiry || '',
        health_insurance_expiry: editEmployee.health_insurance_expiry || '',
        probation_end_date: editEmployee.probation_end_date || '',
        probation_months: '',
        license_status: (editEmployee.license_status as 'has_license' | 'no_license' | 'applied') || 'no_license',
        sponsorship_status: (editEmployee.sponsorship_status as 'sponsored' | 'not_sponsored' | 'absconded' | 'terminated') || 'not_sponsored',
        salary_type: (editEmployee.salary_type as 'orders' | 'shift') || 'orders',
        base_salary: editEmployee.base_salary ? String(editEmployee.base_salary) : '',
        selected_apps: [],
        scheme_id: '',
        preferred_language: (editEmployee.preferred_language as 'ar' | 'en' | 'ur') || 'ar',
      });
    } else {
      resetWizard();
    }
  }, [editEmployee, hydrateForEdit, resetWizard]);

  // Auto-default scheme when salary type is per-order.
  useEffect(() => {
    if (form.salary_type !== 'orders') return;
    if (form.scheme_id) return;
    if (schemes.length === 0) return;
    setField('scheme_id', schemes[0]!.id);
  }, [form.salary_type, form.scheme_id, schemes, setField]);

  const resStatus = (() => {
    if (!form.residency_expiry) return null;
    try {
      const days = differenceInDays(parseISO(form.residency_expiry), new Date());
      return { days, valid: days >= 0 };
    } catch { return null; }
  })();

  const toggleApp = (app: string) => {
    const nextSelected = form.selected_apps.includes(app)
      ? form.selected_apps.filter((a) => a !== app)
      : [...form.selected_apps, app];
    setField('selected_apps', nextSelected);
  };

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.name || form.name.trim().length < 2) errs.name = 'الاسم مطلوب';
      if (!form.phone || !/^(05|966)\d{8,9}$/.test(form.phone)) errs.phone = 'رقم هاتف غير صحيح';
      if (!form.national_id || !/^[12]\d{9}$/.test(form.national_id)) errs.national_id = 'رقم هوية غير صحيح (10 أرقام)';
    }
    if (s === 1) {
      if (!form.residency_expiry) errs.residency_expiry = 'تاريخ انتهاء الإقامة مطلوب';
    }
    if (s === 2) {
      if (form.salary_type === 'shift' && (!form.base_salary || parseFloat(form.base_salary) <= 0)) errs.base_salary = 'الراتب مطلوب';
      if (form.salary_type === 'orders' && !form.scheme_id) errs.scheme_id = 'اختر السكيمة';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (validateStep(step)) setStep(Math.min(step + 1, STEPS.length - 1));
  };
  const back = () => setStep(Math.max(step - 1, 0));

  const save = async () => {
    if (!validateStep(step)) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        employee_code: form.employee_code || null,
        job_title: form.job_title || null,
        phone: form.phone || null,
        email: form.email || null,
        national_id: form.national_id || null,
        nationality: form.nationality || null,
        bank_account_number: form.bank_account_number || null,
        city: form.city || null,
        join_date: form.join_date || null,
        birth_date: form.birth_date || null,
        residency_expiry: form.residency_expiry || null,
        health_insurance_expiry: form.health_insurance_expiry || null,
        probation_end_date: form.probation_end_date || null,
        license_status: form.license_status,
        sponsorship_status: form.sponsorship_status,
        salary_type: form.salary_type,
        base_salary: form.salary_type === 'shift' ? parseFloat(form.base_salary) : 0,
        preferred_language: form.preferred_language,
      };

      let empId: string;

      if (isEdit && editEmployee) {
        await employeeService.updateEmployee(editEmployee.id, payload);
        empId = editEmployee.id;
      } else {
        payload.status = 'active';
        const { data: emp } = await employeeService.createEmployee(payload);
        empId = emp.id;
      }

      // Upload documents — store the storage PATH (not a public URL) so we can
      // generate short-lived signed URLs on demand later.
      const uploads = [
        { file: files.personal, path: `${empId}/personal_photo`, field: 'personal_photo_url' },
        { file: files.id, path: `${empId}/id_photo`, field: 'id_photo_url' },
        { file: files.license, path: `${empId}/license_photo`, field: 'license_photo_url' },
      ];
      const uploadResults = await Promise.all(
        uploads.map(async (u) => {
          if (!u.file) return null;
          const validation = validateUploadFile(u.file, {
            allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
          });
          if (!validation.valid) throw new Error(validation.error);
          const ext = u.file.name.split('.').pop();
          const storagePath = `${u.path}.${ext}`;
          const { data: upData } = await employeeService.uploadEmployeeDocument(storagePath, u.file);
          return upData ? { field: u.field, path: upData.path } : null;
        })
      );

      const updates = Object.fromEntries(
        uploadResults.filter(Boolean).map((r) => [r!.field, r!.path])
      ) as Record<string, string>;

      // Sync employee_apps: delete old, insert new
      const appIds = form.selected_apps
        .map((appName) => availableApps.find((a) => a.name === appName)?.id)
        .filter((id): id is string => Boolean(id));

      const postOps: Promise<unknown>[] = [];
      if (Object.keys(updates).length > 0) {
        postOps.push(employeeService.updateEmployeeDocumentPaths(empId, updates));
      }
      postOps.push(employeeService.replaceEmployeeApps(empId, appIds));

      if (form.salary_type === 'orders') {
        postOps.push(employeeService.upsertEmployeeScheme(empId, form.scheme_id));
      } else {
        postOps.push(employeeService.deleteEmployeeScheme(empId));
      }

      await Promise.all(postOps);

      toast({
        title: isEdit ? 'تم تحديث بيانات المندوب' : 'تم إضافة المندوب بنجاح',
        description: form.name,
      });

      if (onSuccess) onSuccess();
      else onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      toast({ title: 'خطأ في الحفظ', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">
            {isEdit ? 'تعديل بيانات المندوب' : 'إضافة مندوب جديد'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-0 px-6 pt-4 pb-2 shrink-0">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < step ? 'bg-success text-success-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-success' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 0 */}
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2"><SectionTitle title="── البيانات الأساسية ──" /></div>
              <F label="الاسم الكامل" required error={errors.name}>
                <Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="أحمد محمد العمري" />
              </F>
              <F label="كود الموظف">
                <Input value={form.employee_code} onChange={e => setField('employee_code', e.target.value)} placeholder="EMP-001" dir="ltr" />
              </F>
              <F label="المسمى الوظيفي">
                <Input value={form.job_title} onChange={e => setField('job_title', e.target.value)} placeholder="مندوب توصيل" />
              </F>
              <F label="رقم الهاتف" required error={errors.phone}>
                <Input value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="0551234567" dir="ltr" />
              </F>
              <F label="البريد الإلكتروني">
                <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="example@email.com" dir="ltr" />
              </F>
              <F label="رقم الهوية الوطنية" required error={errors.national_id}>
                <Input value={form.national_id} onChange={e => setField('national_id', e.target.value)} placeholder="2xxxxxxxxx" dir="ltr" />
              </F>
              <F label="الجنسية">
                <Select value={form.nationality || ''} onValueChange={v => setField('nationality', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجنسية" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((n) => (
                      <SelectItem key={n.value} value={n.value}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="رقم الحساب البنكي">
                <Input value={form.bank_account_number} onChange={e => setField('bank_account_number', e.target.value)} dir="ltr" />
              </F>
              <F label="المدينة">
                <div className="flex gap-3 mt-1">
                  {([
                    { v: 'makkah', l: 'مكة' },
                    { v: 'jeddah', l: 'جدة' },
                  ] as const).map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => setField('city', v)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${form.city === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </F>
              <F label="تاريخ الانضمام">
                <Input type="date" value={form.join_date} onChange={e => setField('join_date', e.target.value)} />
              </F>
              <F label="تاريخ الميلاد">
                <Input type="date" value={form.birth_date} onChange={e => setField('birth_date', e.target.value)} />
              </F>

              {/* ─── فترة التجربة ─── */}
              <div className="sm:col-span-2">
                <SectionTitle title="── فترة التجربة (اختياري) ──" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F label="تحديد المدة (بالأشهر)">
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 6].map(m => (
                        <button
                          key={m} type="button"
                          onClick={() => {
                            const base = form.join_date ? new Date(form.join_date) : new Date();
                            base.setMonth(base.getMonth() + m);
                            const iso = base.toISOString().split('T')[0];
                            setField('probation_months', String(m));
                            setField('probation_end_date', iso);
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${form.probation_months === String(m) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                        >
                          {m} {m === 1 ? 'شهر' : 'أشهر'}
                        </button>
                      ))}
                    </div>
                  </F>
                  <F label="أو حدد تاريخ الانتهاء مباشرة">
                    <Input
                      type="date"
                      value={form.probation_end_date}
                      onChange={e => { setField('probation_end_date', e.target.value); setField('probation_months', ''); }}
                    />
                    {form.probation_end_date && (
                      <button
                        type="button"
                        onClick={() => { setField('probation_end_date', ''); setField('probation_months', ''); }}
                        className="text-xs text-destructive hover:underline mt-1"
                      >
                        × مسح فترة التجربة
                      </button>
                    )}
                  </F>
                </div>
              </div>
              <F label="لغة كشف الراتب">
                <div className="flex gap-2 mt-1">
                  {([
                    { v: 'ar', flag: '🇸🇦', l: 'العربية' },
                    { v: 'en', flag: '🇬🇧', l: 'English' },
                    { v: 'ur', flag: '🇵🇰', l: 'اردو' },
                  ] as { v: 'ar' | 'en' | 'ur'; flag: string; l: string }[]).map(({ v, flag, l }) => (
                    <button key={v} type="button" onClick={() => setField('preferred_language', v)}
                      className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1 ${form.preferred_language === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                      {flag} {l}
                    </button>
                  ))}
                </div>
              </F>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2"><SectionTitle title="── الإقامة والوثائق ──" /></div>
              <div className="sm:col-span-2">
                <F label="تاريخ انتهاء الإقامة" required error={errors.residency_expiry}>
                  <Input type="date" value={form.residency_expiry} onChange={e => setField('residency_expiry', e.target.value)} />
                </F>
                {resStatus && (
                  <div className={`mt-2 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${resStatus.valid ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {resStatus.valid ? '✅' : '🔴'}
                    <span>
                      حالة الإقامة: {resStatus.valid ? 'صالحة' : 'منتهية'} —
                      {resStatus.valid ? ` متبقي ${resStatus.days} يوم` : ` منذ ${Math.abs(resStatus.days!)} يوم`}
                    </span>
                  </div>
                )}
              </div>
              <F label="تاريخ انتهاء التأمين الصحي">
                <Input type="date" value={form.health_insurance_expiry} onChange={e => setField('health_insurance_expiry', e.target.value)} />
              </F>
              <F label="حالة الرخصة">
                <Select
                  value={form.license_status}
                  onValueChange={(v) => setField('license_status', v as 'has_license' | 'no_license' | 'applied')}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="has_license">لديه رخصة</SelectItem>
                    <SelectItem value="no_license">ليس لديه رخصة</SelectItem>
                    <SelectItem value="applied">تم التقديم عليها</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F label="حالة الكفالة">
                <Select
                  value={form.sponsorship_status}
                  onValueChange={(v) =>
                    setField('sponsorship_status', v as 'sponsored' | 'not_sponsored' | 'absconded' | 'terminated')
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sponsored">على الكفالة</SelectItem>
                    <SelectItem value="not_sponsored">ليس على الكفالة</SelectItem>
                    <SelectItem value="absconded">هروب</SelectItem>
                    <SelectItem value="terminated">انتهاء الخدمة</SelectItem>
                  </SelectContent>
                </Select>
              </F>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <SectionTitle title="── نوع الراتب ──" />
              <div className="flex gap-3">
                {([
                  { v: 'orders', l: '📦 بالطلب' },
                  { v: 'shift', l: '🕐 ثابت شهري' },
                ] as const).map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => setField('salary_type', v)}
                    className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors ${form.salary_type === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {form.salary_type === 'shift' && (
                <F label="الراتب الشهري (ر.س)" required error={errors.base_salary}>
                  <Input type="number" value={form.base_salary} onChange={e => setField('base_salary', e.target.value)} />
                </F>
              )}
              {form.salary_type === 'orders' && (
                <F label="السكيمة (بالطلب)" required error={errors.scheme_id}>
                  <Select value={form.scheme_id || ''} onValueChange={v => setField('scheme_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السكيمة" />
                    </SelectTrigger>
                    <SelectContent>
                      {schemes.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </F>
              )}
              <SectionTitle title="── المنصات المرتبطة ──" />
              <div className="flex flex-wrap gap-2">
                {availableApps.map(app => (
                  <button key={app.id} type="button" onClick={() => toggleApp(app.name)}
                    style={form.selected_apps.includes(app.name) ? {
                      backgroundColor: getAppChipColors(app.name).bg,
                      color: getAppChipColors(app.name).fg,
                      borderColor: getAppChipColors(app.name).bg,
                    } : undefined}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${form.selected_apps.includes(app.name) ? '' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                    {app.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                المنصات المرتبطة تُسحب تلقائياً من قائمة التطبيقات داخل النظام.
              </p>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <SectionTitle title="── رفع المستندات ──" />
              <div className="flex gap-4">
                <UploadArea
                  label="الصورة الشخصية" icon="📷"
                  file={files.personal} existingStoragePath={editEmployee?.personal_photo_url}
                  onFile={(f) => setFiles({ personal: f })}
                  onRemove={() => setFiles({ personal: null })}
                />
                <UploadArea
                  label="صورة الهوية" icon="🪪"
                  file={files.id} existingStoragePath={editEmployee?.id_photo_url}
                  onFile={(f) => setFiles({ id: f })}
                  onRemove={() => setFiles({ id: null })}
                />
                <UploadArea
                  label="صورة الرخصة" icon="🚗"
                  file={files.license} existingStoragePath={editEmployee?.license_photo_url}
                  onFile={(f) => setFiles({ license: f })}
                  onRemove={() => setFiles({ license: null })}
                />
              </div>
              <p className="text-xs text-muted-foreground">الملفات المقبولة: JPG, PNG, PDF — الحجم الأقصى: 5MB لكل ملف</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={step === 0 ? onClose : back} disabled={saving}>
            {step === 0 ? 'إلغاء' : <><ChevronLeft size={15} /> السابق</>}
          </Button>
          <Button onClick={step === STEPS.length - 1 ? save : next} disabled={saving} className="gap-2">
            {saving ? 'جاري الحفظ...' : step === STEPS.length - 1
              ? <><Check size={15} /> {isEdit ? 'حفظ التعديلات' : 'حفظ المندوب'}</>
              : <>التالي <ChevronRight size={15} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;

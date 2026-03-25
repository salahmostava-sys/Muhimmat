import { create } from 'zustand';

export type SalaryType = 'orders' | 'shift';

export type EmployeeWizardFiles = {
  personal: File | null;
  id: File | null;
  license: File | null;
};

export type EmployeeWizardForm = {
  name: string;
  employee_code: string;
  job_title: string;
  phone: string;
  email: string;
  national_id: string;
  nationality: string;
  bank_account_number: string;
  city: 'makkah' | 'jeddah' | '';
  join_date: string;
  birth_date: string;
  residency_expiry: string;
  health_insurance_expiry: string;
  probation_end_date: string;
  probation_months: string;
  license_status: 'has_license' | 'no_license' | 'applied';
  sponsorship_status: 'sponsored' | 'not_sponsored' | 'absconded' | 'terminated';
  salary_type: SalaryType;
  base_salary: string;
  selected_apps: string[];
  scheme_id: string;
  preferred_language: 'ar' | 'en' | 'ur';
};

export type EmployeeWizardState = {
  step: number;
  saving: boolean;
  errors: Record<string, string>;
  form: EmployeeWizardForm;
  files: EmployeeWizardFiles;

  setStep: (step: number) => void;
  setSaving: (saving: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  setField: <K extends keyof EmployeeWizardForm>(key: K, value: EmployeeWizardForm[K]) => void;
  setFiles: (patch: Partial<EmployeeWizardFiles>) => void;
  reset: () => void;
  hydrateForEdit: (data: Partial<EmployeeWizardForm>) => void;
};

const initialForm: EmployeeWizardForm = {
  name: '',
  employee_code: '',
  job_title: '',
  phone: '',
  email: '',
  national_id: '',
  nationality: '',
  bank_account_number: '',
  city: '',
  join_date: '',
  birth_date: '',
  residency_expiry: '',
  health_insurance_expiry: '',
  probation_end_date: '',
  probation_months: '',
  license_status: 'no_license',
  sponsorship_status: 'not_sponsored',
  salary_type: 'orders',
  base_salary: '',
  selected_apps: [],
  scheme_id: '',
  preferred_language: 'ar',
};

const initialFiles: EmployeeWizardFiles = {
  personal: null,
  id: null,
  license: null,
};

export const useEmployeeWizardStore = create<EmployeeWizardState>((set) => ({
  step: 0,
  saving: false,
  errors: {},
  form: initialForm,
  files: initialFiles,

  setStep: (step) => set({ step }),
  setSaving: (saving) => set({ saving }),
  setErrors: (errors) => set({ errors }),
  setField: (key, value) => set((s) => ({ form: { ...s.form, [key]: value } })),
  setFiles: (patch) => set((s) => ({ files: { ...s.files, ...patch } })),
  reset: () =>
    set({
      step: 0,
      saving: false,
      errors: {},
      form: initialForm,
      files: initialFiles,
    }),
  hydrateForEdit: (data) =>
    set((s) => ({
      form: {
        ...s.form,
        ...data,
      },
    })),
}));


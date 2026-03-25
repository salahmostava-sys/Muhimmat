import { createContext, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface SystemSettings {
  id: string;
  project_name_ar: string;
  project_name_en: string;
  project_subtitle_ar: string;
  project_subtitle_en: string;
  logo_url: string | null;
  default_language: string;
  theme: string;
  iqama_alert_days?: number;
}

interface SystemSettingsContextType {
  settings: SystemSettings | null;
  projectName: string;
  projectSubtitle: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaults: SystemSettings = {
  id: '',
  project_name_ar: 'مهمة التوصيل',
  project_name_en: 'Muhimmat alTawseel',
  project_subtitle_ar: 'إدارة المناديب',
  project_subtitle_en: 'Rider Management',
  logo_url: null,
  default_language: 'ar',
  theme: 'light',
  iqama_alert_days: 90,
};

const SystemSettingsContext = createContext<SystemSettingsContextType>({
  settings: defaults,
  projectName: defaults.project_name_ar,
  projectSubtitle: defaults.project_subtitle_ar,
  loading: true,
  refresh: async () => {},
});

export const SystemSettingsProvider = ({ children }: { children: ReactNode }) => {
  const query = useQuery({
    queryKey: ['system-settings'] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message || 'تعذر تحميل إعدادات النظام');
      return (data as unknown as SystemSettings) ?? defaults;
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });

  const s = query.data ?? defaults;
  const projectName = s.project_name_ar;
  const projectSubtitle = s.project_subtitle_ar;
  const loading = query.isLoading;

  // Sync browser title
  useEffect(() => {
    document.title = projectName;
  }, [projectName]);

  return (
    <SystemSettingsContext.Provider value={{ settings: s, projectName, projectSubtitle, loading, refresh: async () => { await query.refetch(); } }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => useContext(SystemSettingsContext);

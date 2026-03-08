import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useSystemSettings } from '@/context/SystemSettingsContext';
import ProjectSettings from '@/components/settings/ProjectSettings';
import { Settings2 } from 'lucide-react';

export default function GeneralSettings() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { projectName } = useSystemSettings();
  const isRTL = lang === 'ar';

  // Dynamic page title
  document.title = `${projectName} | ${isRTL ? 'الإعدادات العامة' : 'General Settings'}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Settings2 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {isRTL ? 'الإعدادات العامة' : 'General Settings'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'إدارة اسم المشروع والشعار والمظهر' : 'Manage project name, logo and theme'}
          </p>
        </div>
      </div>

      <ProjectSettings />
    </div>
  );
}

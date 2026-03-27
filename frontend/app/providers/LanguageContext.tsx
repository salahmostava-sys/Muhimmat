import { createContext, useContext, useEffect, ReactNode, useMemo } from 'react';
import i18n from '@app/i18n';

type Lang = 'ar';

interface LanguageContextType {
  lang: Lang;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    document.documentElement.style.fontFamily = "'IBM Plex Sans Arabic', sans-serif";
    i18n.changeLanguage('ar');
  }, []);

  const value = useMemo<LanguageContextType>(() => ({ lang: 'ar', isRTL: true }), []);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

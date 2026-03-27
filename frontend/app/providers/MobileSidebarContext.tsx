import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface MobileSidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType>({} as MobileSidebarContextType);

export const MobileSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close on route change (mobile nav)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close when resizing to desktop
  useEffect(() => {
    const handler = () => {
      if (globalThis.innerWidth >= 1024) setIsOpen(false);
    };
    globalThis.addEventListener('resize', handler);
    return () => globalThis.removeEventListener('resize', handler);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);
  const value = useMemo<MobileSidebarContextType>(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle]
  );

  return (
    <MobileSidebarContext.Provider value={value}>
      {children}
    </MobileSidebarContext.Provider>
  );
};

export const useMobileSidebar = () => useContext(MobileSidebarContext);

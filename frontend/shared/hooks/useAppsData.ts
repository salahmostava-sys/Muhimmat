import { useQuery } from '@tanstack/react-query';
import { appService } from '@services/appService';
import { useAuth } from '@app/providers/AuthContext';
import { authQueryUserId, useAuthQueryGate } from '@shared/hooks/useAuthQueryGate';
import { useQueryErrorToast } from '@shared/hooks/useQueryErrorToast';

export const appsDataQueryKey = (userId: string) => ['apps', userId, 'list-with-counts'] as const;

type AppWithCount = {
  id: string;
  name: string;
  name_en: string | null;
  brand_color: string;
  text_color: string;
  is_active: boolean;
  employeeCount: number;
  custom_columns: unknown[];
};

export const useAppsData = () => {
  const { user, session } = useAuth();
  const { userId, authReady } = useAuthQueryGate();
  const uid = authQueryUserId(user?.id ?? userId);
  const enabled = !!session && authReady;
  const q = useQuery({
    queryKey: appsDataQueryKey(uid),
    queryFn: async () => {
      const data = await appService.getAll();
      if (!data.length) return [] as AppWithCount[];

      const appsWithCounts = await Promise.all(
        data.map(async (app) => {
          const count = await appService.countActiveEmployeeApps(app.id);
          return {
            id: app.id,
            name: app.name,
            name_en: app.name_en,
            brand_color: app.brand_color || '#6366f1',
            text_color: app.text_color || '#ffffff',
            is_active: app.is_active,
            employeeCount: count,
            custom_columns: (app.custom_columns as unknown[]) || [],
          } as AppWithCount;
        })
      );

      return appsWithCounts;
    },
    // Static-ish domain policy: cached aggressively
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled,
  });
  useQueryErrorToast(q.isError, q.error);
  return q;
};

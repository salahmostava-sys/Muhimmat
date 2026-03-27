import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '@services/vehicleService';
import { useAuth } from '@app/providers/AuthContext';
import { authQueryUserId, useAuthQueryGate } from '@shared/hooks/useAuthQueryGate';
import { useQueryErrorToast } from '@shared/hooks/useQueryErrorToast';

export const maintenanceDataQueryKey = (userId: string) => ['maintenance', userId, 'page-data'] as const;

export const useMaintenanceData = () => {
  const { user, session } = useAuth();
  const { userId, authReady } = useAuthQueryGate();
  const uid = authQueryUserId(user?.id ?? userId);
  const enabled = !!session && authReady;
  const q = useQuery({
    queryKey: maintenanceDataQueryKey(uid),
    queryFn: async () => {
      const [logs, vehicles] = await Promise.all([
        vehicleService.getMaintenanceLogs(),
        vehicleService.getForSelect(),
      ]);

      return {
        logs,
        vehicles,
      };
    },
    staleTime: 60_000,
    enabled,
  });
  useQueryErrorToast(q.isError, q.error, undefined, q.refetch);
  return q;
};

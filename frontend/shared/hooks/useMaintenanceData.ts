import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { authQueryUserId, useAuthQueryGate } from '@shared/hooks/useAuthQueryGate';
import * as maintenanceService from '@services/maintenanceService';

export function useMaintenanceLogs() {
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(userId);
  return useQuery({
    queryKey: ['maintenance_logs', uid],
    queryFn: () => maintenanceService.getMaintenanceLogs(),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSpareParts() {
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(userId);
  return useQuery({
    queryKey: ['spare_parts', uid],
    queryFn: () => maintenanceService.getSpareparts(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvalidateMaintenanceQueries() {
  const qc = useQueryClient();
  const { userId } = useAuthQueryGate();
  const uid = authQueryUserId(userId);
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['maintenance_logs', uid] });
    void qc.invalidateQueries({ queryKey: ['spare_parts', uid] });
    void qc.invalidateQueries({ queryKey: ['alerts', uid] });
  }, [qc, uid]);
}

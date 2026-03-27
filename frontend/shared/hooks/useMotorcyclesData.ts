import { useQuery } from '@tanstack/react-query';
import { vehicleService } from '@services/vehicleService';
import { useAuth } from '@app/providers/AuthContext';
import { authQueryUserId, useAuthQueryGate } from '@shared/hooks/useAuthQueryGate';
import { useQueryErrorToast } from '@shared/hooks/useQueryErrorToast';

export const motorcyclesDataQueryKey = (userId: string) => ['motorcycles', userId, 'list'] as const;

export const useMotorcyclesData = () => {
  const { user, session } = useAuth();
  const { userId, authReady } = useAuthQueryGate();
  const uid = authQueryUserId(user?.id ?? userId);
  const enabled = !!session && authReady && !!user?.id;
  const q = useQuery({
    queryKey: motorcyclesDataQueryKey(uid),
    queryFn: async () => {
      return vehicleService.getAllWithCurrentRider();
    },
    staleTime: 60_000,
    enabled,
  });
  useQueryErrorToast(q.isError, q.error, undefined, q.refetch);
  return q;
};

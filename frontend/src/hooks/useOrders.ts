import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import { toastQueryError } from '@/lib/query';

export const ordersQueryKey = ['orders'] as const;

export const useOrders = () =>
  useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      const { data } = await orderService.getAll();
      return data || [];
    },
    onError: (err) => toastQueryError(err),
    retry: 2,
    staleTime: 30_000,
  });

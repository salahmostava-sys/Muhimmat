import { useQuery } from '@tanstack/react-query';
import { employeeService } from '@/services/employeeService';
import { authQueryUserId, useAuthQueryGate } from '@/hooks/useAuthQueryGate';
import { useQueryErrorToast } from '@/hooks/useQueryErrorToast';

export const employeesQueryKey = (userId: string) => ['employees', userId] as const;

export const useEmployees = () => {
  const { enabled, userId } = useAuthQueryGate();
  const uid = authQueryUserId(userId);
  const q = useQuery({
    queryKey: employeesQueryKey(uid),
    queryFn: async () => {
      const result = await Promise.race([
        employeeService.getAll(),
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: 'انتهت مهلة تحميل البيانات. حاول مرة أخرى.' } }), 12000)
        ),
      ]);

      if (result.error) {
        throw new Error(result.error.message || 'تعذر تحميل الموظفين');
      }

      return result.data || [];
    },
    staleTime: 60_000,
    enabled,
  });
  useQueryErrorToast(q.isError, q.error);
  return q;
};

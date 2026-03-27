import { supabase } from '@services/supabase/client';
import { handleSupabaseError } from '@services/serviceError';

export const externalDeductionService = {
  getApprovedByMonth: async (monthYear: string) => {
    const { data, error } = await supabase
      .from('external_deductions')
      .select('employee_id, amount')
      .eq('apply_month', monthYear)
      .eq('approval_status', 'approved');
    if (error) handleSupabaseError(error, 'externalDeductionService.getApprovedByMonth');
    return data ?? [];
  },
};

export default externalDeductionService;

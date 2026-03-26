import { supabase } from '@services/supabase/client';
import type { Json } from '@services/supabase/types';
import { toServiceError } from '@services/serviceError';

interface SchemePayload {
  name: string;
  scheme_type: 'order_based' | 'fixed_monthly';
  monthly_amount: number | null;
  target_orders: number | null;
  target_bonus: number | null;
}

interface TierInsertPayload {
  scheme_id: string;
  from_orders: number;
  to_orders: number | null;
  price_per_order: number;
  tier_order: number;
  tier_type: 'total_multiplier' | 'fixed_amount' | 'base_plus_incremental';
  incremental_threshold: number | null;
  incremental_price: number | null;
}

export const salarySchemeService = {
  getSchemes: async () => {
    const { data, error } = await supabase.from('salary_schemes').select('*').order('created_at', { ascending: false });
    if (error) throw toServiceError(error, 'salarySchemeService.getSchemes');
    return data ?? [];
  },

  getTiers: async () => {
    const { data, error } = await supabase.from('salary_scheme_tiers').select('*').order('tier_order');
    if (error) throw toServiceError(error, 'salarySchemeService.getTiers');
    return data ?? [];
  },

  getSnapshots: async () => {
    const { data, error } = await supabase.from('scheme_month_snapshots').select('scheme_id, month_year');
    if (error) throw toServiceError(error, 'salarySchemeService.getSnapshots');
    return data ?? [];
  },

  updateScheme: async (schemeId: string, payload: SchemePayload) => {
    const { error } = await supabase.from('salary_schemes').update(payload).eq('id', schemeId);
    if (error) throw toServiceError(error, 'salarySchemeService.updateScheme');
  },

  createScheme: async (payload: SchemePayload) => {
    const { data, error } = await supabase.from('salary_schemes').insert(payload).select('id').single();
    if (error) throw toServiceError(error, 'salarySchemeService.createScheme');
    return data as { id: string };
  },

  deleteSchemeTiers: async (schemeId: string) => {
    const { error } = await supabase.from('salary_scheme_tiers').delete().eq('scheme_id', schemeId);
    if (error) throw toServiceError(error, 'salarySchemeService.deleteSchemeTiers');
  },

  insertSchemeTiers: async (payload: TierInsertPayload[]) => {
    const { error } = await supabase.from('salary_scheme_tiers').insert(payload);
    if (error) throw toServiceError(error, 'salarySchemeService.insertSchemeTiers');
  },

  updateSchemeStatus: async (schemeId: string, status: 'active' | 'archived') => {
    const { error } = await supabase.from('salary_schemes').update({ status }).eq('id', schemeId);
    if (error) throw toServiceError(error, 'salarySchemeService.updateSchemeStatus');
  },

  upsertSnapshot: async (schemeId: string, monthYear: string, snapshot: Json) => {
    const { error } = await supabase
      .from('scheme_month_snapshots')
      .upsert({ scheme_id: schemeId, month_year: monthYear, snapshot }, { onConflict: 'scheme_id,month_year' });
    if (error) throw toServiceError(error, 'salarySchemeService.upsertSnapshot');
  },

  deleteSnapshot: async (schemeId: string, monthYear: string) => {
    const { error } = await supabase.from('scheme_month_snapshots').delete().eq('scheme_id', schemeId).eq('month_year', monthYear);
    if (error) throw toServiceError(error, 'salarySchemeService.deleteSnapshot');
  },
};

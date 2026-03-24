import { supabase } from '@/integrations/supabase/client';

export const employeeService = {
  async getAll() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
    return { data, error };
  },

  async updateCity(employeeId: string, city: 'makkah' | 'jeddah') {
    const { error } = await supabase
      .from('employees')
      .update({ city })
      .eq('id', employeeId);
    return { error };
  },

  async getById(employeeId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();
    return { data, error };
  },

  async deleteById(employeeId: string) {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);
    return { error };
  },

  async getActiveForSalaryContext() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, job_title, national_id, salary_type, base_salary, iban, city, preferred_language, phone')
      .eq('status', 'active')
      .order('name');
    return { data, error };
  },
};

export default employeeService;

import { supabase } from '@/integrations/supabase/client';

export interface MileagePayload {
  vehicle_assignment_id: string;
  date: string;
  start_km: number;
  end_km: number;
  fuel_cost?: number;
  notes?: string;
}

export const fuelService = {
  getMileageLogs: async (from?: string, to?: string) => {
    let query = supabase
      .from('vehicle_mileage')
      .select('*, vehicle_assignments(id, vehicle_id, employee_id, vehicles(plate_number, brand), employees(name))')
      .order('date', { ascending: false });

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data, error } = await query;
    return { data, error };
  },

  createMileageLog: async (payload: MileagePayload) => {
    const { data, error } = await supabase
      .from('vehicle_mileage')
      .insert(payload)
      .select()
      .single();
    return { data, error };
  },

  updateMileageLog: async (id: string, payload: Partial<MileagePayload>) => {
    const { data, error } = await supabase
      .from('vehicle_mileage')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  deleteMileageLog: async (id: string) => {
    const { error } = await supabase.from('vehicle_mileage').delete().eq('id', id);
    return { error };
  },

  getActiveAssignments: async () => {
    const { data, error } = await supabase
      .from('vehicle_assignments')
      .select('id, vehicle_id, employee_id, vehicles(plate_number, brand), employees(name)')
      .is('end_date', null);
    return { data, error };
  },

  getMileageByAssignment: async (assignmentId: string) => {
    const { data, error } = await supabase
      .from('vehicle_mileage')
      .select('*')
      .eq('vehicle_assignment_id', assignmentId)
      .order('date', { ascending: false });
    return { data, error };
  },

  getEmployeesForSelect: async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name')
      .eq('status', 'active')
      .order('name');
    return { data, error };
  },
};

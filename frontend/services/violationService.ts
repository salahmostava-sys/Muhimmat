import { supabase } from '@services/supabase/client';
import { toServiceError } from '@services/serviceError';

export const violationService = {
  getViolations: async () => {
    const { data, error } = await supabase
      .from('external_deductions')
      // Avoid joins/columns that may differ across deployments until schema is stabilized.
      .select('id, employee_id, amount, incident_date, apply_month, approval_status, note')
      .eq('type', 'fine')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw toServiceError(error, 'violationService.getViolations');
    return data ?? [];
  },

  findVehiclesByPlateQuery: async (q: string) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, plate_number, plate_number_en, brand, type')
      .or(`plate_number.ilike.%${q}%,plate_number_en.ilike.%${q}%`)
      .eq('status', 'active')
      .limit(8);
    if (error) throw toServiceError(error, 'violationService.findVehiclesByPlateQuery');
    return data ?? [];
  },

  findVehicleIdsByPlate: async (plate: string) => {
    const { data, error } = await supabase.from('vehicles').select('id').ilike('plate_number', `%${plate}%`).limit(5);
    if (error) throw toServiceError(error, 'violationService.findVehicleIdsByPlate');
    return data ?? [];
  },

  getAssignmentsByVehicleIds: async (vehicleIds: string[]) => {
    const { data, error } = await supabase
      .from('vehicle_assignments')
      .select('id, vehicle_id, employee_id, start_date, start_at, returned_at, end_date, employees(id, name, national_id), vehicles(plate_number, brand, type)')
      .in('vehicle_id', vehicleIds)
      .order('start_at', { ascending: false });
    if (error) throw toServiceError(error, 'violationService.getAssignmentsByVehicleIds');
    return data ?? [];
  },

  getExistingFineDeductions: async (employeeIds: string[], incidentDate: string, applyMonth: string) => {
    const { data, error } = await supabase
      .from('external_deductions')
      .select('id, employee_id, amount')
      .eq('type', 'fine')
      .in('employee_id', employeeIds)
      .eq('incident_date', incidentDate)
      .eq('apply_month', applyMonth);
    if (error) throw toServiceError(error, 'violationService.getExistingFineDeductions');
    return data ?? [];
  },

  createFineDeduction: async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.from('external_deductions').insert(payload).select('id').single();
    if (error) throw toServiceError(error, 'violationService.createFineDeduction');
    return data as { id: string };
  },

  updateViolation: async (id: string, payload: Record<string, unknown>) => {
    const { error } = await supabase.from('external_deductions').update(payload).eq('id', id);
    if (error) throw toServiceError(error, 'violationService.updateViolation');
  },

  deleteViolation: async (id: string) => {
    const { error } = await supabase.from('external_deductions').delete().eq('id', id);
    if (error) throw toServiceError(error, 'violationService.deleteViolation');
  },

  findMatchingAdvanceForFine: async (employeeId: string, applyMonth: string, amountMin: number, amountMax: number) => {
    const { data, error } = await supabase
      .from('advances')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .eq('first_deduction_month', applyMonth)
      .gte('monthly_amount', amountMin)
      .lte('monthly_amount', amountMax)
      .limit(1);
    if (error) throw toServiceError(error, 'violationService.findMatchingAdvanceForFine');
    return data ?? [];
  },

  createAdvanceFromFine: async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.from('advances').insert(payload).select('id').single();
    if (error) throw toServiceError(error, 'violationService.createAdvanceFromFine');
    return data as { id: string };
  },

  createSingleInstallment: async (payload: Record<string, unknown>) => {
    const { error } = await supabase.from('advance_installments').insert(payload);
    if (error) throw toServiceError(error, 'violationService.createSingleInstallment');
  },
};

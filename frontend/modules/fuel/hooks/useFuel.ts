import { fuelService } from '@services/fuelService';
import { useMemo } from 'react';

export function useFuel() {
  return useMemo(() => ({
    getActiveEmployees: fuelService.getActiveEmployees,
    getActiveApps: fuelService.getActiveApps,
    getActiveEmployeeAppLinks: fuelService.getActiveEmployeeAppLinks,
    getMonthlyOrders: fuelService.getMonthlyOrders,
    getMonthlyDailyMileage: fuelService.getMonthlyDailyMileage,
    getActiveVehicleAssignments: fuelService.getActiveVehicleAssignments,
    getDailyMileageByMonth: fuelService.getDailyMileageByMonth,
    upsertDailyMileage: fuelService.upsertDailyMileage,
    deleteDailyMileage: fuelService.deleteDailyMileage,
    saveMonthlyMileageImport: fuelService.saveMonthlyMileageImport,
    exportDailyMileage: fuelService.exportDailyMileage,
  }), []);
}

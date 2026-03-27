import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFuel } from './useFuel';

const serviceMock = vi.hoisted(() => ({
  getActiveEmployees: vi.fn(),
  getActiveApps: vi.fn(),
  getActiveEmployeeAppLinks: vi.fn(),
  getMonthlyOrders: vi.fn(),
  getMonthlyDailyMileage: vi.fn(),
  getActiveVehicleAssignments: vi.fn(),
  getDailyMileageByMonth: vi.fn(),
  upsertDailyMileage: vi.fn(),
  deleteDailyMileage: vi.fn(),
  saveMonthlyMileageImport: vi.fn(),
  exportDailyMileage: vi.fn(),
}));

vi.mock('@services/fuelService', () => ({
  fuelService: serviceMock,
}));

describe('useFuel', () => {
  it('returns service functions and keeps stable reference', () => {
    const { result, rerender } = renderHook(() => useFuel());
    const first = result.current;

    expect(first.getActiveEmployees).toBe(serviceMock.getActiveEmployees);
    expect(first.getMonthlyOrders).toBe(serviceMock.getMonthlyOrders);
    expect(first.exportDailyMileage).toBe(serviceMock.exportDailyMileage);

    rerender();
    expect(result.current).toBe(first);
  });
});

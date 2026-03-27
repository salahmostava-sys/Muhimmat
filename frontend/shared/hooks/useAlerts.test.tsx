import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAlerts } from './useAlerts';
import { alertsService } from '@services/alertsService';
import { buildAlertsFromResponses } from '@shared/lib/alertsBuilder';

vi.mock('@app/providers/SystemSettingsContext', () => ({
  useSystemSettings: () => ({ settings: { iqama_alert_days: 90 } }),
}));

vi.mock('@shared/hooks/useMonthlyActiveEmployeeIds', () => ({
  useMonthlyActiveEmployeeIds: () => ({ data: { employeeIds: ['emp-1'] } }),
}));

vi.mock('@services/alertsService', () => ({
  alertsService: {
    fetchAlertsDataWithTimeout: vi.fn(),
  },
}));

vi.mock('@shared/lib/alertsBuilder', () => ({
  buildAlertsFromResponses: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns alerts built from fetched responses', async () => {
    vi.mocked(alertsService.fetchAlertsDataWithTimeout).mockResolvedValue([
      { data: [{ id: 'emp-1', name: 'A', residency_expiry: '2026-01-10', probation_end_date: null }], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ] as unknown as Awaited<ReturnType<typeof alertsService.fetchAlertsDataWithTimeout>>);
    vi.mocked(buildAlertsFromResponses).mockReturnValue([
      {
        id: 'res-emp-1',
        type: 'residency',
        entityName: 'A',
        dueDate: '2026-01-10',
        daysLeft: 5,
        severity: 'urgent',
        resolved: false,
      },
    ]);

    const { result } = renderHook(() => useAlerts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.id).toBe('res-emp-1');
    expect(alertsService.fetchAlertsDataWithTimeout).toHaveBeenCalledOnce();
    expect(buildAlertsFromResponses).toHaveBeenCalledOnce();
  });

  it('returns error when alerts service fails', async () => {
    vi.mocked(alertsService.fetchAlertsDataWithTimeout).mockRejectedValue(new Error('timeout'));

    const { result } = renderHook(() => useAlerts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 6000 });
    expect(result.current.error?.message).toContain('timeout');
  });
});


import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryBuilder, type MockQueryResult } from '@shared/test/mocks/supabaseClientMock';

const { tableResults, fromMock } = vi.hoisted(() => {
  const tableResultsLocal: Record<string, MockQueryResult> = {};
  return {
    tableResults: tableResultsLocal,
    fromMock: vi.fn((table: string) => createQueryBuilder(tableResultsLocal[table] ?? { data: null, error: null })),
  };
});

vi.mock('@services/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock('@services/serviceError', () => ({
  handleSupabaseError: vi.fn((error: unknown, context: string) => {
    const message = error instanceof Error ? error.message : 'service error';
    throw new Error(`${context}: ${message}`);
  }),
}));

import { advanceService } from './advanceService';

describe('advanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(tableResults).forEach((k) => delete tableResults[k]);
  });

  it('creates advance successfully', async () => {
    tableResults.advances = {
      data: { id: 'adv-1', employee_id: 'emp-1', amount: 1000 },
      error: null,
    };

    const result = await advanceService.create({
      employee_id: 'emp-1',
      amount: 1000,
      monthly_amount: 250,
      total_installments: 4,
      disbursement_date: '2026-03-01',
      first_deduction_month: '2026-04',
    });

    expect(result?.id).toBe('adv-1');
    expect(fromMock).toHaveBeenCalledWith('advances');
  });

  it('throws when create advance fails', async () => {
    tableResults.advances = {
      data: null,
      error: new Error('insert failed'),
    };

    await expect(
      advanceService.create({
        employee_id: 'emp-1',
        amount: 1000,
        monthly_amount: 250,
        total_installments: 4,
        disbursement_date: '2026-03-01',
        first_deduction_month: '2026-04',
      }),
    ).rejects.toThrow('advanceService.create: insert failed');
  });
});

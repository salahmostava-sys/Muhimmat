import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryBuilder, type MockQueryResult } from '@shared/test/mocks/supabaseClientMock';

const { tableResults, fromMock, rpcMock } = vi.hoisted(() => {
  const tableResultsLocal: Record<string, MockQueryResult> = {};
  return {
    tableResults: tableResultsLocal,
    fromMock: vi.fn((table: string) => createQueryBuilder(tableResultsLocal[table] ?? { data: null, error: null })),
    rpcMock: vi.fn(),
  };
});

vi.mock('@services/supabase/client', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

vi.mock('@services/serviceError', () => ({
  handleSupabaseError: vi.fn((error: unknown, context: string) => {
    const message = error instanceof Error ? error.message : 'service error';
    throw new Error(`${context}: ${message}`);
  }),
}));

import { salaryService } from './salaryService';

describe('salaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(tableResults).forEach((k) => delete tableResults[k]);
  });

  it('returns pricing rules on success', async () => {
    tableResults.pricing_rules = {
      data: [
        {
          id: 'r1',
          app_id: 'app-1',
          min_orders: 1,
          max_orders: 10,
          rule_type: 'per_order',
          rate_per_order: 7,
          fixed_salary: null,
          is_active: true,
          priority: 1,
        },
      ],
      error: null,
    };

    const result = await salaryService.getPricingRules('app-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
    expect(fromMock).toHaveBeenCalledWith('pricing_rules');
  });

  it('throws when pricing rules query fails', async () => {
    tableResults.pricing_rules = {
      data: null,
      error: new Error('db down'),
    };

    await expect(salaryService.getPricingRules('app-1')).rejects.toThrow(
      'salaryService.getPricingRules: db down',
    );
  });

  it('calculates tier salary for total multiplier logic', () => {
    const salary = salaryService.calculateTierSalary(
      12,
      [
        { from_orders: 1, to_orders: 10, price_per_order: 5, tier_order: 1 },
        { from_orders: 11, to_orders: null, price_per_order: 7, tier_order: 2 },
      ],
      null,
      null,
    );

    // 10*5 + 2*7 = 64
    expect(salary).toBe(64);
  });
});

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
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'mock' }, error: null }),
      })),
    },
  },
}));

vi.mock('@services/serviceError', () => ({
  toServiceError: vi.fn((error: unknown, context: string) => {
    const message = error instanceof Error ? error.message : 'service error';
    return new Error(`${context}: ${message}`);
  }),
}));

import { employeeService } from './employeeService';

describe('employeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(tableResults).forEach((k) => delete tableResults[k]);
  });

  it('fetchEmployees returns data', async () => {
    tableResults.employees = {
      data: [{ id: 'e1', name: 'Ahmed' }],
      error: null,
    };

    const rows = await employeeService.getAll();
    expect(rows).toEqual([{ id: 'e1', name: 'Ahmed' }]);
    expect(fromMock).toHaveBeenCalledWith('employees');
  });

  it('throws when fetchEmployees query fails', async () => {
    tableResults.employees = {
      data: null,
      error: new Error('db down'),
    };

    await expect(employeeService.getAll()).rejects.toThrow('employeeService.getAll: db down');
  });
});

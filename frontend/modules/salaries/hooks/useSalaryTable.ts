import { useCallback, useMemo } from 'react';
import type { SalaryRow, SortDir } from '@modules/salaries/types/salary.types';
import { getTotalDeductions } from '@modules/salaries/lib/salaryDomain';
import { toComparableSortValue } from '@modules/salaries/lib/salaryConstants';

export function computeSalaryRow(r: SalaryRow) {
  const totalPlatformSalary = Number(r.engineBaseSalary || 0);
  const totalAdditions = r.incentives + r.sickAllowance;
  const totalWithSalary = totalPlatformSalary + totalAdditions;
  const totalDeductions = getTotalDeductions(r);
  const netSalary = totalWithSalary - totalDeductions;
  const remaining = netSalary - r.transfer;
  return { totalPlatformSalary, totalAdditions, totalWithSalary, totalDeductions, netSalary, remaining };
}

export function useSalaryFilteredRows(
  rows: SalaryRow[],
  search: string,
  statusFilter: string,
  cityFilter: string,
  sortField: string | null,
  sortDir: SortDir,
  platforms: string[]
) {
  const computeRow = useCallback((r: SalaryRow) => computeSalaryRow(r), []);

  const filteredBase = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchSearch = q === '' || r.employeeName.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchCity = cityFilter === 'all' || r.cityKey === cityFilter;
      return matchSearch && matchStatus && matchCity;
    });
  }, [rows, search, statusFilter, cityFilter]);

  const filtered = useMemo(() => {
    if (!sortField || !sortDir) return filteredBase;
    const getSortValue = (row: SalaryRow) => {
      const computed = computeRow(row);
      switch (sortField) {
        case 'employeeName':
          return row.employeeName;
        case 'jobTitle':
          return row.jobTitle;
        case 'nationalId':
          return row.nationalId;
        case 'platformSalaries':
          return computed.totalPlatformSalary;
        case 'incentives':
          return row.incentives;
        case 'totalAdditions':
          return computed.totalAdditions;
        case 'advanceDeduction':
          return row.advanceDeduction;
        case 'totalDeductions':
          return computed.totalDeductions;
        case 'netSalary':
          return computed.netSalary;
        case 'status':
          return row.status;
        default:
          if (platforms.includes(sortField)) return row.platformOrders[sortField] || 0;
          return toComparableSortValue((row as Record<string, unknown>)[sortField]);
      }
    };

    return [...filteredBase].sort((a, b) => {
      const va = getSortValue(a);
      const vb = getSortValue(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredBase, sortField, sortDir, computeRow, platforms]);

  return { filtered, filteredBase, computeRow };
}

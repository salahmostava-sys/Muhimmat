import { useCallback, useMemo, useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'multi_select' | 'single_select' | 'date_range' | 'number_range';
  options?: FilterOption[];
  defaultValues?: string[];
}

/** key → selected values (نصوص موحّدة لكل الأنواع، بما فيها نطاق التاريخ/الرقم كعنصرين) */
export interface FilterState {
  [key: string]: string[];
}

function buildDefaultState(configs: FilterConfig[]): FilterState {
  const s: FilterState = {};
  configs.forEach((c) => {
    s[c.key] = [...(c.defaultValues ?? [])];
  });
  return s;
}

function sortedJson(values: string[]) {
  return JSON.stringify([...values].sort((a, b) => a.localeCompare(b)));
}

export function useAdvancedFilter(configs: FilterConfig[]) {
  const [filters, setFilters] = useState<FilterState>(() => buildDefaultState(configs));

  const setFilter = useCallback((key: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: [...values] }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(buildDefaultState(configs));
  }, [configs]);

  const activeCount = useMemo(() => {
    return configs.filter((c) => {
      const current = filters[c.key] ?? [];
      const def = c.defaultValues ?? [];
      return sortedJson(current) !== sortedJson(def);
    }).length;
  }, [configs, filters]);

  return { filters, setFilter, resetFilters, activeCount };
}

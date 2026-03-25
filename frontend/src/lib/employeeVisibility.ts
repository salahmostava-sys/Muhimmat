export const EXCLUDED_SPONSORSHIP_STATUSES = ['absconded', 'terminated'] as const;
export type ExcludedSponsorshipStatus = (typeof EXCLUDED_SPONSORSHIP_STATUSES)[number];

export type EmployeeLike = {
  id: string;
  sponsorship_status?: string | null;
};

export function isExcludedSponsorshipStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (EXCLUDED_SPONSORSHIP_STATUSES as readonly string[]).includes(status);
}

/**
 * Visibility rule:
 * - Hide absconded/terminated by default.
 * - Keep visible if employee has activity in the target month (activeEmployeeIdsInMonth contains id).
 */
export function isEmployeeVisibleInMonth(
  employee: EmployeeLike,
  activeEmployeeIdsInMonth: ReadonlySet<string> | null | undefined
): boolean {
  if (!isExcludedSponsorshipStatus(employee.sponsorship_status ?? null)) return true;
  return !!activeEmployeeIdsInMonth?.has(employee.id);
}

export function filterVisibleEmployeesInMonth<T extends EmployeeLike>(
  employees: readonly T[],
  activeEmployeeIdsInMonth: ReadonlySet<string> | null | undefined
): T[] {
  return employees.filter((e) => isEmployeeVisibleInMonth(e, activeEmployeeIdsInMonth));
}


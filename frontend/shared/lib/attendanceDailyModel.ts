export type AttendanceStatus = "present" | "absent" | "leave" | "sick" | "late";

export interface AttendanceRecord {
  employeeId: string;
  status: AttendanceStatus | string | null;
  checkIn: string;
  checkOut: string;
  note: string;
}

export type DailyAttendanceEmployee = {
  id: string;
  name: string;
  salary_type: string;
  job_title?: string | null;
};

export const STATUS_COLORS: Record<string, string> = {
  present: "bg-green-100 text-green-800 border-green-300",
  absent: "bg-red-100 text-red-800 border-red-300",
  leave: "bg-yellow-100 text-yellow-800 border-yellow-300",
  sick: "bg-purple-100 text-purple-800 border-purple-300",
  late: "bg-orange-100 text-orange-800 border-orange-300",
};

export const DEFAULT_COLOR = "bg-primary/10 text-primary border-primary/30";

export const STATUS_LABELS_AR: Record<string, string> = {
  present: "حاضر",
  absent: "غائب",
  leave: "إجازة",
  sick: "مريض",
  late: "متأخر",
};

export const BUILT_IN_STATUSES: AttendanceStatus[] = ["present", "absent", "leave", "sick", "late"];

export const toShortEmployeeName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[1]}`;
};

export const mapAttendanceData = (
  employees: DailyAttendanceEmployee[],
  data: Array<{ employee_id: string; status?: string | null; check_in?: string | null; check_out?: string | null; note?: string | null }> | null | undefined
): Record<string, AttendanceRecord> => {
  const initial: Record<string, AttendanceRecord> = {};
  employees.forEach((emp) => {
    const existing = data?.find((r) => r.employee_id === emp.id);
    initial[emp.id] = {
      employeeId: emp.id,
      status: (existing?.status as AttendanceStatus) ?? null,
      checkIn: existing?.check_in ?? "",
      checkOut: existing?.check_out ?? "",
      note: existing?.note ?? "",
    };
  });
  return initial;
};


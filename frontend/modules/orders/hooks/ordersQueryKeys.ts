export const ordersQueryKeys = (uid: string) => ({
  spreadsheetBase: ['orders', uid, 'spreadsheet', 'base-data'] as const,
  spreadsheetMonthRaw: (year: number, month: number) =>
    ['orders', uid, 'spreadsheet', 'month-raw', year, month] as const,
  spreadsheetMonthLock: (year: number, month: number) =>
    ['orders', uid, 'spreadsheet', 'month-lock', year, month] as const,
  summaryBase: ['orders', uid, 'summary', 'base-data'] as const,
  summaryTargets: (year: number, month: number) => ['orders', uid, 'summary', 'targets', year, month] as const,
  summaryMonthLock: (year: number, month: number) =>
    ['orders', uid, 'summary', 'month-lock', year, month] as const,
  summaryMonthRaw: (year: number, month: number) =>
    ['orders', uid, 'summary', 'month-raw', year, month] as const,
});

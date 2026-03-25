/**
 * Table sort column indicators — avoids nested ternaries in JSX (Sonar maintainability).
 */
export function sortArrowGlyph(activeSortKey: string, columnKey: string, dir: 'asc' | 'desc'): string {
  if (activeSortKey !== columnKey) return '';
  return dir === 'asc' ? '↑' : '↓';
}

/** Same as sortArrowGlyph but shows `neutral` when the column is not the active sort key. */
export function sortArrowOrNeutral(
  activeSortKey: string,
  columnKey: string,
  dir: 'asc' | 'desc',
  neutral: string
): string {
  if (activeSortKey !== columnKey) return neutral;
  return dir === 'asc' ? '↑' : '↓';
}

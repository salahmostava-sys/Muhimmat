/** Maps "all / some / none" selection to Radix Checkbox `checked` prop. */
export function checkboxTriState(
  allSelected: boolean,
  someSelected: boolean,
): boolean | 'indeterminate' {
  if (allSelected) return true;
  if (someSelected) return 'indeterminate';
  return false;
}

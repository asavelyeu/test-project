import type { SortConfig } from './data-table.types';

/** Returns aria-sort value for a column header */
export function getAriaSortValue(
  columnKey: string,
  sortConfig: SortConfig | undefined
): 'ascending' | 'descending' | 'none' | undefined {
  if (!sortConfig || sortConfig.columnKey !== columnKey) return 'none';
  if (sortConfig.direction === 'asc') return 'ascending';
  if (sortConfig.direction === 'desc') return 'descending';
  return 'none';
}

/** Returns aria-label for a row's select checkbox */
export function getCheckboxAriaLabel(rowLabel: string, selected: boolean): string {
  return selected ? `Deselect ${rowLabel}` : `Select ${rowLabel}`;
}

/** Returns aria-label for the select-all checkbox */
export function getSelectAllAriaLabel(allSelected: boolean, someSelected: boolean): string {
  if (allSelected) return 'Deselect all rows';
  if (someSelected) return 'Select all rows (some selected)';
  return 'Select all rows';
}

/** Returns aria-label for the action menu trigger button */
export function getActionButtonAriaLabel(rowLabel: string): string {
  return `Open actions for ${rowLabel}`;
}

/** Returns aria-label for action menu */
export function getActionMenuAriaLabel(rowLabel: string): string {
  return `Actions for ${rowLabel}`;
}

/**
 * Keyboard handler map for the action menu.
 * Returns the action to take for a given key.
 */
export type ActionMenuKeyAction =
  | 'close'
  | 'focus-first'
  | 'focus-last'
  | 'focus-next'
  | 'focus-prev'
  | 'activate'
  | 'none';

export function getActionMenuKeyAction(key: string): ActionMenuKeyAction {
  switch (key) {
    case 'Escape':
      return 'close';
    case 'Home':
      return 'focus-first';
    case 'End':
      return 'focus-last';
    case 'ArrowDown':
      return 'focus-next';
    case 'ArrowUp':
      return 'focus-prev';
    case 'Enter':
    case ' ':
      return 'activate';
    default:
      return 'none';
  }
}

/**
 * Keyboard handler map for the table body.
 * Returns the action to take for a given key.
 */
export type TableKeyAction = 'select-toggle' | 'select-all' | 'none';

export function getTableKeyAction(key: string, ctrlOrMeta: boolean): TableKeyAction {
  if ((key === 'a' || key === 'A') && ctrlOrMeta) return 'select-all';
  if (key === ' ') return 'select-toggle';
  return 'none';
}

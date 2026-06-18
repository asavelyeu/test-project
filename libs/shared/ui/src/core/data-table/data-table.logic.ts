import type {
  DataTableColumn,
  DataTableRow,
  SelectionState,
  SortConfig,
  CurrencyConfig,
} from './data-table.types';

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatNumeric(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value.toLocaleString();
}

export function formatCurrency(
  value: number | null | undefined,
  config?: CurrencyConfig,
): string {
  if (value === null || value === undefined) return '';
  const locale = config?.locale ?? 'en-US';
  const currency = config?.currency ?? 'USD';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    value,
  );
}

export function formatBoolean(
  value: unknown,
  display: 'text' | 'icon' = 'text',
): { label: string; state: boolean } {
  const state = Boolean(value);
  if (display === 'text') {
    return { label: state ? 'Yes' : 'No', state };
  }
  return { label: state ? 'Yes' : 'No', state };
}

export function clampProgress(
  value: number | null | undefined,
  max = 100,
): { percent: number; label: string } {
  if (value === null || value === undefined) return { percent: 0, label: '0%' };
  const clamped = Math.min(max, Math.max(0, value));
  const percent = Math.round((clamped / max) * 100);
  return { percent, label: `${percent}%` };
}

export function computeSelectionState<T>(
  rows: DataTableRow<T>[],
  selectedIds: Set<string>,
): SelectionState {
  const allSelected =
    rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selectedIds.has(r.id));
  return { selectedIds, allSelected, someSelected };
}

export function toggleRowSelection(
  rowId: string,
  currentSelectedIds: Set<string>,
): Set<string> {
  const next = new Set(currentSelectedIds);
  if (next.has(rowId)) {
    next.delete(rowId);
  } else {
    next.add(rowId);
  }
  return next;
}

export function toggleAllSelection<T>(
  rows: DataTableRow<T>[],
  currentSelectedIds: Set<string>,
): Set<string> {
  const allSelected = rows.every((r) => currentSelectedIds.has(r.id));
  if (allSelected) {
    return new Set<string>();
  }
  return new Set(rows.map((r) => r.id));
}

export function sortRows<T>(
  rows: DataTableRow<T>[],
  config: SortConfig,
  getValue: (row: T) => unknown,
): DataTableRow<T>[] {
  if (config.direction === 'none') return rows;
  return [...rows].sort((a, b) => {
    const aVal = getValue(a.data);
    const bVal = getValue(b.data);
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    const cmp = aVal < bVal ? -1 : 1;
    return config.direction === 'asc' ? cmp : -cmp;
  });
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function nextSortDirection(
  current: 'asc' | 'desc' | 'none',
): 'asc' | 'desc' | 'none' {
  if (current === 'none') return 'asc';
  if (current === 'asc') return 'desc';
  return 'none';
}

/**
 * Resolves the display value for a cell.
 * If the column has a custom `getValue` getter, it is used.
 * Otherwise, the value is looked up from `row.data` by `column.key`,
 * enabling "static" column configuration without needing a getter per column.
 */
export function getCellValue<T>(
  column: DataTableColumn<T>,
  row: DataTableRow<T>,
): unknown {
  if (column.getValue) {
    return column.getValue(row.data);
  }
  return (row.data as Record<string, unknown>)[column.key];
}

/**
 * Converts a plain data array into DataTableRow objects with stable index-based IDs.
 * Enables the `data` prop shorthand — no manual wrapping required.
 * An optional `getRowId` callback can provide domain-specific IDs.
 */
export function normalizeRows<T>(
  data: T[],
  getRowId?: (item: T, index: number) => string,
): DataTableRow<T>[] {
  return data.map((item, index) => ({
    id: getRowId ? getRowId(item, index) : String(index),
    data: item,
  }));
}

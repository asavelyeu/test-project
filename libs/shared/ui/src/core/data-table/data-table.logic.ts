import type { DataTableRow, SelectionState, SortConfig } from './data-table.types';

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

export function computeSelectionState<T>(
  rows: DataTableRow<T>[],
  selectedIds: Set<string>
): SelectionState {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selectedIds.has(r.id));
  return { selectedIds, allSelected, someSelected };
}

export function toggleRowSelection(
  rowId: string,
  currentSelectedIds: Set<string>
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
  currentSelectedIds: Set<string>
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
  getValue: (row: T) => unknown
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

export function nextSortDirection(current: 'asc' | 'desc' | 'none'): 'asc' | 'desc' | 'none' {
  if (current === 'none') return 'asc';
  if (current === 'asc') return 'desc';
  return 'none';
}

import React from 'react';

import type { DataTableProps } from '@test-project/data-table';
import { renderCell } from '../../framework/cell-registry';

/**
 * Data Table — organism.
 *
 * Top-level shell that accepts DataTableProps<T> and renders Table Rows from
 * the `data` array using the `columns` configuration. Cell rendering is
 * dispatched to the cell-type registry — this organism does not switch on
 * `column.type` itself.
 *
 * Layer: lib/organisms — owns the coordination of header, body, row, and cell
 * structure; consumes the framework registry seam.
 *
 * NGI-12 scope:
 *   - Renders rows from data / columns.
 *   - Accepts isLoading / error / emptyStateMessage as props (no distinct UI yet —
 *     those organisms ship in US-05, US-06, and the future error ticket).
 *   - Native table semantics: <table>, <thead>, <tbody>, <tr>, <th>, <td>.
 *   - No React.memo, useMemo, or useEffect (no measurement = no memoization;
 *     no derived state stored in state = no effects needed).
 *
 * Canonical name comments label each structural section so later tickets can
 * extract them as named components without renaming.
 */

/**
 * Return a stable key string for a row.
 *
 * Strategy: prefer the value of the first column (converted to string) since
 * it is the most human-meaningful stable identifier. Fall back to the array
 * index with a DEV warning so the developer knows they should supply a stable
 * `id` field or ensure first-column values are unique.
 */
function getRowKey<TRow>(row: TRow, columns: DataTableProps<TRow>['columns'], index: number): string {
  const firstColumn = columns[0];
  if (firstColumn) {
    const firstValue = row[firstColumn.key as keyof TRow];
    if (firstValue != null && firstValue !== '') {
      return String(firstValue);
    }
  }

  if (process.env['NODE_ENV'] !== 'production') {
    console.warn(
      '[DataTable] Could not derive a stable row key from the first column value. ' +
        'Falling back to array index. Provide non-empty first-column values or add an `id` field ' +
        'to ensure stable keys during re-renders.',
    );
  }
  return String(index);
}

/**
 * DataTable — generic function component.
 *
 * Generic over TRow so that column `key` values are type-checked against the
 * actual row shape at the call site. TypeScript infers TRow from the `data` prop.
 */
export function DataTable<TRow>(props: DataTableProps<TRow>): React.ReactElement {
  const { columns, data } = props;
  // isLoading, error, and emptyStateMessage are accepted in props but no distinct
  // UI is rendered in NGI-12 — those state organisms ship in later tickets.

  return (
    <table>
      {/* Table Header */}
      <thead>
        <tr>
          {columns.map((column) => {
            const cellKey = column.id ?? column.key;
            const style: React.CSSProperties = column.align
              ? { textAlign: column.align === 'end' ? 'right' : column.align === 'start' ? 'left' : 'center' }
              : {};

            return (
              /* Table Header Cell */
              <th key={cellKey} scope="col" style={style}>
                {column.header}
              </th>
            );
          })}
        </tr>
      </thead>

      <tbody>
        {data.map((row, index) => {
          const rowKey = getRowKey(row, columns, index);

          return (
            /* Table Row */
            <tr key={rowKey}>
              {columns.map((column) => {
                const cellKey = column.id ?? column.key;
                const style: React.CSSProperties = column.align
                  ? { textAlign: column.align === 'end' ? 'right' : column.align === 'start' ? 'left' : 'center' }
                  : {};

                return (
                  /* Table Cell */
                  <td key={cellKey} style={style}>
                    {renderCell(column, row)}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

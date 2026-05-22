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
 *   - Renders rows from data / columns (Default State).
 *   - Accepts isLoading / error / emptyStateMessage as props (no distinct UI yet —
 *     those state organisms ship in later tickets: US-05, US-06).
 *   - Hover State: pure CSS `hover:bg-slate-50` on each Table Row (US-04).
 *   - Native table semantics: <table>, <thead>, <tbody>, <tr>, <th>, <td>.
 *
 * Hover State: `hover:bg-slate-50` on the <tr> — pure CSS Tailwind, no JS event
 * handlers (rendering-conditional-render + US-04 requirement). Background-color
 * only; cell content and layout are unaffected.
 *
 * Rules honored:
 *   - rendering-conditional-render: ternary / if-return; never `&&` with a number.
 *   - rerender-derived-state-no-effect: no state mirrored from props.
 *   - Zero hooks in this component (no useState, useEffect, useMemo, useCallback).
 *   - No React.memo — profiling must precede memoization (rerender-memo rule).
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

/** Map CellAlignment → Tailwind text-align utility class. */
function getAlignClass(align: 'start' | 'end' | 'center' | undefined): string {
  if (align === 'end') return 'text-right';
  if (align === 'center') return 'text-center';
  if (align === 'start') return 'text-left';
  return '';
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
  // UI is rendered in NGI-12 — those state organisms ship in later tickets (US-05, US-06).

  return (
    <table className="w-full border-collapse text-sm">
      {/* Table Header */}
      <thead>
        <tr>
          {columns.map((column) => {
            const cellKey = column.id ?? column.key;
            const alignClass = getAlignClass(column.align);

            return (
              /* Table Header Cell */
              <th
                key={cellKey}
                scope="col"
                className={`border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700 ${alignClass}`}
              >
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
            /* Table Row — hover:bg-slate-50 is the Hover State (US-04).
               Pure CSS: no JS state, no event handlers, background-color only. */
            <tr
              key={rowKey}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
            >
              {columns.map((column) => {
                const cellKey = column.id ?? column.key;
                const alignClass = getAlignClass(column.align);

                return (
                  /* Table Cell */
                  <td
                    key={cellKey}
                    className={`px-4 py-3 text-slate-900 ${alignClass}`}
                  >
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

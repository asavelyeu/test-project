import React from 'react';

import type { CellType, ColumnConfig } from '@test-project/data-table';
import { TextCell } from '../molecules/cells/text-cell/index';

/**
 * Cell-type registry — framework layer.
 *
 * Maps each CellType literal to the React renderer responsible for
 * displaying a cell of that type. One renderer per CellType — no
 * switch statements inside the Data Table organism itself.
 *
 * Layer: lib/framework — framework plumbing (renderer binding).
 *
 * Extension recipe (no restructure required):
 *   1. Extend CellType in libs/data-table.
 *   2. Add a new molecule under lib/molecules/cells/<type>-cell/.
 *   3. registry.set('<type>', ({ value, column, row }) => React.createElement(XxxCell, { value }));
 *
 * JSX is intentionally avoided here (this is a .ts file, not .tsx) so that
 * babel-jest can process it without a JSX transform on a plain TS file.
 * React.createElement is equivalent and preferable for non-template logic.
 */

/** Props passed to every cell renderer by the dispatcher. */
export interface CellRendererProps<TRow = unknown> {
  readonly value: unknown;
  readonly column: ColumnConfig<TRow>;
  readonly row: TRow;
}

/** The React renderer signature used by every entry in the registry. */
export type CellRenderer<TRow = unknown> = (
  props: CellRendererProps<TRow>,
) => React.ReactElement;

// Module-level Map — not a Context. The registry is populated at module load
// time and shared across all DataTable instances in the same React tree.
const registry = new Map<CellType, CellRenderer>();

registry.set('text', ({ value }) =>
  React.createElement(TextCell, { value }),
);

/**
 * Dispatch: look up the renderer for `column.type` and call it.
 *
 * Unknown cell type in development: throws so the developer sees the
 * problem immediately (no silent data loss). In production the raw
 * value is rendered as text so the table remains usable.
 */
export function renderCell<TRow>(
  column: ColumnConfig<TRow>,
  row: TRow,
): React.ReactElement {
  const renderer = registry.get(column.type) as CellRenderer<TRow> | undefined;
  const value = row[column.key as keyof TRow];

  if (!renderer) {
    if (process.env['NODE_ENV'] !== 'production') {
      throw new Error(
        `[DataTable] No renderer registered for cell type "${column.type}".`,
      );
    }
    // Production graceful fallback.
    return React.createElement(React.Fragment, null, value == null ? '' : String(value));
  }

  return renderer({ value, column, row });
}

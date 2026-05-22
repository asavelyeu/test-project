/**
 * Top-level prop contract for the Data Table component.
 *
 * Framework-free: each app binds this interface onto its native input
 * mechanism (Angular @Input / input(), React props) inside its own
 * lib/framework/ layer. Field names are identical across frameworks.
 */

import type { ColumnConfig } from './column-config';

/**
 * Props accepted by the Data Table shell organism.
 *
 * `isLoading`, `error`, and `emptyStateMessage` are included from
 * NGI-12 onward even though their state organisms ship in later
 * tickets. Including them now keeps every future state ticket purely
 * additive — no breaking API change.
 *
 * Generic over the row type T. T is inferred from the `data` array
 * at the call site; `columns` is checked against the same T.
 */
export interface DataTableProps<T> {
  /** Column definitions; drives header and cell rendering. */
  readonly columns: readonly ColumnConfig<T>[];
  /** Rows to render; one Table Row per element. */
  readonly data: readonly T[];
  /**
   * When true the table is in Loading State.
   * The Loading State organism (a later ticket) will render a
   * skeleton/spinner; NGI-12 only carries the prop.
   */
  readonly isLoading?: boolean;
  /**
   * Non-null when the table is in Error State.
   * Typed `unknown` to keep the library domain-free — consumers
   * inspect the value in their own error-handling layer.
   */
  readonly error?: unknown;
  /**
   * Copy shown in the Empty State organism (a later ticket).
   * NGI-12 carries the prop; the default message ("No data available")
   * will be established by the Empty State ticket.
   */
  readonly emptyStateMessage?: string;
}

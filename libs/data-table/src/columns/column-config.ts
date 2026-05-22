/**
 * Column configuration contracts for the Data Table.
 *
 * Pure TypeScript — no framework imports, no domain types.
 * @tanstack/table-core is the sole external dependency for this library;
 * this file has no direct dependency on it (shapes only).
 *
 * Extension pattern:
 *   1. Add a new literal to CellType.
 *   2. Add a new XxxColumnConfig<T> interface extending ColumnConfigBase<T>.
 *   3. Add the new type as a union member to ColumnConfig<T>.
 *   Nothing else in this file changes.
 */

/**
 * Canonical cell-type identifiers.
 *
 * Each value maps verbatim to a Cell name from CLAUDE.md §4.
 * Short forms such as "badge" or "buttons" are forbidden — use the
 * canonical name or add a new entry to CLAUDE.md §4 first.
 *
 * NGI-12 ships "text" only. Future cell types are additive union
 * extensions; no restructure is required.
 */
export type CellType =
  | 'text';
// future: | 'number' | 'date' | 'currency' | 'status' | 'progress'
//         | 'avatar' | 'link' | 'boolean' | 'icon-text'
//         | 'multiline' | 'tags';

/** Horizontal alignment for cell content. */
export type CellAlignment = 'start' | 'end' | 'center';

/**
 * Fields shared by every column configuration, regardless of cell type.
 *
 * Generic over the row type T so that `key` is type-checked against
 * the actual shape of the consumer's data.
 */
export interface ColumnConfigBase<T> {
  /**
   * Stable identifier used as React key / Angular trackBy.
   * Defaults to the value of `key` when omitted.
   */
  readonly id?: string;
  /** Property name on T whose value this column renders. */
  readonly key: keyof T & string;
  /** Label rendered in the Table Header Cell. */
  readonly header: string;
  /**
   * Cell content alignment.
   * Optional and forward-compatible — numeric/currency cells will
   * default to 'end' in their own configs; Text Cell is left as-is.
   */
  readonly align?: CellAlignment;
}

/**
 * Column configuration for a Text Cell.
 *
 * Renders the value at `key` as a plain text string.
 * Text-specific options (truncate vs wrap, maxLines, …) will be added
 * here when the relevant ticket lands — not on ColumnConfigBase<T>.
 */
export interface TextColumnConfig<T> extends ColumnConfigBase<T> {
  readonly type: 'text';
}

/**
 * Discriminated union of all column configurations.
 *
 * Callers narrow to a specific config via the `type` discriminant:
 *   if (column.type === 'text') { // column is TextColumnConfig<T> }
 *
 * Using a union (rather than a flat interface with `type: CellType`)
 * lets each cell type carry its own options without polluting every
 * column with fields it does not use.
 */
export type ColumnConfig<T> = TextColumnConfig<T>;
// future: | NumberColumnConfig<T> | DateColumnConfig<T> | ...

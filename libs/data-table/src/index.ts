// libs/data-table public API
// Named exports only — no barrel `export *`.
// Every symbol here is a contract shared by both framework apps.

export type { CellType, CellAlignment, ColumnConfigBase, TextColumnConfig, ColumnConfig } from './columns/column-config';
export type { DataTableProps } from './columns/data-table-props';

---
applyTo: 'libs/**/table/**'
---

# Copilot Instructions — `@test-project` Data Table Library

> **Scope**: These instructions govern every file Copilot generates inside
> `libs/table/**` and `libs/shared/ui/src/table/**`. Follow them exactly.
> When a section says "always" or "never", treat it as a hard rule, not a
> suggestion.
>
> Also follow `.github/instructions/wcag-aa.instructions.md` for shared
> WCAG 2.1 AA rules that apply to all UI components.

---

## 1. Project context & architecture decisions

### What this library is

A headless, accessible, framework-agnostic data-table library built on
**TanStack Table v8 core**. It ships a core package (types + CSS tokens)
and two thin framework adapters (React + Angular) that share all logic.
The core and Angular adapter are publishable NX libraries; the React
adapter lives inside the existing `@test-project/shared-ui` library.

### Key decisions (do not re-litigate these)

- **No Web Components / Shadow DOM.** Chosen approach is NX adapter pattern.
- **`@tanstack/table-core`** lives in `libs/table/core` — zero framework deps.
- **`@tanstack/react-table`** powers the React adapter in `libs/shared/ui/src/table/`.
- **`@tanstack/angular-table`** powers `libs/table/angular`.
- **No Tailwind inside the library.** CSS custom properties (`--dt-*`) are
  the theming contract. Consumers may use Tailwind to override them.
- **WCAG 2.1 AA** is a first-class requirement, not an afterthought.
- **Package manager is `pnpm`** — never use `npm` or `yarn`.

---

## 2. Repository & NX workspace rules

### Monorepo layout

```
<workspace-root>/
├── .github/
│   ├── instructions/
│   │   ├── wcag-aa.instructions.md       ← shared WCAG rules
│   │   └── table-library.instructions.md ← this file
│   └── prompts/
│       └── build-table.prompt.md
├── libs/
│   ├── shared/
│   │   └── ui/                           ← @test-project/shared-ui
│   │       └── src/table/                ← React adapter lives here
│   └── table/
│       ├── core/                         ← @test-project/table-core
│       └── angular/                      ← @test-project/table-angular
├── apps/
│   └── web-client/                       ← Vite + React demo app
└── nx.json
```

### NX project tags

Every `project.json` inside `libs/table/**` must carry:

```json
{ "tags": ["scope:table", "type:lib", "publishable:true"] }
```

### Publishable library setup

When generating a new library, always use:

```bash
# Core (framework-agnostic)
pnpm nx g @nx/js:library table-core \
  --publishable \
  --importPath=@test-project/table-core \
  --bundler=tsc \
  --unitTestRunner=vitest \
  --directory=libs/table/core \
  --no-interactive

# Angular adapter
pnpm nx g @nx/angular:library table-angular \
  --publishable \
  --importPath=@test-project/table-angular \
  --buildable \
  --unitTestRunner=jest \
  --directory=libs/table/angular \
  --no-interactive
```

The React adapter does NOT get its own library — it lives inside the
existing `libs/shared/ui/` and is exported from `@test-project/shared-ui`.

### Versioning

Use **semantic-release** or **nx release** (prefer `nx release`):

```jsonc
// nx.json — release config
{
  "release": {
    "projects": ["table-core", "table-angular"],
    "version": { "conventionalCommits": true },
    "changelog": { "workspaceChangelog": false, "projectChangelogs": true },
    "releaseTagPattern": "{projectName}@{version}",
  },
}
```

Every `package.json` in a publishable lib must have:

```json
{
  "version": "0.0.0",
  "license": "MIT",
  "peerDependencies": { ... },
  "publishConfig": { "access": "public" }
}
```

---

## 3. Required dependencies

### Install commands (run once at workspace root)

```bash
# TanStack Table
pnpm add @tanstack/table-core @tanstack/react-table @tanstack/angular-table

# React adapter peer deps (already in workspace)
# pnpm add react react-dom

# Angular adapter peer deps are resolved by nx angular setup

# Testing
pnpm add -D @testing-library/react @testing-library/jest-dom vitest
pnpm add -D @testing-library/angular jest

# A11y testing
pnpm add -D axe-core @axe-core/react
```

### `peerDependencies` per package

`libs/table/core/package.json`:

```json
{ "peerDependencies": { "@tanstack/table-core": ">=8.0.0" } }
```

`libs/shared/ui/package.json` (React adapter — add to existing shared-ui peerDeps):

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "@tanstack/react-table": ">=8.0.0",
    "@test-project/table-core": "*"
  }
}
```

`libs/table/angular/package.json`:

```json
{
  "peerDependencies": {
    "@angular/core": ">=17.0.0",
    "@tanstack/angular-table": ">=8.0.0",
    "@test-project/table-core": "*"
  }
}
```

---

## 4. Canonical folder structure

```
libs/
│
├── shared/ui/src/table/              React adapter (part of @test-project/shared-ui)
│   ├── index.ts                       barrel export for table components
│   ├── components/
│   │   ├── DataTable/
│   │   │   ├── DataTable.tsx            main component
│   │   │   ├── DataTable.test.tsx
│   │   │   ├── DataTable.stories.tsx
│   │   │   └── index.ts
│   │   ├── TableHeader/
│   │   │   ├── TableHeader.tsx
│   │   │   └── index.ts
│   │   ├── TableBody/
│   │   │   ├── TableBody.tsx
│   │   │   └── index.ts
│   │   ├── TablePagination/
│   │   │   ├── TablePagination.tsx
│   │   │   └── index.ts
│   │   └── TableToolbar/
│   │       ├── TableToolbar.tsx         search + column visibility toggle
│   │       └── index.ts
│   └── hooks/
│       └── useDataTable.ts          thin hook wrapping useReactTable
│
├── table/
│   ├── core/                            @test-project/table-core
│   │   ├── src/
│   │   │   ├── index.ts                 public API barrel
│   │   │   ├── types/
│   │   │   │   ├── column.types.ts      ColumnDef extensions, meta shape
│   │   │   │   ├── table.types.ts       DataTableConfig, PaginationConfig, etc.
│   │   │   │   └── index.ts
│   │   │   ├── defaults/
│   │   │   │   ├── column-defaults.ts   default column widths, alignments
│   │   │   │   └── pagination-defaults.ts
│   │   │   └── styles/
│   │   │       ├── table.css            CSS custom properties (--dt-*)
│   │   │       └── tokens.css           design token aliases
│   │   ├── README.md
│   │   └── project.json
│   │
│   └── angular/                         @test-project/table-angular
│       ├── src/
│       │   ├── index.ts
│       │   ├── components/
│       │   │   ├── data-table/
│       │   │   │   ├── data-table.component.ts
│       │   │   │   ├── data-table.component.html
│       │   │   │   ├── data-table.component.spec.ts
│       │   │   │   └── index.ts
│       │   │   ├── table-header/
│       │   │   ├── table-body/
│       │   │   ├── table-pagination/
│       │   │   └── table-toolbar/
│       │   └── table.module.ts          NgModule for non-standalone usage
│       ├── README.md
│       └── project.json
```

---

## 5. Type contracts (shared between both adapters)

These types live in `libs/table/core/src/types/` and are imported by both
adapters. Never duplicate them.

```typescript
// table.types.ts

import type { ColumnDef, RowSelectionState, SortingState, PaginationState } from '@tanstack/table-core';

/** Scope attribute values per WCAG / HTML spec */
export type ThScope = 'col' | 'row' | 'colgroup' | 'rowgroup';

/** Extend TanStack ColumnMeta with a11y + styling hooks */
declare module '@tanstack/table-core' {
  interface ColumnMeta<TData, TValue> {
    /** <th scope="…"> value. Default: 'col' for header cells */
    scope?: ThScope;
    /** Tailwind / CSS class string applied to every <td> in this column */
    className?: string;
    /** Tailwind / CSS class string applied to the <th> */
    headerClassName?: string;
    /** Accessible label for sort button (overrides column header text) */
    sortLabel?: string;
    /** Fixed pixel width */
    width?: number;
    /** Minimum pixel width for resizable columns */
    minWidth?: number;
    /** Align cell content: 'left' | 'center' | 'right' */
    align?: 'left' | 'center' | 'right';
  }
}

export interface PaginationConfig {
  /** Controlled: current page index (0-based) */
  pageIndex?: number;
  /** Rows per page. Default: 10 */
  pageSize?: number;
  /** Available page-size options rendered in the selector */
  pageSizeOptions?: number[];
  /** Total row count for server-side pagination */
  totalRows?: number;
  /** Callback fired when page or pageSize changes */
  onPaginationChange?: (state: PaginationState) => void;
}

export interface RowSelectionConfig {
  /** 'single' | 'multiple'. Default: 'multiple' */
  mode?: 'single' | 'multiple';
  /** Controlled selection state */
  value?: RowSelectionState;
  /** Callback fired on selection change */
  onChange?: (state: RowSelectionState) => void;
  /** Disable selection for a given row */
  isRowDisabled?: (row: unknown) => boolean;
}

export interface SortingConfig {
  /** Controlled sorting state */
  value?: SortingState;
  /** Callback fired on sort change */
  onChange?: (state: SortingState) => void;
  /** Allow sorting by multiple columns simultaneously */
  enableMultiSort?: boolean;
  /** Server-side: disable client-side sort logic */
  manualSorting?: boolean;
}

export interface DataTableConfig<TData> {
  /** The dataset to display */
  data: TData[];
  /** TanStack ColumnDef array (framework-specific cell renderers accepted) */
  columns: ColumnDef<TData, unknown>[];
  /** Unique key getter for row identity. Default: row index */
  getRowId?: (row: TData) => string;

  /** Pass undefined to disable pagination entirely */
  pagination?: PaginationConfig | false;
  /** Pass undefined to disable sorting */
  sorting?: SortingConfig | false;
  /** Pass undefined to disable row selection (hides checkbox column) */
  rowSelection?: RowSelectionConfig | false;

  /** Show the toolbar (search + column toggle). Default: false */
  toolbar?: boolean;
  /** Accessible <caption> for the table (required for WCAG) */
  caption: string;
  /** Hide <caption> visually but keep it in DOM. Default: false */
  captionHidden?: boolean;

  /** Loading state — renders skeleton rows */
  loading?: boolean;
  /** Number of skeleton rows to show when loading. Default: 5 */
  loadingRowCount?: number;
  /** Empty state message or render slot */
  emptyMessage?: string;

  /** Additional CSS class on the <table> element */
  className?: string;
  /** Additional CSS class on the outer wrapper <div> */
  wrapperClassName?: string;
  /** Override any --dt-* CSS custom property at the component level */
  style?: Record<string, string>;
}
```

---

## 6. Cell renderer / slot pattern

### React — JSX in `columnDef.cell`

```typescript
// Consumer usage — pass any JSX
const columns: ColumnDef<User>[] = [
  {
    id: 'actions',
    header: 'Actions',
    meta: { scope: 'col', align: 'right' },
    cell: ({ row }) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onEdit(row.original)}>Edit</button>
        <button onClick={() => onDelete(row.original)}>Delete</button>
      </div>
    ),
  },
];
```

The `DataTable` component renders cells via:

```typescript
// DataTable.tsx (internal)
{row.getVisibleCells().map((cell) => (
  <td
    key={cell.id}
    className={cell.column.columnDef.meta?.className}
    style={{ textAlign: cell.column.columnDef.meta?.align ?? 'left' }}
    data-label={String(cell.column.columnDef.header ?? '')}
  >
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </td>
))}
```

### Angular — `ng-template` via `FlexRenderDirective`

```typescript
// Consumer usage — pass an ng-template via TemplateRef in columnDef
// In the component TS:
@ViewChild('actionsTpl') actionsTpl!: TemplateRef<{ $implicit: User }>;

columns: ColumnDef<User>[] = [];

ngAfterViewInit() {
  this.columns = [
    {
      id: 'actions',
      header: 'Actions',
      meta: { scope: 'col', align: 'right' },
      cell: this.actionsTpl,   // pass the TemplateRef directly
    },
  ];
}
```

```html
<!-- Consumer template -->
<ng-template #actionsTpl let-row>
  <button (click)="onEdit(row)">Edit</button>
  <button (click)="onDelete(row)">Delete</button>
</ng-template>

<dt-data-table [columns]="columns" [data]="users" caption="User list" />
```

The Angular component renders via `*flexRender`:

```html
<!-- data-table.component.html (internal) -->
<ng-container *flexRender="cell.column.columnDef.cell; props: cell.getContext()"> </ng-container>
```

---

## 7. Complete React component scaffold

Generate `DataTable.tsx` exactly as follows. Do not deviate from the
prop interface, HTML semantics, or ARIA attributes.

```typescript
// libs/shared/ui/src/table/components/DataTable/DataTable.tsx
import React, { useId } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import type { DataTableConfig } from '@test-project/table-core';
import { TableHeader } from '../TableHeader';
import { TableBody } from '../TableBody';
import { TablePagination } from '../TablePagination';
import { TableToolbar } from '../TableToolbar';
import '@test-project/table-core/styles/table.css';

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  pagination,
  sorting,
  rowSelection,
  toolbar = false,
  caption,
  captionHidden = false,
  loading = false,
  loadingRowCount = 5,
  emptyMessage = 'No results.',
  className,
  wrapperClassName,
  style,
}: DataTableConfig<TData>) {
  const captionId = useId();
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting: sorting && 'value' in sorting ? sorting.value : internalSorting,
      rowSelection: rowSelection && 'value' in rowSelection ? rowSelection.value : internalRowSelection,
      globalFilter,
      pagination: pagination && 'pageIndex' in pagination
        ? { pageIndex: pagination.pageIndex ?? 0, pageSize: pagination.pageSize ?? 10 }
        : { pageIndex: 0, pageSize: 10 },
    },
    onSortingChange: sorting && sorting.onChange
      ? sorting.onChange
      : setInternalSorting,
    onRowSelectionChange: rowSelection && rowSelection.onChange
      ? rowSelection.onChange
      : setInternalRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    enableRowSelection: !!rowSelection,
    enableMultiRowSelection: rowSelection
      ? (rowSelection as RowSelectionConfig).mode !== 'single'
      : false,
    enableSorting: !!sorting,
    manualSorting: !!(sorting && (sorting as SortingConfig).manualSorting),
    manualPagination: !!(pagination && (pagination as PaginationConfig).totalRows !== undefined),
    rowCount: pagination && (pagination as PaginationConfig).totalRows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: pagination !== false ? getPaginationRowModel() : undefined,
    getFilteredRowModel: toolbar ? getFilteredRowModel() : undefined,
  });

  return (
    <div className={`dt-wrapper ${wrapperClassName ?? ''}`} style={style as React.CSSProperties}>
      {toolbar && (
        <TableToolbar
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          table={table}
        />
      )}

      <div className="dt-scroll-container" role="region" aria-labelledby={captionId} tabIndex={0}>
        <table
          className={`dt-table ${className ?? ''}`}
          aria-busy={loading}
          aria-rowcount={
            pagination && (pagination as PaginationConfig).totalRows
              ? (pagination as PaginationConfig).totalRows
              : data.length
          }
        >
          <caption
            id={captionId}
            className={captionHidden ? 'dt-sr-only' : 'dt-caption'}
          >
            {caption}
          </caption>

          <TableHeader table={table} />
          <TableBody
            table={table}
            loading={loading}
            loadingRowCount={loadingRowCount}
            emptyMessage={emptyMessage}
            colSpan={columns.length + (rowSelection ? 1 : 0)}
          />
        </table>
      </div>

      {pagination !== false && (
        <TablePagination
          table={table}
          pageSizeOptions={(pagination as PaginationConfig)?.pageSizeOptions ?? [10, 20, 50, 100]}
        />
      )}
    </div>
  );
}
```

---

## 8. TableHeader — sorting + WCAG `aria-sort` + `scope`

```typescript
// libs/shared/ui/src/table/components/TableHeader/TableHeader.tsx
import { flexRender, type Table } from '@tanstack/react-table';

export function TableHeader<T>({ table }: { table: Table<T> }) {
  return (
    <thead className="dt-thead">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="dt-tr">
          {/* Selection column header */}
          {table.getIsSomeRowsSelected !== undefined &&
            table.options.enableRowSelection && (
              <th scope="col" className="dt-th dt-th--select" style={{ width: 44 }}>
                <input
                  type="checkbox"
                  checked={table.getIsAllPageRowsSelected()}
                  ref={(el) => {
                    if (el) el.indeterminate = table.getIsSomePageRowsSelected();
                  }}
                  onChange={table.getToggleAllPageRowsSelectedHandler()}
                  aria-label="Select all rows on this page"
                  className="dt-checkbox"
                />
              </th>
            )}

          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const sorted = header.column.getIsSorted();
            const scope = header.column.columnDef.meta?.scope ?? 'col';

            return (
              <th
                key={header.id}
                scope={scope}
                colSpan={header.colSpan}
                className={`dt-th ${header.column.columnDef.meta?.headerClassName ?? ''}`}
                style={{
                  width: header.column.columnDef.meta?.width,
                  minWidth: header.column.columnDef.meta?.minWidth,
                  textAlign: header.column.columnDef.meta?.align ?? 'left',
                }}
                aria-sort={
                  sorted === 'asc'
                    ? 'ascending'
                    : sorted === 'desc'
                    ? 'descending'
                    : canSort
                    ? 'none'
                    : undefined
                }
              >
                {header.isPlaceholder ? null : canSort ? (
                  <button
                    type="button"
                    className="dt-sort-button"
                    onClick={header.column.getToggleSortingHandler()}
                    aria-label={`Sort by ${header.column.columnDef.meta?.sortLabel ?? String(header.column.columnDef.header ?? header.id)}${sorted === 'asc' ? ', currently ascending' : sorted === 'desc' ? ', currently descending' : ''}`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <span className="dt-sort-icon" aria-hidden="true">
                      {sorted === 'asc' ? ' ↑' : sorted === 'desc' ? ' ↓' : ' ↕'}
                    </span>
                  </button>
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
```

---

## 9. TablePagination — keyboard accessible + `aria-label`

```typescript
// libs/shared/ui/src/table/components/TablePagination/TablePagination.tsx
import type { Table } from '@tanstack/react-table';

interface Props<T> {
  table: Table<T>;
  pageSizeOptions: number[];
}

export function TablePagination<T>({ table, pageSizeOptions }: Props<T>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const from = pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, table.getRowCount());

  return (
    <nav
      className="dt-pagination"
      aria-label="Table pagination"
      role="navigation"
    >
      <span className="dt-pagination__summary" aria-live="polite" aria-atomic="true">
        {from}–{to} of {table.getRowCount()}
      </span>

      <label className="dt-pagination__size-label" htmlFor="dt-page-size">
        Rows per page
        <select
          id="dt-page-size"
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="dt-pagination__size-select"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </label>

      <div className="dt-pagination__controls" role="group" aria-label="Page controls">
        <button
          type="button"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to first page"
          className="dt-pagination__btn"
        >«</button>

        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Go to previous page"
          className="dt-pagination__btn"
        >‹</button>

        <span aria-current="page" className="dt-pagination__current">
          Page {pageIndex + 1} of {pageCount}
        </span>

        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Go to next page"
          className="dt-pagination__btn"
        >›</button>

        <button
          type="button"
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Go to last page"
          className="dt-pagination__btn"
        >»</button>
      </div>
    </nav>
  );
}
```

---

## 10. CSS custom properties — the theming contract

These live in `libs/table/core/src/styles/table.css`.
**Never hardcode colors or spacing inside component files.**

```css
/* libs/table/core/src/styles/table.css */
:where(.dt-wrapper) {
  /* ── Borders ─────────────────────────────────────── */
  --dt-border-color: #e5e7eb;
  --dt-border-width: 1px;
  --dt-border-radius: 8px;

  /* ── Header ──────────────────────────────────────── */
  --dt-header-bg: #f9fafb;
  --dt-header-color: #111827;
  --dt-header-font-weight: 600;
  --dt-header-padding: 12px 16px;

  /* ── Cells ───────────────────────────────────────── */
  --dt-cell-padding: 12px 16px;
  --dt-cell-color: #374151;
  --dt-font-size: 0.875rem;
  --dt-line-height: 1.5;

  /* ── Row states ──────────────────────────────────── */
  --dt-row-bg: #ffffff;
  --dt-row-bg-alt: #f9fafb;
  --dt-row-hover-bg: #eff6ff;
  --dt-row-selected-bg: #dbeafe;
  --dt-row-selected-border: #3b82f6;

  /* ── Sort button ─────────────────────────────────── */
  --dt-sort-icon-color: #9ca3af;
  --dt-sort-icon-active: #3b82f6;

  /* ── Pagination ──────────────────────────────────── */
  --dt-pagination-gap: 8px;
  --dt-pagination-btn-size: 32px;
  --dt-pagination-btn-radius: 6px;
  --dt-pagination-btn-color: #374151;
  --dt-pagination-btn-hover: #f3f4f6;
  --dt-pagination-btn-disabled-opacity: 0.4;

  /* ── Focus ring ───────────────────────────────────── */
  --dt-focus-ring: 0 0 0 3px #93c5fd;

  /* ── Skeleton loading ────────────────────────────── */
  --dt-skeleton-bg: #e5e7eb;
  --dt-skeleton-shimmer: #f3f4f6;
}

/* Visually hidden but screen-reader accessible */
.dt-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Structural styles (not themeable via vars) */
.dt-wrapper {
  position: relative;
}
.dt-scroll-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.dt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--dt-font-size);
}
.dt-thead .dt-th {
  background: var(--dt-header-bg);
  color: var(--dt-header-color);
  font-weight: var(--dt-header-font-weight);
  padding: var(--dt-header-padding);
  border-bottom: calc(var(--dt-border-width) * 2) solid var(--dt-border-color);
  white-space: nowrap;
}
.dt-tr:not(.dt-tr--head) {
  border-bottom: var(--dt-border-width) solid var(--dt-border-color);
}
.dt-tr:hover {
  background: var(--dt-row-hover-bg);
}
.dt-tr[aria-selected='true'] {
  background: var(--dt-row-selected-bg);
  box-shadow: inset 3px 0 0 var(--dt-row-selected-border);
}
.dt-td {
  padding: var(--dt-cell-padding);
  color: var(--dt-cell-color);
  vertical-align: middle;
}
.dt-sort-button {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
}
.dt-sort-button:focus-visible {
  outline: none;
  box-shadow: var(--dt-focus-ring);
  border-radius: 3px;
}
.dt-sort-button:hover .dt-sort-icon {
  color: var(--dt-sort-icon-active);
}
.dt-sort-icon {
  color: var(--dt-sort-icon-color);
  font-size: 0.75em;
}
[aria-sort='ascending'] .dt-sort-icon,
[aria-sort='descending'] .dt-sort-icon {
  color: var(--dt-sort-icon-active);
}
.dt-checkbox:focus-visible {
  outline: none;
  box-shadow: var(--dt-focus-ring);
  border-radius: 2px;
}
.dt-pagination {
  display: flex;
  align-items: center;
  gap: var(--dt-pagination-gap);
  padding: 12px 4px;
  flex-wrap: wrap;
  font-size: 0.875rem;
}
.dt-pagination__btn {
  width: var(--dt-pagination-btn-size);
  height: var(--dt-pagination-btn-size);
  border-radius: var(--dt-pagination-btn-radius);
  border: 1px solid var(--dt-border-color);
  background: none;
  cursor: pointer;
  color: var(--dt-pagination-btn-color);
}
.dt-pagination__btn:disabled {
  opacity: var(--dt-pagination-btn-disabled-opacity);
  cursor: not-allowed;
}
.dt-pagination__btn:hover:not(:disabled) {
  background: var(--dt-pagination-btn-hover);
}
.dt-pagination__btn:focus-visible {
  outline: none;
  box-shadow: var(--dt-focus-ring);
}
```

### How consumers override (Tailwind example)

```css
/* In consuming app's global CSS */
.dt-wrapper {
  --dt-header-bg: theme('colors.slate.900');
  --dt-header-color: theme('colors.white');
  --dt-row-hover-bg: theme('colors.blue.50');
}
```

---

## 11. Figma MCP — design token sync

When Copilot has access to the Figma MCP tool, follow this workflow
**before generating any CSS or component styles**:

1. Call the Figma MCP `get_file` or `get_node` tool with the mockup link
   provided by the user.
2. Extract the following from the Figma response:
   - Fill colors → map to `--dt-*` tokens
   - Typography (font size, weight, line-height) → map to `--dt-font-*` tokens
   - Spacing values → map to `--dt-cell-padding`, `--dt-header-padding`
   - Border colors and widths → map to `--dt-border-*`
   - Component states (hover, selected, disabled) → map to state tokens
3. Output the extracted values as an override block in the consuming
   app's CSS, **not** inside the library's `table.css`.
4. If a Figma node contains a custom cell design (e.g. a status badge,
   avatar+name cell), generate the corresponding React/Angular cell renderer
   as a separate file `components/cells/<CellName>Cell.tsx` and export it
   from the library's public API.

Example Figma → token mapping prompt:

```
Figma node "Table / Header Cell" has:
  fill: #1e293b, text color: #f8fafc, font: Inter 13px/500

Maps to:
  --dt-header-bg: #1e293b;
  --dt-header-color: #f8fafc;
  --dt-font-size: 0.8125rem;
  --dt-header-font-weight: 500;
```

---

## 12. WCAG 2.1 AA checklist (enforce in every generated component)

Copilot must ensure the following on every file it generates or edits:

### Semantic HTML

- [ ] `<table>` wraps all table content (never use `<div>` grids)
- [ ] `<caption>` is always present (use `.dt-sr-only` to hide visually if needed)
- [ ] `<thead>`, `<tbody>`, `<tfoot>` are always present
- [ ] Every `<th>` has `scope="col"`, `scope="row"`, `scope="colgroup"`, or
      `scope="rowgroup"` — never omit `scope`
- [ ] `<th id>` + `<td headers>` used for complex/multi-level header tables

### Sorting

- [ ] `aria-sort="ascending" | "descending" | "none"` on every sortable `<th>`
- [ ] Sort control is a `<button>` inside the `<th>` (keyboard operable)
- [ ] Sort direction is conveyed by an icon AND text (not color alone) — 1.4.1
- [ ] Sort icon is `aria-hidden="true"`

### Row selection

- [ ] Checkbox `aria-label` includes row context (not just "Select")
- [ ] "Select all" checkbox has `aria-label="Select all rows on this page"`
- [ ] Indeterminate state: `el.indeterminate = true` + `aria-checked="mixed"`
- [ ] Selected row: `aria-selected="true"` on `<tr>`

### Keyboard navigation

- [ ] All interactive elements (sort buttons, checkboxes, pagination) reachable
      via Tab
- [ ] Sort buttons: Enter / Space activate sort
- [ ] Pagination: all buttons keyboard operable, disabled via `disabled` attr
      (not `aria-disabled` alone)
- [ ] Focus ring visible with ≥3:1 contrast ratio — use `--dt-focus-ring`

### Colour and contrast

- [ ] Text contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text (1.4.3)
- [ ] UI component contrast ≥ 3:1 (sort icons, borders, checkboxes) (1.4.11)
- [ ] Selection/hover state uses outline OR box-shadow in addition to bg color

### Scrollable region

- [ ] Horizontal scroll container has `role="region"` + `aria-labelledby`
      pointing to the `<caption>` id
- [ ] Scroll container has `tabIndex={0}` so keyboard users can scroll

### Live regions

- [ ] Pagination summary uses `aria-live="polite"` + `aria-atomic="true"`
- [ ] Loading state: `<table aria-busy="true">` when `loading` is true
- [ ] Loading skeleton rows have `aria-hidden="true"`

---

## 13. Testing requirements

Every component file must have a co-located test file. Minimum test cases:

### React (`*.test.tsx` with Vitest + Testing Library)

```typescript
describe('DataTable', () => {
  it('renders caption for screen readers')
  it('applies aria-sort on sortable columns')
  it('toggles aria-sort on click')
  it('marks selected rows with aria-selected')
  it('indeterminate checkbox when some rows selected')
  it('disables pagination buttons at first/last page')
  it('fires onPaginationChange when page changes')
  it('fires onRowSelectionChange when row selected')
  it('renders cell slot content (custom JSX)')
  it('shows empty state when data is empty')
  it('shows skeleton rows when loading=true')
  it('passes axe accessibility audit', async () => {
    const { container } = render(<DataTable ... />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  })
})
```

### Angular (`*.component.spec.ts` with Jest + Testing Library Angular)

Same scenarios, using `render` from `@testing-library/angular`.

---

## 14. Public API exports

`libs/shared/ui/src/table/index.ts` must export exactly:

```typescript
export { DataTable } from './components/DataTable';
export { useDataTable } from './hooks/useDataTable';
export type { DataTableConfig, PaginationConfig, RowSelectionConfig, SortingConfig, ThScope } from '@test-project/table-core';
```

Also re-export from `libs/shared/ui/src/index.ts`:

```typescript
export * from './table';
```

`libs/table/angular/src/index.ts` must export exactly:

```typescript
export { DataTableComponent } from './components/data-table';
export { TableModule } from './table.module';
export type { DataTableConfig, PaginationConfig, RowSelectionConfig, SortingConfig, ThScope } from '@test-project/table-core';
```

`libs/table/core/src/index.ts` must export exactly:

```typescript
export type { DataTableConfig, PaginationConfig, RowSelectionConfig, SortingConfig, ThScope, ColumnMeta } from './types';
export { DEFAULT_PAGINATION, DEFAULT_PAGE_SIZE_OPTIONS } from './defaults/pagination-defaults';
export { DEFAULT_COLUMN_WIDTHS } from './defaults/column-defaults';
```

---

## 15. README template (generate for each library)

Each of the three libraries must have its own `README.md`. Use this template:

````markdown
# @test-project/table-[angular|core]

> Accessible, headless data table built on TanStack Table v8.
> Part of the `@test-project` design system.

## Installation

```bash
pnpm add @test-project/table-core
# For React (part of shared-ui):
pnpm add @test-project/shared-ui
# For Angular:
pnpm add @test-project/table-angular
# peer deps
pnpm add @tanstack/react-table @tanstack/table-core
```

## Quick start

```tsx
import { DataTable } from '@test-project/shared-ui';
import '@test-project/table-core/styles/table.css';

const columns = [
  { accessorKey: 'name', header: 'Name', meta: { scope: 'col' } },
  { accessorKey: 'email', header: 'Email', meta: { scope: 'col' } },
  {
    id: 'actions',
    header: 'Actions',
    meta: { scope: 'col', align: 'right' },
    cell: ({ row }) => <button onClick={() => edit(row.original)}>Edit</button>,
  },
];

<DataTable data={users} columns={columns} caption="User list" pagination={{ pageSize: 20, pageSizeOptions: [10, 20, 50] }} sorting={{}} rowSelection={{ mode: 'multiple' }} />;
```

## Props

| Prop               | Type                          | Default         | Description                     |
| ------------------ | ----------------------------- | --------------- | ------------------------------- |
| `data`             | `TData[]`                     | required        | Dataset to display              |
| `columns`          | `ColumnDef<TData>[]`          | required        | Column definitions              |
| `caption`          | `string`                      | required        | Accessible table caption (WCAG) |
| `captionHidden`    | `boolean`                     | `false`         | Hide caption visually           |
| `pagination`       | `PaginationConfig \| false`   | 10 rows/page    | Pass `false` to disable         |
| `sorting`          | `SortingConfig \| false`      | enabled         | Pass `false` to disable         |
| `rowSelection`     | `RowSelectionConfig \| false` | `false`         | Pass config to enable           |
| `toolbar`          | `boolean`                     | `false`         | Show search + column toggle     |
| `loading`          | `boolean`                     | `false`         | Show skeleton rows              |
| `loadingRowCount`  | `number`                      | `5`             | Skeleton row count              |
| `emptyMessage`     | `string`                      | `'No results.'` | Empty state message             |
| `className`        | `string`                      | —               | Extra class on `<table>`        |
| `wrapperClassName` | `string`                      | —               | Extra class on wrapper          |

## Theming

Override any `--dt-*` CSS custom property:

```css
.dt-wrapper {
  --dt-header-bg: #1e293b;
  --dt-header-color: white;
  --dt-row-hover-bg: #eff6ff;
  --dt-focus-ring: 0 0 0 3px #93c5fd;
}
```

## Column definition — `meta` options

```typescript
meta: {
  scope: 'col' | 'row' | 'colgroup' | 'rowgroup', // default: 'col'
  className: string,         // CSS class on every <td>
  headerClassName: string,   // CSS class on the <th>
  sortLabel: string,         // accessible sort button label
  width: number,             // fixed pixel width
  minWidth: number,          // minimum width (resizable columns)
  align: 'left' | 'center' | 'right',
}
```

## Server-side data

```tsx
<DataTable
  data={rows}
  columns={columns}
  caption="Orders"
  pagination={{
    pageIndex: currentPage,
    pageSize: pageSize,
    totalRows: totalCount, // ← enables server-side mode
    onPaginationChange: ({ pageIndex, pageSize }) => fetchPage(pageIndex, pageSize),
  }}
  sorting={{
    manualSorting: true,
    value: sortingState,
    onChange: setSortingState,
  }}
/>
```

## Accessibility

This component meets WCAG 2.1 AA. Key features:

- `<caption>` always present (visually hidden optional)
- `scope` attribute on every `<th>`
- `aria-sort` on sortable columns
- `aria-selected` on selected rows
- `aria-busy` during loading
- `aria-live` pagination summary
- Full keyboard navigation
- Visible focus rings (≥ 3:1 contrast)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md). Generated by `nx release`.
````

---

## 16. Commit message convention (enforced by nx release)

```
feat(shared-ui): add column visibility toggle in table toolbar
fix(table-core): correct aria-sort value for descending state
feat(table-angular)!: rename DataTableComponent selector to dt-data-table
docs(shared-ui): add server-side pagination example to table README
```

Scopes: `table-core` | `table-angular` | `shared-ui`
Breaking changes: append `!` after scope and add `BREAKING CHANGE:` footer.

---

## 17. What Copilot must never do

- Never generate `<div role="table">` or `<div role="row">` — always use real
  `<table>`, `<tr>`, `<th>`, `<td>` elements.
- Never omit `scope` from a `<th>`.
- Never omit `<caption>` from a `<table>`.
- Never use `aria-disabled` as the sole method of disabling a button — always
  set the native `disabled` attribute too.
- Never put Tailwind class names inside `libs/table/**` or
  `libs/shared/ui/src/table/**` component source.
- Never import `@tanstack/react-table` from inside `libs/table/core`.
- Never import `@tanstack/angular-table` from inside `libs/table/core`.
- Never hardcode colors or spacing values in component `.tsx` / `.ts` files —
  every visual value goes through a `--dt-*` CSS custom property.
- Never generate Shadow DOM / `attachShadow` code anywhere in this library.
- Never generate a `customElements.define` call anywhere in this library.
- Never skip the axe accessibility test in the test file.
- Never publish without a `CHANGELOG.md` entry.

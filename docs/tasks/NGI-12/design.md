# Design — NGI-12: Data Table — Columns and Data Props

**Brief:** `docs/tasks/NGI-12/brief.md`
**Active iteration:** Iteration 1 — MVP Table with Extended Cell Types (`docs/claude/iterations/iteration-1.md`)
**Designed by:** architect on 2026-05-17
**Informed by:** ui-designer notes for NGI-12 (Figma node not yet linked in brief).

---

## Decision (in two sentences)

NGI-12 lands the **framework-free contract** for the Data Table — `ColumnConfig<T>` and `DataTableProps<T>` exported from `libs/data-table` — and a minimal **Data Table shell organism** in each app that consumes them and renders rows from `data`. The `type` field on `ColumnConfig<T>` is a string-literal discriminator keyed to canonical Cell type names with only `"text"` in scope today, structured so future tickets add a cell type by extending the union and registering one renderer — no restructure required.

---

## Scope of this design

This task is a **scaffold**. It establishes the contract and the shell; it does **not** finalize the table's internal sub-components or its state organisms.

- **In NGI-12:** the public contract (`ColumnConfig<T>`, `DataTableProps<T>`), the Text Cell renderer, the cell-type registry seam, and a working Data Table shell that displays rows from `data` in each app.
- **Deferred to later tickets:** detailed design of Table Header / Table Header Cell / Table Row / Table Cell as named, addressable components; Loading State / Empty State / Error State organisms; Hover State of Table Row; density variants; sort, filter, selection, pagination affordances.

Implementing agents should produce *just enough* internal structure to render rows and exercise the contract — they may inline Table Header / Row / Cell as private parts of the shell rather than extracting them as standalone components. Naming them with canonical terms in markup/comments is still required, so later tickets can extract them without renaming.

---

## Component Decomposition (NGI-12 only)

Framework-agnostic. Canonical names per CLAUDE.md §4. Each entry names its target layer per `docs/claude/project-structure.md` §3.2.

### Data Table (`organism`) — landed in NGI-12

- **Layer:** `lib/organisms/data-table/`
- **Purpose:** Top-level shell that accepts `DataTableProps<T>` and renders the rows from `data` using the columns in `columns`. The shell is the only organism this ticket ships; everything inside (header, body, row, cell containers) may be inline until a later ticket extracts it.
- **Inputs:** `DataTableProps<T>` (see contract below).
- **Outputs:** none in NGI-12.
- **Behavior in scope:** renders one row per `data` item; each row contains one cell per column; each cell dispatches to the cell-type registry to render its value.
- **Behavior explicitly out of scope this ticket:** Loading State organism, Empty State organism, Error State organism, Hover State styling, sort/filter/selection/pagination, density variants. The shell must **accept** `isLoading`, `error`, and `emptyStateMessage` as props (so later tickets are additive) — it is not required to render distinct UI for them in NGI-12.

### Text Cell (`molecule`) — landed in NGI-12

- **Layer:** `lib/molecules/cells/text-cell/`
- **Purpose:** Concrete renderer for `column.type === "text"`. Renders the value as plain text. The only cell-type renderer this ticket ships.
- **Inputs:** the value extracted from the row (typed at the registry boundary; renderer narrows or coerces to string). Exact framework prop shape decided by the advisors.
- **Composes:** the Text primitive from `lib/primitives/`.

### Cell-type registry binding (`framework`) — landed in NGI-12

- **Layer:** `lib/framework/cell-registry.*`
- **Purpose:** Per-app mapping from `CellType` literal → renderer. Registers `"text"` → Text Cell renderer. The dispatcher inside the Data Table shell consults this registry.
- **Why per-framework:** each renderer's type signature is shaped by its framework's native primitive; a framework-free registry would force an awkward indirection in both apps. The shared part — the `CellType` literal — already lives in `libs/`.

### Future components (NOT designed here, mentioned for context)

These are referenced so the implementing agents know what they are scaffolding *toward*. They are deliberately not specified in this design — they belong to subsequent tickets.

- **Table Header, Table Header Cell** — extracted as standalone components in a later ticket (likely the sort ticket, since the Table Header Cell is where sort affordances live).
- **Table Row, Table Cell (dispatcher)** — may begin life inline inside the shell; extracted when row-level concerns (Hover, Selected, Clickable) need a named home.
- **Empty State, Loading State, Error State** organisms — each ships in its own ticket (US-05, US-06, plus a future error ticket).
- **Number Cell, Date Cell, Status Cell, …** — one per future US-10…US-20 ticket. Each is a self-contained addition: extend the `CellType` union, add a molecule under `lib/molecules/cells/`, register it.

---

## Shared vs. Per-App Split

**In `libs/data-table` (framework-free, exported from `libs/data-table/src/index.ts`):**

- `ColumnConfig<T>` — generic column definition with a discriminated `type`.
- `CellType` — string-literal union of canonical cell-type identifiers (only `"text"` lit for NGI-12).
- `DataTableProps<T>` — top-level prop contract for `columns`, `data`, `isLoading`, `error`, `emptyStateMessage`.

**In each app's `lib/` (framework-specific):**

- `lib/organisms/data-table/` — the Data Table shell organism.
- `lib/molecules/cells/text-cell/` — the Text Cell renderer.
- `lib/framework/cell-registry.*` — `"text"` → Text Cell renderer registration.

**Rationale.** The minimal framework-free surface is "what is a column" + "what props does the table take." Everything that renders is framework-specific. The library declares the **discriminator** (`type` string literals) and the **column shape**; the framework owns the **renderer table** that maps the literals to its native primitive.

---

## Contract (libs/data-table)

Framework-free TypeScript. Lives in `libs/data-table/src/` and re-exports through `index.ts` (developer may split across files).

```ts
// ---------- Cell type discriminator ----------

/**
 * Canonical cell-type identifiers. Each value MUST map verbatim to
 * a Cell name from CLAUDE.md §4. Do NOT invent short forms.
 *
 * NGI-12 ships "text" only. Adding a cell type later is a one-line
 * union extension plus one renderer registration in each app's
 * lib/framework/cell-registry. Nothing else in this contract changes.
 */
export type CellType =
  | 'text';
// future: | 'number' | 'date' | 'currency' | 'status' | 'progress'
//         | 'avatar' | 'link' | 'boolean' | 'icon-text'
//         | 'multiline' | 'tags';

// ---------- Column configuration ----------

export type CellAlignment = 'start' | 'end' | 'center';

/**
 * One column in a Data Table. Generic over the row type T so that
 * `key` is type-checked against the shape of the consumer's data.
 *
 * Modeled as a discriminated union (today: one member). The union
 * form keeps the door open for cell-type-specific column options
 * later (e.g., Status Cell's value->color map, Currency Cell's
 * currency code) without polluting every column with options it
 * does not use.
 */
export type ColumnConfig<T> = TextColumnConfig<T>;
// future: | NumberColumnConfig<T> | DateColumnConfig<T> | ...

export interface ColumnConfigBase<T> {
  /** Stable identifier; usable as React key / Angular trackBy. Defaults to `key` when omitted. */
  readonly id?: string;
  /** Property name on T to read the cell value from. */
  readonly key: keyof T & string;
  /** Header label rendered by the future Table Header Cell. */
  readonly header: string;
  /** Cell content alignment. */
  readonly align?: CellAlignment;
}

export interface TextColumnConfig<T> extends ColumnConfigBase<T> {
  readonly type: 'text';
  // Future Text-specific options (truncate vs wrap, max lines, …) go here.
}

// ---------- Top-level props ----------

/**
 * Framework-free prop contract for the Data Table shell. Each app
 * binds this onto its native inputs (Angular @Input, React props)
 * inside lib/framework — the field names are the same.
 *
 * isLoading, error, and emptyStateMessage are present from NGI-12
 * onward (even though the corresponding state organisms ship in
 * later tickets) so adding those organisms is purely additive — no
 * breaking API change. See brief.md Risks.
 */
export interface DataTableProps<T> {
  readonly columns: readonly ColumnConfig<T>[];
  readonly data: readonly T[];
  readonly isLoading?: boolean;
  readonly error?: unknown;
  readonly emptyStateMessage?: string;
}
```

**Notes on the contract.**

- `ColumnConfig<T>` is already a discriminated union with one member. The simpler "single interface with `type: CellType`" form is rejected — it cannot express cell-type-specific column options without polluting every column. See "Alternatives Considered."
- `error: unknown` — deliberately untyped. The future Error State organism will render a generic message; the consumer/demo can intercept and log specifics. Keeps `libs/data-table` domain-free.
- `readonly` everywhere — both frameworks benefit from input immutability; nothing in NGI-12 needs to mutate these structures.
- `align` is optional and forward-compatible — the Text Cell does not need it today, but every future numeric/currency cell will. Including it now prevents a column-shape churn.

---

## Cell Renderer Pattern (the extension seam)

Adding a new cell type after NGI-12 must be a three-step recipe with **no restructure**.

1. **`libs/data-table`** — extend `CellType`; add a new `XxxColumnConfig<T>` member to the `ColumnConfig<T>` union.
2. **`apps/<framework>/src/app/lib/molecules/cells/xxx-cell/`** — implement the new renderer molecule. Compose only atoms that exist in the Atomic Components inventory; flag missing atoms as findings rather than inventing locally.
3. **`apps/<framework>/src/app/lib/framework/cell-registry.*`** — register `"xxx"` → the new renderer.

The Data Table shell does not change. Existing cell renderers do not change. The dispatcher inside the shell looks up `column.type` in the registry and renders the value.

**Registry shape (described, not coded — framework decides).** A `(CellType key) → (renderer)` map where the renderer is the framework's native component primitive. The renderer receives at least `{ value: unknown, column: ColumnConfig<T>, row: T }`. The exact renderer type (Angular component class with inputs vs. React function component with props) is decided by each advisor. Both registries are keyed by the **same** `CellType` literal — that string is the cross-framework contract.

**Unknown `type` at runtime.** The dispatcher must surface the problem in development (throw or dev-only `console.error`) and degrade gracefully in production (render the raw value coerced to text, or a placeholder). Exact mechanism deferred to the framework advisors.

---

## Key Design Points (carried from ui-designer notes — durable here)

These survive across sessions; ui-designer produces no file of its own. NGI-12 ships a minimal shell, so the points below describe what the shell **must not preclude** rather than what it must render in detail. The state and header-cell visuals will be honored in their respective tickets.

### Atomic composition

- **Text Cell** composes only the **Text primitive** from `lib/primitives/`. No atom required. Matches the Atomic Components inventory.

### Cell types visible in Figma but **out of scope** for Iteration 1

- **Actions Cell** and **Selection Cell** appear in the Figma node for context. Do **not** implement — iteration boundary takes precedence over Figma node.

### Pressed state in Figma — not a canonical state

- Figma's Table Header Cell `Pressed` state is a future-sorting artifact. CLAUDE.md §4 does not list it as a canonical state. Do not implement.

### States Figma omits — not in scope for NGI-12 either

- Loading State, Empty State, Error State, Disabled State are not in Figma. They are not implemented in NGI-12 either — they ship in their own tickets. NGI-12 only ensures the **props that drive them** exist on `DataTableProps<T>` so adding them later is additive.

### Microcopy direction

- `column.header` — any string from consumer; not localized in the core.
- `emptyStateMessage` — present on the prop surface from NGI-12, even though the Empty State organism is a later ticket. Default copy ("No data available") will be chosen by that later ticket; NGI-12 only carries the prop.
- The core stays domain-free. Domain copy lives in the demo / consumer.

### Accessibility — what the shell must not preclude

NGI-12 ships the shell, not the polished header / row / cell components. Even so, the shell must lay a foundation that subsequent tickets can refine without rework:

- The shell should render row content using native table semantics (e.g., HTML `<table>` / `<tr>` / `<td>` where possible) or equivalent ARIA roles (`role="table"`, `role="row"`, `role="cell"`), so subsequent tickets that add `role="columnheader"` + `scope="col"` and `aria-sort` are additive.
- No interactive controls inside the shell this ticket (no sort, no selection, no actions) — so no focus order question to resolve yet.
- Contrast and focus-ring specifics are not exercised in NGI-12 (no interactive elements ship); those bind when Hover / Focus states arrive in later tickets.

### Figma vs. Confluence conflicts

1. **Figma includes Actions Cell and Selection Cell.** Out of scope for Iteration 1; do not implement.
2. **Header bottom border hardcoded 1 px, no design-token backing** (ui-designer flag). Header rendering is **not** in NGI-12 scope, so the finding is logged below but does not block this ticket.
3. **Pressed state on header.** Not canonical; do not implement.

---

## Boundary Validation

- [x] **No domain types in any shared contract.** `ColumnConfig<T>` is generic; `key` is `keyof T & string`. No `Student`, no domain enums.
- [x] **No framework imports in `libs/data-table`.** Pure TS; no JSX, no Angular, no signals, no React hooks. Sole external dependency remains `@tanstack/table-core` (unused in NGI-12, but the dependency line stays as-is).
- [x] **`lib/` does not depend on `pages/`.** The Data Table shell lives in `lib/organisms/`, consumes only `libs/data-table` contracts. Demo data lives in `pages/`.
- [x] **All concepts use canonical names** (CLAUDE.md §4). Data Table, Text Cell, `ColumnConfig`, `DataTableProps`. The `CellType` union value `"text"` resolves to **Text Cell** verbatim.
- [x] **No locally invented atom.** Text Cell uses the Text primitive (in inventory).

---

## Decisions Deferred

- **Angular shape:** deferred to `angular-advisor` — `@Input` vs. `input()` API; how `DataTableProps<T>` maps onto Angular component inputs; whether the cell-type registry is an `InjectionToken` or a static module map.
- **React shape:** deferred to `react-advisor` — function component shape; whether the cell-type registry is a module-level `Map` or a `Context`-injected one; rerender boundaries for the row list.
- **`@tanstack/table-core` integration:** NGI-12 can be implemented without invoking `table-core` (no sorting / filtering / pagination yet). Advisors decide whether to wire it now (establishes the bridge early, even if no behaviors run through it) or defer until the first behavior ticket. If wired now, the bridge lives in `lib/framework/`.
- **Internal extraction granularity inside the shell:** whether to extract Table Header / Table Row / Table Cell as named components in NGI-12 or keep them inline until a later ticket extracts them. Either is acceptable; canonical terms must still appear in markup/comments so the extraction is mechanical.
- **Unknown-`type` runtime behavior:** dev-only throw vs. silent fallback in the dispatcher. Advisors pick the framework-idiomatic mechanism; behavior must match across both apps.
- **Registry contract in `libs/`:** whether to introduce a framework-free `CellRendererRegistry` shape in `libs/data-table` now or wait until the second cell type lands. Recommend wait — one cell type does not justify the indirection.

---

## Trade-offs

- **Discriminated-union `ColumnConfig<T>` over a single interface with `type: CellType`.** More verbose today (one type alias per cell type) but the only form that lets future cell-type-specific options coexist without polluting every column.
- **Registry per-framework, not in `libs/`.** Each framework duplicates a small amount of keying boilerplate; in return, each renderer uses its native primitive directly with no generic-renderer indirection.
- **`error: unknown` instead of a typed error shape.** The future Error State cannot show a specific message in the core. Benefit: zero domain leakage, zero invented types.
- **`isLoading` / `error` / `emptyStateMessage` ship on the prop surface in NGI-12 even though their organisms do not.** NGI-12 ships slightly more surface than its strict ACs require; in return, US-05, US-06, and the future error ticket are additive — no breaking API change. Brief.md flagged this risk explicitly.

---

## Alternatives Considered

- **Flat `interface ColumnConfig<T> { type: CellType }`.** Rejected — works in NGI-12 isolation, breaks the moment a cell type needs its own options. Refactoring later forces a breaking change in every consumer.
- **Registry in `libs/data-table`.** Rejected — the renderer signature is framework-specific; a framework-free registry forces a generic `render(value, ctx) → unknown` signature that each app has to wrap. The wrapping is more invasive than the per-framework registry it replaces.
- **`type` enumeration as a TypeScript `enum` instead of a string-literal union.** Rejected — `enum`s do not narrow as cleanly in discriminated unions and add a runtime artifact for no benefit.
- **Compose Data Table on `@tanstack/react-table` / `@tanstack/angular-table`.** Rejected by the architecture (`docs/claude/project-structure.md` §2) — those adapters are deliberately not used. Each app writes its own bridge over `@tanstack/table-core`.
- **Defer `isLoading` / `error` to a later ticket.** Rejected — brief.md flagged this as a risk: omitting them now forces a breaking change in US-05 / US-06. Cheap to include; expensive to add later.

---

## Open Questions / Candidate Findings

1. **Candidate Finding — Header bottom border not backed by a design-system token.** Carried from ui-designer notes. Not blocking NGI-12 (header visuals ship in a later ticket) but logged here so the team can canonicalize a `border-divider` token before the header-cell ticket arrives. Reference the Finding Template (pageId `10485761`).

2. **Open — minimum column field set.** Brief.md notes that Design Requirements §7.2 lists `alignment` and `sortable` as part of the column shape; NGI-12 ACs only require `key` / `header` / `type`. This design includes `align` (forward-compatible, optional) and excludes `sortable` (sort is out of scope; adding it later is additive). Developer confirms during implementation.

3. **Open — internal extraction granularity.** Whether to introduce Table Header / Table Row / Table Cell as named components inside the shell now, or inline them until later tickets extract them. Either is acceptable; the design declines to mandate one. Advisors decide per framework.

4. **Open — Skeleton-pattern atom.** Out of scope for NGI-12 (Loading State organism is a later ticket), but worth surfacing now: the Atomic Components inventory does not list a Skeleton atom. The Loading State ticket will need one — recommend the team canonicalize Skeleton in the inventory before that ticket starts, or explicitly bless a compositional alternative.

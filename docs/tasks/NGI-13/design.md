# Design — NGI-13: [FE] Table Component: Static Column Configuration

**Brief:** `docs/tasks/NGI-13/brief.md`
**Active iteration:** Iteration 1 — MVP Table with Extended Cell Types (`docs/claude/iterations/iteration-1.md`)
**Designed by:** architect on 2026-05-24
**Informed by:** ui-designer notes (Figma nodes: 46-59 Table Header, 45-47 Table Header Cell variant matrix, 47-80 Table Header container)

## Decision (one or two sentences)

The shared static column configuration contract **already exists** in `libs/data-table` (`ColumnConfig<T>` with `key`, `header`, `align`, and a discriminated union on `type`) and all three apps already render the Table Header and Table Header Cell entirely from it — NGI-12 implemented the structure as a byproduct of shipping the Text Cell organism. NGI-13 is therefore a **verify-and-harden** ticket, not a green-field build: confirm the contract satisfies US-02's four acceptance criteria, decide the open design points the ui-designer raised (sort indicator, focus ring, empty-label fallback) **without expanding the contract beyond Iteration 1 scope**, and lock the canonical field naming so the three frameworks do not drift.

> **Critical context for all lanes:** Do **not** re-author `ColumnConfig<T>`. It is shipped, exported from `libs/data-table/src/index.ts`, and covered by `column-config.spec.ts`. NGI-13 changes to the contract are limited to documentation/comment updates and the optional `width` decision below — and even that is "Agent's choice (pending confirmation)". The Table Header rendering already exists in each `organisms/data-table/` component.

## Component Decomposition

Framework-agnostic. Canonical names. Layers per `docs/claude/project-structure.md` §3.2.

### Table Header (structural section inside the Data Table organism)

- **Layer:** organism — currently a `<thead><tr>` section **inside** each app's `data-table` organism, marked with a `{/* Table Header */}` canonical-name comment. It is **not** a standalone extracted component yet, and NGI-13 does **not** require extracting it.
- **Purpose:** the row-level container that renders one Table Header Cell per column, in declared configuration order.
- **Inputs:** `columns: readonly ColumnConfig<T>[]` (the same array the body iterates).
- **Outputs:** none in Iteration 1 (no sort events — Sorting is Out of scope).
- **Composes:** a Table Header Cell per `columns[]` entry.
- **States it handles:** Default. Header **stays visible** in Loading / Empty / No Results / Error / Disabled (per ui-ux-expectations.md — column structure preserved). Hover/Focus/Active states from Figma are **deferred** (see Key Design Points — they belong to the future Sorting ticket). N/A for header: Loading/Empty/Error visual treatment (those live on the body/state organisms).

### Table Header Cell (per-column header unit)

- **Layer:** organism-internal section today (`<th scope="col">`), marked `{/* Table Header Cell */}`. Not extracted; NGI-13 does not extract it.
- **Purpose:** render one column's `header` label, aligned per `align`.
- **Inputs:** one `ColumnConfig<T>` entry. Reads `header` (label) and `align` (text alignment). Reads `id ?? key` for the stable key/trackBy.
- **Outputs:** none in Iteration 1.
- **Composes:** plain text label. **No sort-indicator Icon atom in Iteration 1** (decision below).
- **States it handles:** Default only in Iteration 1. The Hover / Focus / Active states the Figma shows are sort-interaction affordances and are explicitly deferred to the Sorting iteration.

> No new atom, molecule, formatter, or organism is introduced by NGI-13. This is the correct outcome for a static-configuration ticket: configuration shape + existing rendering, no new visual primitives.

## Shared vs. Per-App Split

- **In `libs/data-table` (framework-free) — already present, verify only:**
  - `CellType` — canonical cell-type discriminator union (currently `'text'`).
  - `CellAlignment` — `'start' | 'end' | 'center'`.
  - `ColumnConfigBase<T>` — `{ id?, key, header, align? }`.
  - `TextColumnConfig<T>` and the `ColumnConfig<T>` discriminated union.
  - `DataTableProps<T>` — `{ columns, data, isLoading?, error?, emptyStateMessage? }`.
- **In each app's `lib/` — already present, verify only:**
  - `organisms/data-table/` renders the Table Header / Table Header Cell from `columns` (React `.tsx`, Angular component+template, Vue SFC).
  - `framework/cell-registry.*` dispatches each Table Cell to its renderer by `type`.
- **Rationale:** the split already matches the boundary rules in project-structure.md §5 — the core declares *what a column config looks like*; the apps own *how a header/cell is drawn*. NGI-13 confirms this rather than relocating anything.

## Contracts (libs/data-table)

The contract is shipped. The only **proposed** change is a documentation tightening plus one optional-field decision flagged below. Stated here for the library-developer lane to confirm and (optionally) extend:

```ts
// libs/data-table — current public surface (DO NOT restructure)
export type CellType = 'text';
// future cell types are additive union members (NGI-14+), not NGI-13 work.

export type CellAlignment = 'start' | 'end' | 'center';

export interface ColumnConfigBase<T> {
  readonly id?: string;            // stable key/trackBy; defaults to `key`
  readonly key: keyof T & string;  // property on T this column renders — opaque to the core
  readonly header: string;         // label rendered in the Table Header Cell
  readonly align?: CellAlignment;  // text alignment; cell-type configs may default it
}

export interface TextColumnConfig<T> extends ColumnConfigBase<T> {
  readonly type: 'text';
}

export type ColumnConfig<T> = TextColumnConfig<T>;
```

**Cell-type identifier decision (the ui-designer's Open Question 1):** **string-literal discriminated union, already chosen and shipped.** `CellType` is a union of canonical string literals; each cell type gets its own `XxxColumnConfig<T>` member of `ColumnConfig<T>`, narrowed by the `type` discriminant.

- **Why a string-literal union, not a TS `enum`:** a string union is the most portable, JSON-serialisable representation; it crosses the framework seam as plain data and survives in config files / fixtures without importing a runtime symbol. A TS `enum` would force every consumer (and the demo fixtures) to import a runtime value from the library, which couples callers to a non-type export — exactly what we avoid by keeping `libs/data-table` type-first.
- **Why a discriminated union, not a flat `{ type: CellType }` interface:** each cell type carries its own options (Number Cell will want number-format options; Status Cell will want a value→variant map). A flat interface would force every column to acknowledge every cell type's options. The union lets each member carry only what it needs and gives callers exhaustive narrowing.
- This decision is **the de-facto API contract for all 12 Iteration-1 cell types** (matches the ui-designer's and spec-analyst's candidate findings). It is already encoded and tested — NGI-13 should record it as a confirmed decision, not re-open it.

## Key Design Points (carried over from ui-designer notes — durable here)

These survive across sessions; `ui-designer` produces no file of its own.

- **Field-name reconciliation (binding for all lanes).** The ui-designer notes refer to the header label as `label` / `title` and to the gate field as `sortable`. The **canonical, already-shipped field name is `header`** (not `label`/`title`). Use `header` verbatim. `sortable` is **not** added in NGI-13 (decision below). This is a colloquial→canonical normalisation per CLAUDE.md §4; do not introduce `label`/`title` aliases.
- **States in Figma (Table Header Cell):** Default (near-white surface, label left-aligned), Hover (`surface/hover` light grey), Focus (brand violet 2px ring), Active/Sort-applied (`surface/active` medium grey, sort icon full weight). Alignment variants left/center/right in node 45:47.
- **States Figma omits (header stays visible):** Loading, Empty, No Results, Error, Disabled — header remains rendered; per ui-ux-expectations.md column structure is preserved across all states.
- **Visual tokens (inferred — must be confirmed in Dev Mode before pixel sign-off):** background `surface/default`; hover `surface/hover` (~neutral-50); active/sorted `surface/active` (~neutral-100); focus ring brand violet; label `text/primary`; sort icon `text/secondary`; cell height ~40–48px; horizontal padding ~12–16px; medium/semibold label typography (~`text/label-md`). Current implementation uses Tailwind `slate` placeholders (`text-slate-700`, `font-semibold`, `px-4 py-3`); per the "design is a prototype" memory these are acceptable approximations — do not hard-couple to them, and do not block NGI-13 on exact token mapping.
- **Interaction details:** Hover/Focus/Active header treatments in Figma are **Sorting affordances**. In Iteration 1 the header is non-interactive, so these are deferred (see decisions). Header label alignment follows `align`.
- **Atomic composition:** Iteration 1 Table Header Cell = text label only. The sort-indicator Icon atom is **not** composed in this ticket.
- **Accessibility:** native `<th scope="col">` is already used in all three apps (correct header/cell association). Label contrast `text/primary` on each surface variant must meet ≥4.5:1 — confirm against real tokens at sign-off. Because the header carries no interactive control in Iteration 1, no focus ring is required yet (decision below). Empty-value representation (`—`) is a Table Cell concern, not a header concern.
- **Microcopy direction:** header labels are caller-supplied via `header` and are domain copy — they live in the demo's column config, never in the core.
- **Figma vs. Confluence conflicts:** **one conflict found** — the Figma shows a sort indicator on Table Header Cells, but Sorting is Out of scope for Iteration 1 (`iteration-1.md`). See Finding A under Open Questions.

## Design Decisions (the four open questions)

### 1. Sort indicator in Iteration 1 — **suppress entirely.** (Agent's choice — pending confirmation)

- Sorting is on the Iteration 1 **Out of scope** list (`iteration-1.md`). CLAUDE.md §2 forbids implementing an out-of-scope item "even partially or 'as a stub.'" Rendering a non-interactive sort glyph is a partial stub of Sorting and is also a direct UX-spec violation: ui-ux-expectations.md §UX requirements — "No hidden functionality / interactive elements must be visually distinguishable from static content." A sort icon that does nothing tells the user a column is sortable when it is not.
- **Therefore:** do **not** add a `sortable` field to `ColumnConfig<T>`, and do **not** render a sort glyph. The `sortable` field and the indicator arrive together in the Sorting iteration as an additive union/field change — no rework, because the contract is open for additive extension.
- This is the resolution of ui-designer Open Question 2 and Candidate Finding A.

### 2. Focus ring on Table Header Cells — **suppress in Iteration 1.** (Agent's choice — pending confirmation)

- ui-ux-expectations.md §Focus: "Every interactive element has a visible focus state." The header cell is **not interactive** in Iteration 1 (no sort handler, not tabbable). A focus ring on a non-focusable, non-interactive element is misleading and adds a tab stop with no behaviour. The Figma focus state is, again, a Sorting affordance.
- **Therefore:** header cells are plain `<th>` with no `tabindex`, no focus styling, in Iteration 1. The focus ring lands with Sorting, when the header cell becomes a real interactive control. (Consistent with decision 1 — same future ticket.)

### 3. `align` field — **keep as optional, already shipped.** (Confirmed, not silent)

- `align?: CellAlignment` is already on `ColumnConfigBase<T>`, supported by all three renderers (`getAlignClass` / `alignClass`), tested, and present in node 45:47 and Design Requirements §7.2. No change needed. This resolves ui-designer Open Question 4 in the affirmative.

### 4. Empty `header` label fallback — **render an empty Table Header Cell; do not invent placeholder copy.** (Agent's choice — pending confirmation)

- `header` is **required** (`header: string`) in the contract, so the empty case is `header: ''`, not an omitted field. The component must not synthesise a label (e.g., echoing `key`) — that would leak the data key (often a domain field name like `"studentId"`) into the visible UI, which both fails the no-domain-leakage rule in spirit and produces unpredictable header text.
- **Therefore:** an empty/blank `header` renders an empty `<th>` (structure preserved, column still occupies its slot). If the team wants a stricter contract, the cleaner option is a dev-mode warning when `header === ''` — flagged as a candidate, not implemented in NGI-13. This resolves ui-designer Open Question 5.

### 5. Column `width` / sizing — **defer; do not add.** (Agent's choice — pending confirmation)

- The brief's open item ("minimum required fields vs optional fields") and the AC's "at minimum: key, header, cell type" invite scope creep. `width`, `truncate`, `wrap`, `minWidth` are **not** required by US-02 and are not in the Iteration 1 column-config scope. Adding them now is speculative design. Keep the contract at `{ id?, key, header, type, align? }`. Truncate/Wrap arrive with their cell-type tickets (US-09/US-19) on the relevant cell config, not on the base.

## What Each Implementing Lane Must Do

### library-developer (`libs/data-table`)
- **Verify, do not rebuild.** Confirm `ColumnConfig<T>` satisfies US-02 AC1–AC4: it carries `key` + `header` + `type` (AC1); order is array-driven so AC2/AC3/AC4 are rendering concerns the apps already meet.
- Update the **comments only** in `column-config.ts` to record: (a) the string-literal-union cell-type decision as confirmed, (b) the explicit Iteration-1 exclusion of any `sortable` field, (c) the empty-`header` policy (no fallback synthesis). No type changes.
- Do **not** add `sortable`, `width`, `truncate`, or `wrap`. Do **not** convert `CellType` to an enum.
- Keep/extend `column-config.spec.ts` so it asserts: required `key`+`header`+`type`; `align` optional; `key` constrained to `keyof T & string` (domain-agnosticism); no `sortable` member exists on the contract in Iteration 1.

### angular-developer / react-developer / vue-developer (all three, same shape)
- **Verify the existing `organisms/data-table/` Table Header rendering meets US-02:**
  - Table Header Cells render in `columns` array order (AC2) — already the case via `columns.map` / `@for` / `v-for`.
  - Each Table Header Cell shows its `header` (AC3) — already the case.
  - Adding/removing a column entry re-renders immediately (AC4) — verify reactively: React via prop identity, Angular via `input()` signal, Vue via reactive `props.columns`. Confirm no stale headers and correct trackBy/key (`id ?? key`).
- **Apply the two suppression decisions:** ensure **no** sort glyph and **no** focus ring/`tabindex` is present on `<th>` in Iteration 1. If any lane added one speculatively, remove it.
- **Empty `header`:** confirm a blank `header` renders an empty `<th>` (no key echo, no placeholder copy).
- **Add the `data-testid` hooks** from the E2E table below to the Table Header and each Table Header Cell — **identical values across all three apps** (this is the one cross-framework contract; do not let it diverge per lane).
- Keep using `<th scope="col">` (already correct). Do not introduce `label`/`title` field aliases — the field is `header`.
- Framework-reactivity specifics (signal vs. prop identity vs. reactive snapshot) are the advisors' calls — see Decisions Deferred.

## E2E Test Hooks (`data-testid`)

One contract for all client apps — `react-developer`, `angular-developer`, and `vue-developer` apply the **same** values; `qa-engineer` selects by them in the shared suite (`apps/data-table-e2e/`). The current spec uses only `getByRole('table')` / `getByRole('row')`; for NGI-13, role/text selection covers most assertions (header labels are selectable by text/`columnheader` role). Add `data-testid` only where role-based selection is ambiguous — specifically to assert column **order** and column **add/remove** deterministically. Values are kebab-case from the canonical term (CLAUDE.md §4).

| Canonical element | `data-testid` | Notes |
| --- | --- | --- |
| Data Table root | `data-table` | on the `<table>` element |
| Table Header | `table-header` | on the header `<tr>` (or `<thead>`); used to scope header-cell queries |
| Table Header Cell | `table-header-cell` | on each `<th>`; QA reads them in DOM order to assert AC2/AC3/AC4 |

Prefer `getByRole('columnheader')` + accessible name for label assertions (AC3). Use the `table-header-cell` testid list when asserting **declared order** (AC2) and **add/remove reflection** (AC4), where positional/count assertions need a stable handle. Omit any row not exercised by this ticket.

## Boundary Validation

- [x] No domain types in any shared contract — `ColumnConfig<T>` keys are `keyof T & string`; `T` is caller-supplied; `error` is `unknown`.
- [x] No framework imports in `libs/data-table` — confirmed; the contract files import only a sibling type.
- [x] `lib/` does not depend on `pages/` — header rendering lives in `lib/organisms/`, reads config only.
- [x] All concepts use canonical names — `Data Table`, `Table Header`, `Table Header Cell`, `Text Cell`; field is `header` not `label`/`title`.
- [x] No locally invented atom — NGI-13 introduces **no** atom (the sort-indicator Icon atom is deliberately not composed; if/when Sorting needs it, confirm it exists in Atomic Components pageId `13271041` first).
- [x] State coverage matches ui-ux-expectations.md — header stays visible across all states; Default is the only header state in Iteration 1; deferred header states map to the Sorting ticket, not omitted by oversight.

## Decisions Deferred

- **Angular shape:** deferred to `angular-advisor` — confirm `input()` signal reactivity re-renders the Table Header on `columns` add/remove (AC4) with OnPush; trackBy already `id ?? key`.
- **React shape:** deferred to `react-advisor` — confirm prop-identity-driven re-render of the header on `columns` change; `key` already `id ?? key`; no memoization without profiling.
- **Vue shape:** deferred to `vue-advisor` — confirm `props.columns` reactivity drives header re-render on add/remove without snapshotting outside a computed.
- **Token mapping:** deferred to `ui-designer` Dev-Mode pass — exact `surface/*`, `text/*`, spacing, and typography tokens. Not a blocker for NGI-13 functional sign-off (design-is-a-prototype).

## Trade-offs

- **Suppressing the sort indicator and focus ring** means the Iteration-1 header looks plainer than the Figma frame and the Sorting ticket will re-touch the same `<th>`. Accepted: scope discipline and the no-hidden-functionality UX rule outrank visual completeness of an out-of-scope affordance. The additive contract means zero rework cost when Sorting lands.
- **Empty `header` renders blank rather than falling back to `key`.** Accepted: a blank header is predictable and domain-safe; a key echo is unpredictable and leaks data field names into the UI.
- **Treating NGI-13 as verify-and-harden rather than build** risks the lanes producing "nothing to do" PRs. Mitigation: the per-lane briefs above name concrete verification + the testid additions + the two suppressions as deliverable work.

## Alternatives Considered

- **Render the sort icon as inert decoration (ui-designer Option A).** Rejected: violates CLAUDE.md §2 ("not even as a stub") and the no-hidden-functionality UX rule; signals sortability that does not exist.
- **Add a `sortable: boolean` field now, gate only the (suppressed) icon.** Rejected: it is Sorting-feature surface area landing an iteration early; the field has no consumer in Iteration 1 and would ship an unobserved part of a future contract.
- **Convert `CellType` to a TS `enum` for "stronger" typing.** Rejected: forces a runtime import on every config author and breaks plain-data/JSON portability across the seam; the string-literal union already gives exhaustive compile-time checking.
- **Extract standalone `TableHeader` / `TableHeaderCell` components now.** Rejected: premature. The sections are canonical-name-commented inside the organism and can be extracted without rename when a future ticket (e.g., Sorting, which adds header behaviour) actually needs the seam. Extracting now adds three per-framework components with no behaviour to justify them.
- **Add `width`/`truncate`/`wrap` to `ColumnConfigBase` proactively.** Rejected: speculative; out of US-02 scope; truncate/wrap belong on the cell-type configs in their own tickets.

## Open Questions / Candidate Findings

- **Finding A (carried from ui-designer; recommend filing).** *Figma shows a sort indicator on Table Header Cells, but Sorting is Out of scope for Iteration 1.* The design source depicts an out-of-scope affordance for the in-scope iteration. Resolution adopted here: suppress the indicator and the `sortable` field until the Sorting iteration. Recommend filing against the Finding Template (pageId `10485761`) and indexing under Findings & Lessons Learned (pageId `9928708`) so the design source and the iteration scope are reconciled. The team must decide whether the Figma frame should mark sort affordances as a later-iteration layer.
- **US-01 / US-02 coupling (carried from spec-analyst).** US-02's contract depends on US-01's `columns`+`data` prop contract. Both are already implemented in `libs/data-table` (`DataTableProps<T>`) and the three organisms — so the coupling is satisfied, but NGI-13 should not re-open `DataTableProps<T>`. Flag in the PR that NGI-13 validates the US-02 slice of an already-landed contract.
- **Cross-framework parity.** The contract is shared and identical across all three apps. The verification + `data-testid` work must be applied to **all three** lanes in lockstep, or the `data-testid` contract drifts. Recommend the three developer lanes run together for NGI-13.
- **Empty-`header` strictness (open).** Should an empty `header` emit a dev-mode warning? Flagged as a candidate; not implemented here. Team decision.

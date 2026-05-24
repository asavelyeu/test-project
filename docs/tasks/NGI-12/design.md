# Design — NGI-12: Data Table — Columns and Data Props

**Brief:** `docs/tasks/NGI-12/brief.md`
**Active iteration:** Iteration 1 — MVP Table with Extended Cell Types (`docs/claude/iterations/iteration-1.md`)
**Designed by:** architect on 2026-05-17; **revised for Vue parity** on 2026-05-24
**Informed by:** ui-designer notes for NGI-12 (Figma node 380-1485)

---

## Revision note (2026-05-24 — Vue parity cycle)

NGI-12 is **already implemented for React (`apps/web-client`) and Angular (`apps/angular-client`)**, and the framework-free contract in `libs/data-table` is already built. This cycle brings **Vue (`apps/vue-client`)** to parity by updating the Nx scaffold to render the same Data Table.

**This means the authoritative design source for the contract is the existing code, not this document's prose.** The original design (below, "Contract", "Cell Renderer Pattern", "Trade-offs", "Alternatives") still describes the shipped shape accurately and is retained. The new material — "Scope for Vue", "The Vue reactivity bridge", "Resolved Open Questions (parity)", and the updated file plan — is what the `vue-advisor` and `vue-developer` act on.

**Library change required: NO.** `libs/data-table` already exports everything Vue needs (`ColumnConfig<T>`, `DataTableProps<T>`, `CellType`, `CellAlignment`, `ColumnConfigBase`, `TextColumnConfig`). Vue **imports** them; it does not extend or redeclare them. No Library lane is needed for this cycle. If any Vue work appears to require a core change, that is a parity red flag — stop and route to `team-manager`.

---

## Decision (in two sentences)

Bring `apps/vue-client` to parity with the existing React and Angular Data Table by adding, under `apps/vue-client/src/app/`, the same atomic-design surface the other two apps already ship — a **Data Table organism**, a **Text Cell molecule**, a **Text primitive**, a per-app **cell-type registry** in `lib/framework/`, and a **demo page** — all consuming the unchanged `libs/data-table` contract via `defineProps<DataTableProps<T>>()`. The Vue component renders rows **directly from props** using native `<table>` semantics, exactly as React and Angular do today — **no `@tanstack/table-core` engine and no subscribe-based reactivity bridge are introduced**, because the shipped React/Angular implementations do not use one for NGI-12.

---

## Scope for Vue — file plan

Each Vue file maps to an existing React/Angular equivalent. The Vue stack is **Composition API + `<script setup lang="ts">`** (per `vue-best-practices`). Single-file components (`.vue`) hold template + script; pure-TS plumbing stays `.ts`.

| Layer | Vue file (create) | React equivalent | Angular equivalent |
| --- | --- | --- | --- |
| organism | `apps/vue-client/src/app/lib/organisms/data-table/DataTable.vue` | `lib/organisms/data-table/data-table.tsx` | `lib/organisms/data-table/data-table.component.{ts,html}` |
| organism barrel | `apps/vue-client/src/app/lib/organisms/data-table/index.ts` | `lib/organisms/data-table/index.ts` | (Angular imports the class directly) |
| molecule (cell) | `apps/vue-client/src/app/lib/molecules/cells/text-cell/TextCell.vue` | `lib/molecules/cells/text-cell/text-cell.tsx` | `lib/molecules/cells/text-cell/text-cell.component.ts` |
| molecule barrel | `apps/vue-client/src/app/lib/molecules/cells/text-cell/index.ts` | `lib/molecules/cells/text-cell/index.ts` | — |
| primitive | `apps/vue-client/src/app/lib/primitives/text/Text.vue` | `lib/primitives/text/text.tsx` | `lib/primitives/text/text.component.ts` |
| primitive barrel | `apps/vue-client/src/app/lib/primitives/text/index.ts` | `lib/primitives/text/index.ts` | — |
| framework (registry) | `apps/vue-client/src/app/lib/framework/cell-registry.ts` | `lib/framework/cell-registry.ts` | `lib/framework/cell-registry.ts` + `cell-registry.types.ts` |
| page (demo) | `apps/vue-client/src/app/pages/data-table-demo/DataTableDemo.vue` | `pages/data-table-demo/data-table-demo.tsx` | `pages/data-table-demo/data-table-demo.page.ts` |
| page (demo data) | `apps/vue-client/src/app/pages/data-table-demo/demo-data.ts` | `pages/data-table-demo/demo-data.ts` | `pages/data-table-demo/{students,users}.data.ts` |

**Files to update (not create):**

| File | Current state | Required change |
| --- | --- | --- |
| `apps/vue-client/src/app/App.vue` | renders `<NxWelcome />` | render the demo page instead (`<DataTableDemo />`) |
| `apps/vue-client/src/styles.css` | hand-written CSS reset, **no Tailwind** | wire Tailwind v4 in (see Prerequisite below) |

**Files to remove (optional, after wiring):** `apps/vue-client/src/app/NxWelcome.vue` and its spec once `App.vue` no longer references it.

> **Filename casing.** Vue SFCs use **PascalCase** (`DataTable.vue`) per `vue-best-practices`; React uses kebab-case `.tsx`, Angular uses kebab-case `.component.ts`. The *canonical root name* ("Data Table", "Text Cell", "Text") is identical across all three — only the file-casing convention differs, which is allowed (CLAUDE.md §4: "Casing and formatting are separate concerns"). The vue-advisor confirms the casing convention.

### Prerequisite — Tailwind in the Vue app (parity blocker)

The React app gets Tailwind v4 via `@import 'tailwindcss'` in `src/styles.css`; the Angular app via `@use 'tailwindcss'` + `@tailwindcss/postcss` in `.postcssrc.json`. The **Vue app currently has neither** — its `styles.css` is a plain reset. Every React/Angular Data Table style is a Tailwind utility class (`w-full`, `border-collapse`, `px-4 py-3`, `hover:bg-slate-50`, `text-slate-700`, …). To reach visual parity, Tailwind v4 must be wired into the Vue (Vite) build first. This is **build-config plumbing, not a contract change** — flag to `team-manager`/`vue-advisor` as a prerequisite. Without it, the markup parity holds but the visual parity does not. (See "Open Questions / Candidate Findings #5".)

---

## The Vue reactivity bridge

**There is no engine-subscription bridge in NGI-12 — for any framework.** This is the single most important parity correction to the ui-designer's open questions.

The existing React `data-table.tsx` and Angular `data-table.component.html` render **directly from the `columns` and `data` props** (`columns.map` / `@for`). Neither imports `@tanstack/table-core`; neither creates an engine instance; neither calls `engine.subscribe`. The `lib/framework/` directory in both apps holds **only the cell-type registry**, not a TanStack reactivity bridge. The Angular component file even states the wiring is "deferred" (`@tanstack/table-core wiring is deferred`).

Therefore Vue must do the same:

- **`DataTable.vue` declares its inputs with `defineProps<DataTableProps<TRow>>()`** and iterates them directly in the template with `v-for`. Vue's reactivity tracks `columns` and `data` automatically, so AC item 3 ("changing either prop re-renders") is satisfied with no extra machinery — **do not** snapshot props into a non-reactive local (`const rows = props.data` outside a computed breaks reactivity; bind `props.data`/a `computed` instead). This is the Vue-equivalent of the brief's "Vue reactivity model vs prop-change AC" risk.
- **No `useTableEngine` / `shallowRef` + `engine.subscribe` composable is introduced this ticket.** The ui-designer's note suggesting that pattern describes a *future* shape for when sort/filter/pagination run through `@tanstack/table-core` — it is out of scope for NGI-12 and would put Vue *ahead* of React/Angular, breaking parity. When the first behavior ticket (sorting) lands, all three apps introduce their bridge together; the Vue bridge will then live in `lib/framework/` as a composable. **Agent's choice (pending confirmation):** keep Vue free of a TanStack bridge in NGI-12 to match shipped React/Angular.
- **The `lib/framework/` layer in Vue carries the cell-type registry only**, mirroring the other two apps.

> If a future cycle wires `@tanstack/table-core` into all three apps, the Vue bridge is the natural place for the `shallowRef` + `subscribe` composable. That is explicitly **not** this ticket.

---

## Component Decomposition (Vue, parity with shipped React/Angular)

Framework-agnostic shape; Vue idioms deferred to `vue-advisor`. Canonical names per CLAUDE.md §4. Cell types in scope this ticket: **Text Cell only** — matching what React and Angular actually ship. (The Figma node 380-1485 shows Avatar/Status/Date/Number/Actions/Selection columns, but **none of those cell types are built in React or Angular for NGI-12**; building them in Vue would break parity and exceed scope.)

### Data Table (`organism`)

- **Layer:** `lib/organisms/data-table/DataTable.vue`
- **Purpose:** Top-level shell. Accepts `DataTableProps<TRow>`, renders one Table Row per `data` item; each Table Cell dispatches to the cell-type registry by `column.type`. The organism does **not** `switch` on `column.type` itself — it calls the registry, exactly as React's `renderCell` and Angular's `rendererFor` do.
- **Inputs:** `defineProps<DataTableProps<TRow>>()` — `columns`, `data`, plus the carried-but-not-rendered `isLoading`, `error`, `emptyStateMessage`.
- **Outputs:** none in NGI-12.
- **Composes:** Table Header / Table Header Cell / Table Row / Table Cell as **inline markup** within the SFC template (React and Angular both keep these inline for NGI-12 — do not extract them as standalone components). Label each with a canonical-name comment so a later ticket can extract without renaming.
- **States it handles:** Default State (renders rows). Hover State via CSS only (see below). Loading / Empty / Error / No Results / Disabled — **N/A this ticket** (props carried, organisms ship later — match React/Angular).

### Text Cell (`molecule`)

- **Layer:** `lib/molecules/cells/text-cell/TextCell.vue`
- **Purpose:** Renderer for `column.type === 'text'`. Coerces the incoming value to a string and renders it through the Text primitive. The only cell-type renderer in NGI-12.
- **Inputs:** at minimum `value: unknown`; accept `column` and `row` too (React's `CellRendererProps` and Angular's `TextCellComponent` both pass all three so future multi-field cells have context). Vue prop shape decided by `vue-advisor`.
- **Composes:** the Text primitive.
- **States it handles:** N/A (pure value render).

### Text (`primitive`)

- **Layer:** `lib/primitives/text/Text.vue`
- **Purpose:** Indivisible inline-text building block. Renders a string (or projected content) in a `<span>`; owns no layout opinion. React's `Text` forwards `className`; Angular's `app-text` takes a `text` input and projects `<ng-content>`. Vue mirrors this: a `text` prop and/or a default `<slot/>`.
- **States it handles:** N/A.

### Cell-type registry (`framework`)

- **Layer:** `lib/framework/cell-registry.ts`
- **Purpose:** Per-app map from `CellType` literal → Vue cell renderer. Registers `'text'` → Text Cell. The organism's dispatcher consults it. Mirrors React's module-level `Map` and Angular's injected `ReadonlyMap`. Vue's idiom (module-level `Map`, or a `provide`/`inject` registry) is for `vue-advisor` to decide — module-level `Map` is the closest parity to React and the simplest. **Agent's choice (pending confirmation):** module-level `Map`, matching React.
- **Dispatcher behavior:** look up `column.type`; in dev, throw on an unregistered type (both React and Angular throw in dev); in production, fall back to rendering the raw value as text. Match this behavior.

---

## Shared vs. Per-App Split (unchanged — for reference)

**In `libs/data-table` (already built, framework-free — Vue imports, does not modify):**

- `ColumnConfig<T>`, `ColumnConfigBase<T>`, `TextColumnConfig<T>`, `CellType`, `CellAlignment` — from `libs/data-table/src/columns/column-config.ts`.
- `DataTableProps<T>` — from `libs/data-table/src/columns/data-table-props.ts`.
- All re-exported by `libs/data-table/src/index.ts` and consumed as `import type { … } from '@test-project/data-table'`.

**In `apps/vue-client/src/app/lib/` (new, framework-specific):** Data Table organism, Text Cell molecule, Text primitive, cell-registry.

**In `apps/vue-client/src/app/pages/` (new, may hold domain data):** demo page + demo datasets (Students + Users).

---

## Contract (libs/data-table — already shipped, Vue consumes verbatim)

This is the existing exported surface. **Vue must `import type` these, never redeclare them** (the brief's #1 risk). Reproduced here as the consumption reference; the source of truth is `libs/data-table/src/`.

```ts
// from libs/data-table/src/columns/column-config.ts
export type CellType = 'text';
//  future additive: | 'number' | 'date' | 'currency' | 'status' | 'avatar' | …

export type CellAlignment = 'start' | 'end' | 'center';

export interface ColumnConfigBase<T> {
  readonly id?: string;            // stable key; defaults to `key`
  readonly key: keyof T & string;  // property on T to read
  readonly header: string;         // Table Header Cell label
  readonly align?: CellAlignment;  // optional, forward-compatible
}

export interface TextColumnConfig<T> extends ColumnConfigBase<T> {
  readonly type: 'text';
}

export type ColumnConfig<T> = TextColumnConfig<T>;
//  future additive: | NumberColumnConfig<T> | DateColumnConfig<T> | …

// from libs/data-table/src/columns/data-table-props.ts
export interface DataTableProps<T> {
  readonly columns: readonly ColumnConfig<T>[];
  readonly data: readonly T[];
  readonly isLoading?: boolean;        // carried; organism ships later (US-06)
  readonly error?: unknown;            // carried; organism ships later
  readonly emptyStateMessage?: string; // carried; organism ships later (US-05)
}
```

**Vue-specific note on `defineProps` + generics.** `DataTableProps<T>` is generic. In `<script setup>`, the organism is a generic component (`<script setup lang="ts" generic="TRow">`) so `columns` is type-checked against the row shape — this is the Vue parallel to React's generic function component and Angular's `class DataTableComponent<TRow>`. The exact `defineProps` syntax (type-only `defineProps<DataTableProps<TRow>>()` vs. wrapping) is for the `vue-advisor`; the constraint is that the imported `DataTableProps<TRow>` is the *only* source of the prop types — no inline re-typing of `columns`/`data`.

---

## State behavior in scope (parity with React/Angular)

| State | NGI-12 behavior in Vue | Matched from |
| --- | --- | --- |
| **Default State** | Render rows from `data`; native `<table>/<thead>/<tbody>/<tr>/<th>/<td>`. | React `data-table.tsx`, Angular template |
| **Hover State** (US-04) | **Pure CSS** on the Table Row — Tailwind `hover:bg-slate-50`, background-color only, no JS handlers, cell layout unaffected. | React (has `hover:bg-slate-50`). **Note:** the Angular template currently *omits* the hover class — see parity gap below. Vue should match **React** here (the spec-correct behavior). |
| **Loading State** (US-06) | **N/A in NGI-12.** `isLoading` prop carried, no distinct UI. Organism ships in a later ticket. | both apps carry the prop only |
| **Empty State** (US-05) | **N/A in NGI-12.** `emptyStateMessage` carried, no distinct UI. Organism ships in a later ticket. | both apps carry the prop only |
| Error / No Results / Disabled | **N/A in NGI-12.** | both apps |

> **Parity gap noted (not introduced by Vue):** React's Table Row has `hover:bg-slate-50`; the Angular template (`data-table.component.html`) does **not** apply a hover class. The ui-ux-expectations.md Hover State is required (US-04), and the React behavior is the spec-correct one. **Vue should implement the hover class (match React).** The Angular omission is a pre-existing discrepancy — logged as Candidate Finding #6 for the team; it is not the vue-developer's to fix in this ticket, but the Vue implementation should not copy the omission.

---

## E2E Test Hooks (`data-testid`)

**The shipped React and Angular apps use NO `data-testid` attributes.** The shared smoke spec (`apps/data-table-e2e/src/data-table.spec.ts`) selects entirely by role: `page.getByRole('table')` and `firstTable.getByRole('row')`. The `vue` Playwright project (port 4401, already wired in `playwright.config.ts`) runs that same spec.

**Parity requirement for Vue:** render the Data Table as a **native semantic `<table>`** (so `getByRole('table')` resolves) with native `<tr>` for the header row and each body row (so `getByRole('row')` counts header + body and yields `> 1`). With native table elements, the smoke spec goes green for `vue` with **zero e2e changes** — which is the stated goal in CLAUDE.md §8 and the brief.

| Canonical element | `data-testid` | Status |
| --- | --- | --- |
| Data Table root | — (use `role="table"` via native `<table>`) | no testid in any app; match |
| Table Row | — (use `role="row"` via native `<tr>`) | no testid in any app; match |

**Do not add `data-testid` attributes to the Vue app for NGI-12.** Adding them only to Vue would diverge from React/Angular and violate the "identical across all client apps" rule (CLAUDE.md §8). If a future spec needs a `data-testid` (e.g., `data-table`, `table-row`, `data-table-empty`, `data-table-no-results`, `status-cell`, `actions-cell-action` per CLAUDE.md §8), it must be added to **all three** apps with the same value at that time — out of scope here.

---

## Resolved Open Questions (parity — each resolved by matching shipped code, not by fresh design)

The ui-designer raised six open questions, to be resolved by checking what React/Angular already did. Resolutions:

1. **Sort icon in header cells — what did React/Angular do?**
   **Resolved: nothing — there are no sort icons.** Sorting is out of scope for Iteration 1; the header cells in both apps render only `column.header` text in a `<th scope="col">`. Vue renders header text only, no sort affordance. *(Matched: React `data-table.tsx` `<th>`, Angular template `<th>`.)*

2. **Hover token name — match existing apps.**
   **Resolved: Tailwind `hover:bg-slate-50`** on the Table Row (`<tr>`), background-color only. Vue uses the same class. *(Matched: React `data-table.tsx`. Angular omits it — see parity gap; Vue follows React.)*

3. **Loading pattern — skeleton vs spinner?**
   **Resolved: neither, in NGI-12.** No Loading State UI ships in either app; `isLoading` is carried as a prop only. The skeleton-vs-spinner decision belongs to the Loading State ticket (US-06), across all apps. Vue carries the prop, renders no loading UI. *(Matched: both apps carry `isLoading` with no UI.)*

4. **Empty State treatment — match existing.**
   **Resolved: none in NGI-12.** No Empty State UI ships in either app; `emptyStateMessage` is carried only. The Empty State organism ships in US-05 across all apps. Vue carries the prop, renders no empty UI. *(Matched: both apps carry `emptyStateMessage` with no UI.)*

5. **Do `isLoading`/`error` belong in `DataTableProps`?**
   **Resolved: YES — already in the shipped contract.** `DataTableProps<T>` in `libs/data-table/src/columns/data-table-props.ts` declares `isLoading?`, `error?`, and `emptyStateMessage?`. Vue gets them for free by importing `DataTableProps<T>`. No change. *(Matched: `libs/data-table` source.)*

6. **Does `ColumnConfig<T>` carry `align`/`sortable`?**
   **Resolved: `align` YES (optional), `sortable` NO.** `ColumnConfigBase<T>` has `align?: CellAlignment`; it has **no** `sortable` field (sorting is out of scope; adding it later is additive). Vue's header/cell markup should honor `align` the way React/Angular do (Tailwind `text-right` / `text-center` based on `column.align`). *(Matched: `libs/data-table` source + both app templates apply align classes.)*

---

## Boundary Validation

- [x] **No domain types in any shared contract.** Vue consumes generic `ColumnConfig<T>` / `DataTableProps<T>`; demo domain types (StudentRow, UserRow) live under `pages/` only.
- [x] **No framework imports in `libs/data-table`.** No change to the library this cycle.
- [x] **`lib/` does not depend on `pages/`.** Vue's `lib/organisms`, `lib/molecules`, `lib/primitives`, `lib/framework` import only from `@test-project/data-table` and each other; demo data is imported by the page, never by `lib/`.
- [x] **All concepts use canonical names** (CLAUDE.md §4): Data Table, Text Cell, Text, `ColumnConfig`, `DataTableProps`, `CellType` value `'text'` → Text Cell. PascalCase SFC filenames are a casing convention, not a rename.
- [x] **No locally invented atom.** Text Cell composes the Text primitive (in inventory); no new atom introduced.
- [x] **State coverage matches `docs/claude/ui-ux-expectations.md` for the touched components** — Default + Hover are in scope and implemented; Loading/Empty/Error/No Results/Disabled are explicitly N/A for NGI-12 across all three apps (props carried for later additive tickets).

---

## Decisions Deferred (to `vue-advisor`)

- **`defineProps` + generic SFC shape:** `<script setup lang="ts" generic="TRow">` with `defineProps<DataTableProps<TRow>>()` vs. an alternative typing; the constraint is that the imported type is the sole prop-type source.
- **Reactivity of `columns`/`data` in the template:** confirm direct binding / `computed` derivations preserve reactivity (no non-reactive snapshot) so AC item 3 holds.
- **Cell-registry idiom:** module-level `Map` (parity with React, recommended) vs. `provide`/`inject`. Both register `'text'` → Text Cell and must throw in dev on unknown type, fall back to text in prod.
- **Dynamic cell dispatch in template:** Vue's `<component :is="…">` keyed by the registry lookup (the parallel to React `renderCell` and Angular `NgComponentOutlet`).
- **Text primitive shape:** `text` prop vs. default `<slot/>` (Angular does both; React uses children + `className`). vue-advisor picks the idiomatic Vue form.
- **Tailwind wiring into the Vue Vite build** (prerequisite — see below). This is build-config, not contract; `vue-advisor`/`team-manager` confirm the approach (PostCSS plugin vs. Vite plugin for Tailwind v4).

---

## Trade-offs

- **No `@tanstack/table-core` bridge in Vue.** Gives up an "early bridge" that the ui-designer's note hinted at; in return Vue stays at exact parity with shipped React/Angular and does not get ahead of them. The bridge arrives for all three apps at the first behavior ticket.
- **Inline Table Header / Row / Cell inside the SFC** rather than extracted components. Gives up named, independently testable sub-components now; in return matches the shipped React/Angular structure (both inline them) and avoids a Vue-only decomposition that would drift from the other apps.
- **Match React's hover behavior over Angular's (which omits it).** Picks the spec-correct branch of an existing discrepancy rather than copying the most recent app verbatim; the cost is that Vue and Angular momentarily differ until Angular's omission is fixed (logged as a finding).
- **Tailwind utility classes for styling** (parity) rather than scoped SFC `<style>`. Gives up Vue's idiomatic scoped styles; in return the visual output matches React/Angular class-for-class, which is the whole point of a parity cycle. Requires the Tailwind prerequisite.

---

## Alternatives Considered

- **Introduce a `useTableEngine` composable over `@tanstack/table-core` now** (as the ui-designer note suggested). **Rejected** — neither React nor Angular uses a `table-core` engine for NGI-12; doing so in Vue alone breaks parity, adds unused machinery, and pre-empts a cross-framework decision that belongs to the first behavior (sorting) ticket.
- **Build the full Figma column set (Avatar/Status/Date/Number cells).** **Rejected** — those cell types are not built in React or Angular for NGI-12 (the core ships `CellType = 'text'` only). Building them in Vue would exceed scope and break parity; they ship per future US-09–US-20 tickets across all apps together.
- **Redeclare `ColumnConfig`/`DataTableProps` locally in the Vue app to "decouple."** **Rejected** — this is the brief's #1 risk; it causes API drift and breaks the shared e2e contract. Vue imports the types from `@test-project/data-table`.
- **Add `data-testid`s to the Vue app for robust e2e selection.** **Rejected for this ticket** — React/Angular use none; the smoke spec is role-based. Adding testids only to Vue violates "identical across all apps." If needed later, add to all three at once.
- **Scoped SFC `<style>` instead of Tailwind.** **Rejected** — would not match the React/Angular visual output and defeats parity; Tailwind is wired into both existing apps.

---

## Open Questions / Candidate Findings

1. **Prerequisite (blocking visual parity) — Tailwind not wired into `apps/vue-client`.** React (`@import 'tailwindcss'`) and Angular (`@use 'tailwindcss'` + `@tailwindcss/postcss`) both have Tailwind v4; the Vue app's `styles.css` is a plain reset with no Tailwind. Markup parity is achievable without it, but visual parity is not. `team-manager`/`vue-advisor` must wire Tailwind v4 into the Vue Vite build before (or as part of) implementation. Build-config plumbing, not a contract change.

2. **Candidate Finding — Hover State missing from the Angular Data Table.** The Angular template (`apps/angular-client/src/app/lib/organisms/data-table/data-table.component.html`) does not apply a Hover State class to the Table Row, while React does (`hover:bg-slate-50`) and US-04 requires it. Pre-existing cross-app discrepancy. Vue should match React (implement hover). Recommend filing a finding so the Angular app is brought back to spec. Reference Finding Template (pageId `10485761`).

3. **Open — remove `NxWelcome.vue`?** Once `App.vue` renders the demo page, the scaffold `NxWelcome.vue` and its reference become dead. Recommend removing it and updating `App.spec.ts` (which currently asserts `'Welcome vue-client 👋'`) so the Vue test suite reflects the Data Table, not the scaffold. Confirm with `team-manager`.

4. **Carried Candidate Finding — Column type identifier contract not specified in ticket/US-01/US-08.** (From the original design + brief.) Not blocking; the canonical-name contract is enforced by `CellType` in `libs/data-table`. Logged for the team.

5. **Carried Candidate Finding — Header bottom border / divider not backed by a design-system token.** (From ui-designer notes via the original design.) The header `border-b border-slate-200` is a raw Tailwind color, not a semantic token. ui-ux-expectations.md §"Color & contrast" asks for semantic tokens. Not blocking NGI-12 parity (Vue should match the existing apps' raw classes to stay at parity), but logged so a `border-divider`-style token can be canonicalized before a design refresh. Matches the ui-designer's "prototype, not final" framing.

6. **Open — generic SFC + `defineProps` typing confirmation.** The generic-component `defineProps<DataTableProps<TRow>>()` pattern is the load-bearing Vue typing decision for AC item 3 and the "no redeclaration" rule. Final syntax confirmed by `vue-advisor`; the design's constraint is non-negotiable (import the type; keep `columns`/`data` reactive).

---

## (Retained) Cell Renderer Pattern — the extension seam

Unchanged from the original design and already honored by React/Angular. Adding a cell type after NGI-12 is a three-step recipe with no restructure, applied **per framework in lockstep**:

1. **`libs/data-table`** — extend `CellType`; add a new `XxxColumnConfig<T>` member to the `ColumnConfig<T>` union.
2. **`apps/<framework>/src/app/lib/molecules/cells/xxx-cell/`** — implement the renderer (Vue SFC / React `.tsx` / Angular component). Compose only inventory atoms; flag missing atoms as findings.
3. **`apps/<framework>/src/app/lib/framework/cell-registry.*`** — register `'xxx'` → the new renderer.

The Data Table shell does not change; existing renderers do not change. The dispatcher looks up `column.type` in the registry and renders the value. Vue's registry follows this same recipe so future cell-type tickets treat all three apps uniformly.

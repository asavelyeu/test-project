# Task Brief — NGI-12: [FE] Table Component: Columns and Data Props

**Jira:** [NGI-12](https://aristeksystems-team-f2twyvsi.atlassian.net/browse/NGI-12)
**Figma:** [Aristek UI Pro Core Kit — node 380-1485](https://www.figma.com/design/0gLQ8QbaZq1I0yhiKspQg0/Aristek-UI-Pro-%E2%80%94-Core-Kit?node-id=380-1485) (visual source; ui-designer to validate)
**Active iteration:** Iteration 1 — MVP Table with Extended Cell Types
**Curated by:** spec-analyst on 2026-05-24 (Vue parity cycle; original brief 2026-05-17)

---

## Translated Task

Ticket wording → canonical terminology:

| Ticket wording | Canonical term | Rule |
| --- | --- | --- |
| "table component" | **Data Table** | CLAUDE.md §4 — prefer qualified form |
| "columns and data props" | `columns` and `data` props on the **Data Table** | matches US-01 API shape |
| "structured data" | rows rendered from a generic column/data configuration | US-01/US-03 framing |
| "domain-specific logic" | domain-specific logic, field names, or imports | US-08 / CLAUDE.md §1 non-goals |

Canonical task statement: Implement the base **Data Table** component that accepts `columns` and `data` props and renders Table Rows from those inputs without any domain-specific logic inside the component internals.

---

## Acceptance Criteria (verbatim)

Quoted from Jira NGI-12 description:

1. The component accepts a `columns` prop defining column keys, labels, and cell types.
2. The component accepts a `data` prop as an array of row objects.
3. Changing either prop re-renders the table with updated content.
4. No hard-coded domain-specific field names exist inside the component.
5. The component renders correctly for at least two different dataset shapes without code changes.
6. All domain-specific decisions (labels, keys, cell types) are expressed solely through the `columns` prop.
7. Selection and row actions are not implemented.

---

## Matched User Stories

The ticket explicitly labels **US-01** and **US-08**. Acceptance criteria from Confluence (pageId `11960322`) are quoted below for each.

### US-01 — Configure Table via Columns and Data Props

> The component accepts a `columns` prop defining column keys, labels, and cell types. The component accepts a `data` prop as an array of row objects. Changing either prop re-renders the table with updated content. No hard-coded domain-specific field names exist inside the component. The component renders correctly for at least two different dataset shapes without code changes.

Applies because NGI-12 is the direct front-end implementation task for this story — it defines the core `columns`/`data` prop contract that every subsequent cell-type story (US-09–US-20) depends on.

### US-08 — Domain-Agnostic Reusable Structure

> No domain-specific logic, field names, or imports exist inside the component. The component can render a students dataset and a users dataset without internal changes. All domain-specific decisions (labels, keys, cell types) are expressed solely through the `columns` prop. Selection and row actions are not implemented in this iteration.

Applies because the ticket explicitly bars domain logic from the component internals and requires correctness across two different dataset shapes — which is the structural reusability guarantee US-08 defines.

---

## Design Requirements Touched

- **§7.1 Core data rendering** — "The component must not be tied to one specific business entity. It should be possible to use the same component for Students, Users, Courses, Orders, Tasks, or other datasets by changing configuration and data." (Design Requirements pageId `8159250`)
- **§7.2 Column configuration** — "Columns must be configurable from the outside. Each column should define at least a key, title, type, alignment, and whether it supports sorting or other behaviors." (Design Requirements pageId `8159250`)
- **§11 Frontend alignment** — "The frontend implementation should receive data and column configuration from the outside. Domain-specific logic must stay outside the core Data Table component." (Design Requirements pageId `8159250`)
- **§12 Demo requirements** — "The demo must not introduce student-specific logic into the core Data Table component." (Design Requirements pageId `8159250`)

---

## Terminology Resolutions

| Ticket phrasing | Canonical term | Source |
| --- | --- | --- |
| "table component" | **Data Table** | CLAUDE.md §4 |
| "columns" prop | `columns` prop on **Data Table** | US-01, Design Requirements §7.2 |
| "data" prop | `data` prop on **Data Table** | US-01, Design Requirements §11 |
| "cell types" (in columns definition) | each must map to a canonical Cell type (Text Cell, Number Cell, etc.) | CLAUDE.md §4 canonical excerpt |
| "domain-specific logic" | domain-specific logic, field names, or imports inside the component | CLAUDE.md §1 non-goals; US-08 |
| "selection and row actions are not implemented" | Selection Cell and Actions Cell are out of scope this iteration | iteration-1.md Out of scope |

---

## Scope Verdict

**Verdict:** in scope

- Matches Scope: "Display tabular data based on `columns` and `data` configuration" — `docs/claude/iterations/iteration-1.md` Scope list.
- Matches Scope: "Reusable structure that is not tied to a single domain" — `docs/claude/iterations/iteration-1.md` Scope list.
- Does not touch Out of scope: Row selection, Bulk selection, Row actions, Action column, Inline editing, Sorting, Filtering, Search, Pagination, Server-side data loading — none are introduced. The ticket explicitly states "Selection and row actions are not implemented."

---

## Risks & Open Questions

- **Risk — column `type` identifier contract.** The ticket specifies that `columns` defines cell types, but does not name the allowed type identifier strings. If the developer invents short forms (e.g., `"badge"`, `"buttons"`, `"custom"`) rather than the canonical names, every downstream cell-type story (US-09–US-20) will need corrections. The canonical identifiers must be agreed before implementation starts (CLAUDE.md §4 — "Don't invent short forms").
- **Risk — domain leakage via column defaults.** If example or test column configurations hardcode Students-specific keys (e.g., `key: "studentId"`) inside the component source rather than in a demo file, that violates US-08 and the non-goals in CLAUDE.md §1. The architect and developer must ensure all demo-specific configuration lives outside the core component.
- **Risk — partial state coverage.** NGI-12 is scoped to `columns`/`data` rendering. It does not explicitly mention the Loading State (`isLoading` prop) or the Empty State. US-06 and US-05 are separate stories, but the base component's prop surface must leave room for those props without requiring a breaking API change. If the initial `DataTableProps` type omits `isLoading` and `error`, a later story will force a prop-surface change.
- **Risk — cross-framework parity gap (Vue).** This cycle brings `apps/vue-client` to parity with the React (`apps/web-client`) and Angular (`apps/angular-client`) implementations. The `columns`/`data` prop contract and the canonical `type` identifier strings must be shared from the framework-agnostic core (`libs/data-table`). If the Vue bridge at `apps/vue-client/src/lib/framework/` (or equivalent) re-derives the prop interface independently, API drift will break the shared e2e smoke spec (CLAUDE.md §8). The vue-developer must import the same `ColumnConfig<T>` / `DataTableProps` types from the core lib, not redefine them.
- **Risk — Vue reactivity model vs prop-change AC.** AC item 3 requires: "Changing either prop re-renders the table with updated content." Vue's reactivity model differs from React and Angular. The vue-developer must ensure `columns` and `data` are declared as `defineProps` and that downstream template expressions are reactive to their changes — not cached with a non-reactive local copy.
- **Open — `columns` type definition location.** The ticket does not specify whether the `ColumnConfig<T>` type lives in `libs/data-table` core, a shared types package, or is co-located with the component. This must be decided before implementation so cell-type stories reference the same type.
- **Open — minimum column field set.** The ticket says "column keys, labels, and cell types." Design Requirements §7.2 says "at least a key, title, type, alignment, and whether it supports sorting." The alignment and sortable fields are broader than what the ticket requires for Iteration 1 (sorting is out of scope). Developer should confirm whether to include them as optional fields now (forward-compatible) or defer them.

---

## Drift Detected

- **None between Jira NGI-12 and Confluence US-01/US-08.** The Jira acceptance criteria are a verbatim or near-verbatim restatement of the Confluence US-01 criteria, with the addition of "Selection and row actions are not implemented" — which is consistent with US-08's Confluence text. No substantive conflict detected. Re-verified on 2026-05-24 (Vue parity cycle) — no change.
- **Local mirror `docs/claude/iterations/iteration-1.md` vs Confluence pageId `8749069` (Iterations).** Both list identical Scope and Out-of-scope items for Iteration 1. No drift detected. Re-verified on 2026-05-24.
- **Local mirror `docs/claude/iterations/iteration-1.md` vs Confluence pageId `11960322` (User Stories).** US-01 and US-08 acceptance criteria in the mirror match Confluence verbatim. No drift detected. Re-verified on 2026-05-24.

---

## Candidate Findings

- **Candidate Finding — Column type identifier contract not specified in ticket or US-01/US-08.** US-01 says `columns` defines "cell types" but neither the Jira ticket nor the Confluence user story specifies the allowed `type` string values or where they are documented. Downstream cell-type stories (US-09–US-20) each assume a `type` field in the column definition, but no artifact defines the exhaustive enumeration or naming convention. This is a missing-requirement gap that could cause implementation divergence. Recommend the BA or architect add an acceptance criterion to US-01 or create a separate column-type registry artifact. Reference Finding Template (pageId `10485761`).

---

## Recommendations for Downstream Agents

- **`architect`:** Define the `ColumnConfig<T>` interface in the framework-agnostic core (`libs/data-table`) before any framework-specific implementation starts. Include `key`, `header` (label), `type`, and optionally `align` as extensible fields. Ensure `isLoading` and `error` are present in `DataTableProps` now so US-05 and US-06 do not require a breaking change. Confirm the `type` enumeration uses canonical Cell type names as its values.
- **`vue-developer`:** This is the primary implementation target for this cycle. Import `ColumnConfig<T>` and `DataTableProps` from the shared core lib — do not redeclare them in the Vue app. Declare both props via `defineProps<DataTableProps>()` so Vue's reactivity system tracks changes correctly (AC item 3). No domain-specific field names inside `apps/vue-client/src/lib/` or any core layer; demo datasets live in `apps/vue-client/src/app/` only. The component must render correctly for at least two structurally different datasets to satisfy US-01.
- **`react-developer` / `angular-developer`:** Reference only — these lanes are already implemented. If the shared `ColumnConfig<T>` type is extended during the Vue cycle (e.g., adding optional fields), ensure backward compatibility so existing React/Angular implementations are not broken.
- **`qa-engineer`:** The shared e2e suite at `apps/data-table-e2e/` has a `vue` Playwright project targeting port 4401 (CLAUDE.md §8). Once the Vue Data Table renders at `/`, the smoke spec for `vue` should go green with no e2e changes. Verify: (1) prop-change re-renders correctly in the Vue app; (2) zero domain-specific field names exist inside the Vue component source; (3) Selection and Actions Cell are absent; (4) the component renders correctly for at least two structurally different datasets. `data-testid` values must be identical to those used in the React and Angular apps (`data-table`, `table-row`, etc.).
- **`ui-designer`:** A Figma node is now linked: [Aristek UI Pro Core Kit — node 380-1485](https://www.figma.com/design/0gLQ8QbaZq1I0yhiKspQg0/Aristek-UI-Pro-%E2%80%94-Core-Kit?node-id=380-1485). Validate the base Data Table layout against this node before the Vue implementation begins. The `columns`/`data` prop contract directly determines column count and cell-slot layout — confirm the Figma component reflects the same column structure used in the React and Angular implementations.

---

## Source Citations

- Jira: NGI-12 (https://aristeksystems-team-f2twyvsi.atlassian.net/browse/NGI-12).
- Confluence: Iterations (pageId `8749069`), section "Iteration 1 — MVP Table with Extended Cell Types / Scope" and "Out of scope".
- Confluence: Iteration 1 — User Stories & Acceptance Criteria (pageId `11960322`), sections "US-01" and "US-08".
- Confluence: Design Requirements (pageId `8159250`), sections §7.1, §7.2, §11, §12.
- Local mirror: `docs/claude/iterations/iteration-1.md`.
- Local mirror: `docs/claude/terminology.md`.
- Local mirror: `docs/claude/ui-ux-expectations.md`.

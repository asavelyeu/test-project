# Task Brief — NGI-13: [FE] Table Component: Static Column Configuration

**Jira:** [NGI-13](https://aristeksystems-team-f2twyvsi.atlassian.net/browse/NGI-13)
**Figma:** not linked yet
**Active iteration:** Iteration 1 — MVP Table with Extended Cell Types
**Curated by:** spec-analyst on 2026-05-24

---

## Translated Task

Ticket phrasing: "static column definition that specifies key, header label, and cell type. Column rendering order and headers must be fully driven by configuration."

Canonical translation: implement the **static column configuration** shape for the **Data Table**. Each column entry must carry at minimum a data key, a **Table Header Cell** label, and a cell-type identifier. The **Table Header** row and column rendering order are derived entirely from that configuration — no hard-coded domain field names inside the component.

---

## Acceptance Criteria (verbatim)

Source: Jira NGI-13 description (primary); confirmed against Confluence pageId `11960322`, US-02.

1. Column definition specifies at minimum: key, header label, and cell type.
2. Columns render in the order they are defined in the configuration.
3. Column headers display the labels provided in the configuration.
4. Adding or removing a column entry from the configuration reflects immediately in the rendered table.

---

## Matched User Stories

- **US-02 — Define Static Column Configuration** — directly matched; the ticket's four acceptance criteria are verbatim reproductions of the US-02 AC from Confluence pageId `11960322`. This story is the sole labeled US in the ticket.

Note: US-01 (Configure Table via `columns` and `data` props) is a close neighbor — it governs the prop contract that US-02 depends on — but it is **not** labeled in this ticket and therefore is not in scope for NGI-13. Any cross-dependency on US-01 should be flagged to the developer; the two stories may need to be implemented together or sequenced deliberately.

---

## Design Requirements Touched

- **Column configuration shape** — Design Requirements §6 (pageId `8159250`): "Use the qualified form when ambiguity is possible." Column config type identifiers must use canonical cell-type names verbatim (e.g., `Text Cell`, `Status Cell`) — not invented short forms such as `badge`, `text`, or `custom`. Source: `docs/claude/terminology.md` §How to use.
- **Table Header / Table Header Cell distinction** — Design Requirements §6 use-vs-avoid table: use `Table Header Cell`, not `Header Cell`. The label in column configuration populates each Table Header Cell. Source: `docs/claude/terminology.md` §Use vs avoid.
- **Reusability rule** — Design Requirements §8 (via `docs/claude/ui-ux-expectations.md` §UX requirements): "The Students demo (or any future demo) shows realistic usage but must not influence the generic architecture. Cell types, column configuration, and component API must remain domain-agnostic." The column config type must therefore be a generic discriminated union — no student-specific variants.
- **No domain leakage** — CLAUDE.md §1 non-goal: "No domain-specific logic, field names, or imports inside the component." Column keys come from the caller; the component never knows what they mean.

---

## Terminology Resolutions

| Ticket phrasing | Canonical term | Source |
| --- | --- | --- |
| "header label" | **Table Header Cell** label | `docs/claude/terminology.md` §Core structure |
| "cell type" | Cell-type identifier (one of the 14 canonical **Cell** names) | `docs/claude/terminology.md` §Cell types |
| "column rendering order" | Column order driven by the `columns` configuration array | US-02 AC, Confluence pageId `11960322` |
| "static column definition / configuration" | **Static column configuration** | Iteration 1 Scope, `docs/claude/iterations/iteration-1.md` |

No unresolvable terms found.

---

## Scope Verdict

**Verdict:** in scope

- Matches Scope item: "Static column configuration." — Iterations page (pageId `8749069`), Iteration 1 Scope list; mirrored in `docs/claude/iterations/iteration-1.md`.
- Matches Scope item: "Display tabular data based on `columns` and `data` configuration." — same source (column config is the mechanism that drives this).
- Active iteration confirmed: Confluence Development Current Status (pageId `8749057`) lists Iteration 1 as **Planned** — work has not started; NGI-13 is the correct entry point.
- Does not touch any Out of scope item: the ticket does not request Row selection, Bulk selection, Row actions, Action column, Inline editing, Sorting, Filtering, Search, Pagination, or Server-side data loading.

---

## Risks & Open Questions

- **Risk — US-01 / US-02 sequencing.** US-02 (column config shape) and US-01 (prop contract: `columns` + `data`) are tightly coupled. NGI-13 labels only US-02. If US-01 has not already been implemented, the developer will need to implement the prop contract as part of this ticket or ensure a preceding ticket covers it. If both are attempted in one PR without explicit scoping, the PR may silently expand scope.
- **Risk — cell-type identifier format not specified.** The AC requires a `cell type` field in each column definition but neither the ticket nor US-02 specifies whether the identifier is a string enum, a TypeScript discriminated union, or a runtime key. The spec is silent on the concrete shape. A non-obvious decision will be required; it must be surfaced by the developer per CLAUDE.md §5 step 7.
- **Risk — cross-framework parity gap.** The ticket title is `[FE] Table Component` without naming a framework. The repository hosts React, Angular, and Vue lanes (confirmed from git log). If this ticket is implemented in one framework only, the other two lanes will be out of parity on the column config shape. Recommend clarifying which framework(s) NGI-13 targets, and requesting equivalent tickets for any un-covered lane.
- **Risk — domain leakage via column keys.** Column keys will be strings like `"name"` or `"status"`. The component must not import or reference these keys internally; it must treat them as opaque. Developers should verify no internal switch-case or if-chain references domain keys directly.
- **Open — Figma not linked.** No Figma node is attached to NGI-13. The Table Header / Table Header Cell visual treatment (typography, spacing, alignment of header labels) is governed by Design Requirements pageId `8159250`. The developer should request or locate the relevant Figma frame before finalizing the header label rendering.
- **Open — minimum required fields vs optional fields.** The AC says "at minimum: key, header label, and cell type." It does not enumerate optional fields (e.g., column width, alignment, truncate/wrap hint). The developer must either restrict to the minimum and raise a finding for any addition, or confirm with the BA which optional fields are acceptable in Iteration 1 without expanding scope.

---

## Drift Detected

- **None detected.** The four acceptance criteria in the Jira ticket (NGI-13 description) are verbatim reproductions of the US-02 AC in Confluence pageId `11960322`. No conflict between Jira and Confluence on this ticket.
- **Local mirror `docs/claude/iterations/iteration-1.md`** — the US-02 summary in the mirror reads: "Column definition specifies key, header label, and cell type. Columns render in declared order. Adding/removing a column reflects immediately." This is a correct condensation of the Confluence text; no substantive drift. Mirror is current.
- **Development Current Status local mirror** — `iteration-1.md` status field reads `Planned`; Confluence pageId `8749057` confirms `Planned`. Aligned.

---

## Candidate Findings

- **Candidate Finding — cell-type identifier format unspecified in spec.** Neither US-02 nor the Iterations page defines the concrete representation of the `cell type` field (string literal, enum, discriminated union). Any implementation decision made here will become a de-facto API contract for all 12 cell types in US-09–US-20. This gap is worth documenting before implementation, not after. Recommend raising a finding against the Finding Template (pageId `10485761`) and flagging to the BA. Ref: CLAUDE.md §6.
- **Candidate Finding — US-01 / US-02 ticket boundary.** US-01 (prop contract) and US-02 (column config shape) are functionally inseparable but tracked as separate user stories with no visible Jira link between them. This creates a risk of one being implemented without the other, or of scope being silently doubled in a single ticket. Worth noting in the Findings index (pageId `9928708`) as a process observation for the case study.

---

## Recommendations for Downstream Agents

- **`architect` / `react-developer` / `angular-developer` / `vue-developer`:** Before implementing, confirm whether US-01 (the `columns` + `data` prop contract) is already in place. If not, the prop contract and the column config shape must be designed together. Do not invent a cell-type identifier format — surface the choice as a decision and record it per CLAUDE.md §5 step 7.
- **All framework developers:** The `ColumnDefinition` (or equivalent) type must be generic and domain-agnostic. Cell-type identifiers must be drawn from the 12 canonical cell types in scope for Iteration 1 (Text Cell, Number Cell, Date Cell, Currency / Amount Cell, Status Cell, Progress Cell, Avatar Cell, Link Cell, Boolean / Yes-No Cell, Icon + Text Cell, Multiline / Description Cell, Tags / Labels Cell). Do not add Actions Cell or Selection Cell — both are Out of scope for Iteration 1.
- **All framework developers:** Column keys must be treated as opaque strings by the component internals. No internal branching on key names.
- **`qa-engineer`:** Test with at least two structurally different column arrays (different key names, different column counts, different cell types) to satisfy US-08's reusability criterion. Verify that column render order matches declaration order, and that adding/removing a column from the config produces immediate re-render with no stale headers.
- **`ui-designer`:** Confirm the Figma frame for Table Header Cell label rendering and provide the node URL for this ticket. Table Header typography, spacing, and alignment tokens are required before final implementation review.

---

## Source Citations

- Jira: NGI-13 (https://aristeksystems-team-f2twyvsi.atlassian.net/browse/NGI-13).
- Confluence: "Iteration 1 - User Stories & Acceptance Criteria" (pageId `11960322`), section "Data Configuration — US-02".
- Confluence: "Iterations" (pageId `8749069`), section "Iteration 1 — MVP Table with Extended Cell Types — Scope".
- Confluence: "Current Status" (pageId `8749057`), Iterations table, Iteration 1 row.
- Local mirror: `docs/claude/iterations/iteration-1.md` (US-02 condensed summary; Scope list; Out of scope list).
- Local mirror: `docs/claude/ui-ux-expectations.md` (UX requirements, Design Requirements §8).
- Local mirror: `docs/claude/terminology.md` (cell types, use-vs-avoid, operational rules).
- CLAUDE.md §1 (non-goals: no domain leakage), §4 (canonical terminology), §5 (task workflow).

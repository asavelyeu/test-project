# Iteration 1 — MVP Table with Extended Cell Types

**Status:** `Planned` (per Development Current Status, pageId `8749057`).
**Source pages:**
- **Iterations** (pageId `8749069`) — scope, deliverables, acceptance criteria.
- **Iteration 1 — User Stories & Acceptance Criteria** (pageId `11960322`) — full US-NN content.
- **Development Current Status** (pageId `8749057`) — current iteration state.
- **Initiative Overview** (pageId `6291457`) — *not authoritative for scope* (see Finding 001).

This file is a medium-depth local mirror. For full text and any field this file omits, fetch the source pages above via the Atlassian MCP.

---

## Goal

Create a demo-ready reusable table component with static data display and a richer set of cell types. This iteration should already demonstrate that the component is not just a simple HTML table, but a configurable UI component that can support different content formats.

---

## Scope

- Display tabular data based on `columns` and `data` configuration.
- Static column configuration.
- Basic row rendering.
- Hover state for rows.
- Empty state.
- Basic loading state or loading placeholder.
- Basic visual consistency with the design system.
- Reusable structure that is not tied to a single domain.

---

## Cell types in scope

The 12 cell types Iteration 1 must support. Use canonical names; do not invent short forms (see `docs/claude/terminology.md`).

| Cell type | One-line description |
|---|---|
| **Text Cell** | Plain string value displayed as text. |
| **Number Cell** | Numeric value with consistent formatting (right-aligned, thousands separator). |
| **Date Cell** | Date value formatted into a readable string (e.g., `DD MMM YYYY`). |
| **Currency / Amount Cell** | Numeric monetary value with currency symbol and number formatting; right-aligned. |
| **Status Cell** (a.k.a. Status / Badge Cell) | Categorical state rendered as a styled chip/badge; each value maps to a distinct color. |
| **Progress Cell** | Numeric percentage rendered as a horizontal progress bar (0–100%). |
| **Avatar Cell** (a.k.a. Avatar / User Cell) | Circular avatar image + display name; fallback for missing image. |
| **Link Cell** | Clickable anchor with configurable label, href, and target. |
| **Boolean / Yes-No Cell** | True/false rendered as Yes/No labels or check/cross icons. |
| **Icon + Text Cell** | Contextual icon + label, side by side. |
| **Multiline / Description Cell** | Longer text wrapping across multiple lines; row height adjusts. |
| **Tags / Labels Cell** | Array of strings rendered as horizontally-arranged chips that wrap. |

---

## Out of scope (do not implement)

These are explicitly excluded from Iteration 1. Do not add them, even partially or "as a stub":

- Row selection.
- Bulk selection.
- Row actions.
- Action column (Actions Cell).
- Inline editing.
- Sorting.
- Filtering.
- Search.
- Pagination.
- Server-side data loading.

If a request to implement any of these comes in, surface the conflict before doing the work (CLAUDE.md §5 step 3).

---

## Deliverables

- Figma component for the base table layout.
- Figma variants or examples for the supported cell types.
- Frontend component with static configuration.
- Demo configuration (e.g., students, users, courses) exercising all 12 cell types.
- Basic documentation for column configuration and supported cell-type identifiers.

---

## Acceptance criteria (table-level)

- Table renders data from a generic configuration.
- Each supported cell type can be demonstrated in the demo dataset.
- Empty state is visible when data is empty.
- Loading state or placeholder is available.
- Component can be reused with another dataset without changing internal implementation.
- Selection and actions are not implemented in this iteration.

---

## User stories

Condensed mirror of US-01…US-21 from pageId `11960322`. Full acceptance criteria for each story live on the Confluence page; the key conditions are summarized here.

### Data Configuration

| ID | Story | Key acceptance criteria |
|---|---|---|
| **US-01** | Configure Table via `columns` and `data` props (developer) | Component accepts `columns` and `data` props. Re-renders on prop change. No hard-coded domain field names inside the component. Renders correctly for ≥ 2 different dataset shapes without code changes. |
| **US-02** | Define static column configuration (developer) | Column definition specifies key, header label, and cell type. Columns render in declared order. Adding/removing a column reflects immediately. |

### Core Table Behaviour

| ID | Story | Key acceptance criteria |
|---|---|---|
| **US-03** | Render data rows (user) | Each `data` object → one row. Each cell shows the value at its column key. Row order matches source array. Row count == data length. |
| **US-04** | Hover state on rows (user) | Cursor over a row → background changes to design-system hover token. Highlight removed on cursor leave. Only one row highlighted at a time. Hover does not change cell content or layout. |
| **US-05** | Empty state (user) | Empty `data` → no data rows; empty-state message/illustration shown. Distinct from loading state. Column headers remain visible. Message is meaningful (e.g., "No data available"). |
| **US-06** | Loading state (user) | Triggered via `isLoading` prop. Loading UI maintains column structure. Visually distinct from empty and populated states. Replaced by actual rows when loading ends. |

### Design & Reusability

| ID | Story | Key acceptance criteria |
|---|---|---|
| **US-07** | Visual consistency with design system (designer) | Typography/spacing/colors use design system tokens. Figma component for base layout exists and matches implementation. Variants/examples for each cell type provided. |
| **US-08** | Domain-agnostic reusable structure (developer) | No domain logic, field names, or imports inside the component. Same component renders students and users datasets without internal changes. Domain decisions expressed only through `columns`. Selection/actions excluded this iteration. |

### Cell Types

| ID | Story | Key acceptance criteria |
|---|---|---|
| **US-09** | Text Cell | String rendered as plain text. Long text truncated with ellipsis or wrapped, consistently. Visible in demo. |
| **US-10** | Number Cell | Numeric value, right-aligned by default. Formatting (thousands separator) applied consistently. Visible in demo. |
| **US-11** | Date Cell | Date formatted to readable string (e.g., `DD MMM YYYY`). Format consistent across rows. Visible in demo. |
| **US-12** | Currency / Amount Cell | Numeric value with currency symbol; thousands separators and decimals applied; right-aligned. Visible in demo. |
| **US-13** | Status / Badge Cell | Label inside styled chip/badge. Each status value maps to a distinct color from config or design system. Readable in normal and hover states. Demo includes ≥ 2 distinct status values. |
| **US-14** | Progress Cell | Horizontal progress bar reflecting 0–100%. Fill width proportional to value. Numeric value optionally shown alongside. Visible in demo. |
| **US-15** | Avatar / User Cell | Circular image + display name. Fallback (initials or placeholder) if no image. Image and name horizontally aligned. Visible in demo. |
| **US-16** | Link Cell | Clickable anchor with configurable label and href. Opens in new tab by default (configurable). Visible in demo. |
| **US-17** | Boolean / Yes-No Cell | `true` → Yes/check icon; `false` → No/cross icon. Consistent across rows. Visible in demo. |
| **US-18** | Icon + Text Cell | Icon and label side by side. Icon configurable per row or per column. Vertically centered, horizontally aligned. Visible in demo. |
| **US-19** | Multiline / Description Cell | Text wraps instead of truncating. Row height adjusts to wrapped content. Optional max-line cap. Visible in demo. |
| **US-20** | Tags / Labels Cell | Array of strings as chips. Chips wrap when cell narrow. Distinct chip appearance (outlined or filled). Demo has ≥ 2 tags per row. |

### Demo & Documentation

| ID | Story | Key acceptance criteria |
|---|---|---|
| **US-21** | Demo configuration and basic docs | Demo dataset exercises all 12 cell types. Docs cover column config structure and lists all cell-type identifiers. Demo is runnable without modifying component internals. All cell types visually demonstrated in a single or multi-section view. |

---

## Definition of Done

Iteration 1 is done when:

- All deliverables above are produced.
- All US-01…US-21 acceptance criteria pass.
- The component is reusable across ≥ 2 different datasets (US-08).
- The Out of scope list is verified (no items implemented even partially).
- Required UX states (Default, Hover, Loading, Empty) are present and validated against `docs/claude/ui-ux-expectations.md`.
- Findings discovered during the iteration are filed under the Findings & Lessons Learned index (pageId `9928708`).

---

## Pointers

- **Iterations** — `https://aristeksystems-team-f2twyvsi.atlassian.net/wiki/spaces/teama3c89e31d5e646f0991ddfd70c5d5982/pages/8749069`
- **Iteration 1 — User Stories & Acceptance Criteria** — `https://aristeksystems-team-f2twyvsi.atlassian.net/wiki/spaces/teama3c89e31d5e646f0991ddfd70c5d5982/pages/11960322`
- **Development Current Status** — `https://aristeksystems-team-f2twyvsi.atlassian.net/wiki/spaces/teama3c89e31d5e646f0991ddfd70c5d5982/pages/8749057`

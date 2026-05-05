# UX & Accessibility Expectations — Data Table

Local medium-depth mirror of UX, state, and accessibility expectations for any UI work on the Data Table or its consumers (e.g., the Students demo). **Source:**
- **Design Requirements** §7–§14 (pageId `8159250`) — functional, UX, UI, accessibility, edge cases, AI-assisted requirements.
- **Base Figma Data Table Component Checklist** (pageId `8519686`) — design quality baseline.
- **WCAG-ready Figma Data Table Component Checklist** (pageId `8421381`) — accessibility expectations at design level.

For full detail, fetch the source pages via the Atlassian MCP.

---

## How to use this file

Use it twice per UI task:

1. **Before implementing** — confirm which states and behaviors apply, and what the spec requires.
2. **After implementing, before claiming done** — walk the Definition of Done at the bottom. If a checkbox can't be ticked, the work is not done.

Referenced from CLAUDE.md §5 step 6 ("Validate against UX expectations").

---

## Required table states

The Data Table must explicitly handle every state below. Missing a state is a defect.

| State | When it triggers | What must be visible | Critical "must not" |
|---|---|---|---|
| **Default State** | Table has data and no special condition. | Rows render with column data; no spinners or messages overlaid. | — |
| **Hover State** | Cursor is over a row. | Row background changes to design-system hover token. | Only one row highlighted at a time; cell content/layout must not shift. |
| **Loading State** | Data is being fetched (`isLoading` true). | Loading indicator or skeleton placeholder. Column structure preserved. | Must not be confusable with Empty State. Replaced by actual rows when loading ends. |
| **Empty State** | The dataset itself has no rows. | Clear empty-state message or illustration. Column headers remain visible. | Must not be confusable with Loading State. Message must be meaningful, not "—" or blank. |
| **No Results State** | A search or filter excluded all rows. | Clear "no results" message; controls to clear search/filter when relevant. | Distinct from Empty State (the dataset itself isn't empty — the user's filter excluded everything). |
| **Error State** | Data loading or processing failed. | Clear error message; recovery action (Retry) where applicable. | Error must not be communicated by color alone (icon or text required). |
| **Disabled State** | Actions or controls are unavailable. | Visually clear disabled treatment with sufficient contrast. | Must not look identical to a hover or loading state. |

---

## UX requirements

From Design Requirements §8:

- **Predictable interaction model.** Users should clearly understand which elements are static, which are clickable, which column is sorted, which rows are selected, and which actions are available.
- **No hidden functionality.** Interactive elements must be visually distinguishable from static content. Don't ship features that only appear on hover or after an unexplained gesture.
- **Clickable Row vs Actions Cell — no conflict.** Row-level actions (when added in later iterations) must not collide with row-level click navigation. If both exist, the click target areas must be visually and behaviorally distinct.
- **Demo separated from core.** The Students demo (or any future demo) shows realistic usage but must not influence the generic architecture. Cell types, column configuration, and component API must remain domain-agnostic.

---

## Accessibility expectations

From Design Requirements §10 and the WCAG-ready Figma checklist (`8421381`).

### Color & contrast

- **Main text:** contrast ratio ≥ 4.5:1 against background.
- **Secondary text:** ≥ 4.5:1 unless explicitly decorative.
- **UI elements (icons, borders, controls):** ≥ 3:1.
- **Hover, selected, focus states** must also meet contrast requirements.
- **Use semantic color tokens**, not raw color values.

### State independence from color

- Selected state must use checkbox/border/icon/text style — not background color alone.
- Sorted column state must use icon/text style/background change — not color alone.
- Active filter state must use more than color.
- Error state must use text or icon — not red color alone.

### Focus

- Every interactive element has a visible focus state.
- Focus indicator contrast ≥ 3:1.
- Focus state remains visible when hover is also active.
- Sortable Table Header Cells, Clickable Rows, checkboxes, inputs, filters, pagination controls, and action buttons all have focus states.

### Hit areas

- Interactive elements have a click target of approximately 44 × 44 px (or as close as practical).
- Small visual elements (sort icons, action icons) include sufficient invisible padding.
- Selection controls don't require pixel precision.
- Pagination controls have sufficient clickable area.

### Typography & readability

- Main table text ≥ 14 px (recommended).
- Line height ≥ 1.4.
- Header vs body have a clear visual hierarchy.
- Compact density does not reduce readability below acceptable limits.

### Content overflow

- Long content must not become inaccessible due to truncation.
- If Truncate is used, an alternative access method exists (tooltip, expanded row, detail page).
- Wrap is supported where multiline content is required.
- Empty values have a defined visual representation (e.g., `—`).

### Icons

- Icons are not the only source of meaning.
- Status Cell uses text or another explicit label in addition to color.
- Action icons have understandable labels in the design spec or handoff notes.
- Decorative icons are visually distinguishable from actionable icons.

### Structure & hierarchy

- Table Header is visually separated from Table Body.
- Rows are easy to scan (spacing, borders, or zebra pattern).
- Cells have consistent alignment and spacing.
- Numeric content alignment is defined.
- The relationship between Table Header Cells and Table Cells is visually clear.

---

## Edge cases checklist

For any UI change, ask whether each applies and is handled:

- [ ] **Long text** — truncate, wrap, tooltip, or detail-access behavior defined.
- [ ] **Empty values** — display behavior defined (e.g., `—`).
- [ ] **Large numbers** — formatting and alignment defined.
- [ ] **Many columns** — horizontal behavior or column-width rules defined.
- [ ] **Few columns** — table does not look broken or unbalanced.
- [ ] **No data** — Empty State shown.
- [ ] **Loading failure** — Error State shown.
- [ ] **Search with no matches** — No Results State shown.
- [ ] **Disabled actions** — disabled state visible and clear.
- [ ] **Clickable Row + actions** — interaction conflict avoided.

---

## Definition of Done for UI work

Tick every box that applies to the change before claiming the work is done.

- [ ] All required states for the touched component (per the *Required table states* table) are implemented or explicitly marked N/A.
- [ ] State transitions verified (Loading → Default; Default → Empty; Filter applied → No Results).
- [ ] No state relies on color alone (verified manually or with a desaturation pass).
- [ ] Every new interactive element has a visible focus state with ≥ 3:1 contrast.
- [ ] Hit areas for new interactive elements approximately 44 × 44 px.
- [ ] Text contrast ≥ 4.5:1; UI element contrast ≥ 3:1.
- [ ] No domain-specific (Students or other) types or copy in the core component.
- [ ] Edge cases checklist above walked.
- [ ] If a non-obvious decision was made, it is surfaced in the response (CLAUDE.md §5 step 7) or filed as a finding (CLAUDE.md §6).

---

## Pointers

- **Design Requirements** — `https://aristeksystems-team-f2twyvsi.atlassian.net/wiki/spaces/teama3c89e31d5e646f0991ddfd70c5d5982/pages/8159250`
- **Base Figma Data Table Component Checklist** — `https://aristeksystems-team-f2twyvsi.atlassian.net/wiki/spaces/teama3c89e31d5e646f0991ddfd70c5d5982/pages/8519686`
- **WCAG-ready Figma Data Table Component Checklist** — `https://aristeksystems-team-f2twyvsi.atlassian.net/wiki/spaces/teama3c89e31d5e646f0991ddfd70c5d5982/pages/8421381`

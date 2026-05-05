# Canonical Terminology — Data Table

Local medium-depth mirror of the team's terminology dictionary. **Source:**
- **Terms** (pageId `7634945`) — bilingual definitions (English + Russian).
- **Introduction** (pageId `7503875`) — why the dictionary exists, how to use it.
- **Design Requirements §6** (pageId `8159250`) — the use-vs-avoid pairs.

For the bilingual Russian glosses or any term not listed here, fetch the Terms page via the Atlassian MCP.

---

## Why this matters

The dictionary is a **contract between people and AI**. AI agents do not interpret meaning the way humans do — they rely on wording. When the team uses different terms or assigns different meanings, AI starts to confuse entities and break architectural consistency.

Using the canonical terms in design, requirements, code, and prompts:
- Reduces misunderstandings between BA, UX, and Frontend.
- Makes AI generation predictable and consistent.
- Keeps the Data Table reusable rather than one-off.

The dictionary is **a living artifact** — when a new term is needed, add it to the dictionary first; do not invent.

---

## Use vs avoid (from Design Requirements §6)

Use the qualified term whenever ambiguity is possible.

| Use | Avoid |
|---|---|
| **Data Table** | Table |
| **Table Header** | Header |
| **Table Row** | Row |
| **Table Cell** | Cell |
| **Table Header Cell** | Header Cell |

---

## Core structure

| Term | Definition |
|---|---|
| **Data Table** | The main component used to display tabular data. |
| **Table Header** | The top section of the table that contains column titles. |
| **Table Header Cell** | A header cell that describes one specific column. |
| **Table Row** | One rendered data record. |
| **Table Cell** | The basic content container; a slot for one cell type. |

---

## Cell types

All 14 canonical cell types. The first 12 are in scope for Iteration 1 (see `docs/claude/iterations/iteration-1.md`); **Actions Cell** and **Selection Cell** appear in later iterations.

| Term | Definition |
|---|---|
| **Text Cell** | A cell that contains a text value. |
| **Number Cell** | A cell that contains a numeric value. |
| **Date Cell** | A cell that contains a date value formatted into a readable string. |
| **Currency / Amount Cell** | A cell that contains a monetary amount with currency symbol and number formatting. |
| **Status Cell** (a.k.a. Status / Badge Cell) | A cell that contains a categorical state, usually represented as a badge with text. |
| **Progress Cell** | A cell that contains a numeric percentage rendered as a visual progress bar. |
| **Avatar Cell** (a.k.a. Avatar / User Cell) | A cell that contains an avatar image and accompanying text. |
| **Link Cell** | A cell that contains a clickable URL or navigation target. |
| **Boolean / Yes-No Cell** | A cell that contains a true/false value rendered as Yes/No or check/cross icons. |
| **Icon + Text Cell** | A cell that contains a contextual icon next to a text label. |
| **Multiline / Description Cell** | A cell that contains longer text content that wraps across multiple lines. |
| **Tags / Labels Cell** | A cell that contains multiple categorical labels for one record. |
| **Actions Cell** | A cell that contains row-level actions, such as buttons or a menu. |
| **Selection Cell** | A cell that contains a checkbox used to select a row. |

---

## Functional behaviors

| Term | Definition |
|---|---|
| **Sorting** | Changing the order of rows based on the value of a selected column. |
| **Filtering** | Limiting the dataset based on defined conditions. |
| **Selection** | Selecting one or multiple rows. |
| **Pagination** | Splitting data into pages. |

---

## Interaction & row states

| Term | Definition |
|---|---|
| **Hover** | The state of an element when the cursor is placed over it. |
| **Focus** | The state of an element when it is reached via keyboard navigation. |
| **Selected** | The state of a row that has been selected. |
| **Clickable Row** | A row that can be clicked to navigate to details or trigger an action. |

---

## Table states

| Term | Definition |
|---|---|
| **Default State** | Normal data display. |
| **Loading State** | Data is loading; table structure should remain understandable. |
| **Empty State** | The dataset itself has no rows; show a clear message. |
| **No Results State** | A search or filter excluded all rows; distinct from Empty State. |
| **Error State** | Data loading or processing failed; include a message and recovery action where applicable. |
| **Disabled State** | Actions or controls are unavailable. |

> **Note.** *No Results State* is required by Design Requirements §7.9 but is not in the original Terms dictionary. Treat the definition above as canonical until the dictionary is updated; flag as a finding when the team is ready to formalize it (CLAUDE.md §6, Findings).

---

## Layout & behavior

| Term | Definition |
|---|---|
| **Density** | The display density of the table — `compact`, `default`, or `comfortable` — controlling spacing between rows and elements. |
| **Truncate** | Cutting off text and adding an ellipsis when content does not fit. |
| **Wrap** | Moving text to a new line when content does not fit on one line. |

---

## How to use

**In code.** File names, component names, type names, prop names, variant names, comments, and column-config `type` values must use the canonical term as their root name. Casing and formatting are project conventions; the canonical word is not negotiable.

**In design.** Figma component, frame, and layer names must use canonical terms. Generic names like "Frame 1" or "header" must be replaced.

**In requirements & user stories.** Use the canonical term ("the Data Table must support Selection and Pagination"), not colloquial wording ("the table should have item selection").

**In prompts.** Reference canonical terms verbatim ("create a Data Table with Selection Cell and Actions Cell"). Vague phrasing ("table with buttons", "checkbox column") produces unpredictable results.

**Operational rules.**

- **Empty State ≠ No Results State.** See definitions above.
- **Don't invent short forms** for cell types. The cell-type identifier in `columns` must resolve unambiguously to one canonical Cell.
- **Normalize colloquial input.** If a request says "table with buttons," internally translate to "Data Table with Actions Cell" and use the canonical form in the response.
- **Missing term?** Flag it as a finding rather than inventing one. New terms must be added to the dictionary first.

---

## Pointers

- **Terms** — `https://aristeksystems-team-f2twyvsi.atlassian.net/wiki/spaces/teama3c89e31d5e646f0991ddfd70c5d5982/pages/7634945`
- **Introduction** — `https://aristeksystems-team-f2twyvsi.atlassian.net/wiki/spaces/teama3c89e31d5e646f0991ddfd70c5d5982/pages/7503875`
- **Design Requirements §6** — `https://aristeksystems-team-f2twyvsi.atlassian.net/wiki/spaces/teama3c89e31d5e646f0991ddfd70c5d5982/pages/8159250`

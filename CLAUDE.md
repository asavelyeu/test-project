# Reusable Data Table Initiative

This file guides the agent through the _BA/UX/Front_ pilot project: a cross-functional initiative to validate the AI-powered software development lifecycle by creating a generic, reusable **data table** component. In this repository, the AI ​​agent acts as a **frontend developer**, following specifications written elsewhere (Confluence, Jira, Figma) and creating code.

---

## 1. Mission, Scope & Non-Goals

**Mission.** We are building a generic, reusable **Data Table** component as part of an internal BA / UX / Front pilot exploring AI-assisted SDLC. The component is **domain-agnostic** and is designed with **framework portability** in mind — the same conceptual API should later be expressible in React, Angular, Vue, or other frameworks.

**In scope (always).**

- The generic Data Table component plus the configuration shape (columns, data, states) needed to drive it.
- A separate Students demo that _consumes_ the Data Table to show it working — never a "Students table."
- Iteration-bounded delivery: we ship in iterations, and the active iteration's scope is the only thing being implemented at any given time.

**Non-goals — do not do these.**

- **No domain leakage into the core.** Student-specific (or any other domain-specific) logic, types, statuses, copy, or imports must not appear inside the core component. The core knows about columns, cells, and table states — not about students, courses, or orders.
- **No premature framework-coupling.** Where a portable design is feasible, take it. When framework-coupling is unavoidable, isolate it behind a clear seam.
- **No work outside the active iteration's scope** — even opportunistically.
- **Do not treat the Initiative Overview's iteration breakdown as authoritative.** It is known to conflict with the Iterations page (see Finding 001). Section 3 names the source of truth.

---

## 2. How We Work — Iteration Model

The work is delivered in defined iterations. Each iteration has its own goal, in-scope items, out-of-scope items, deliverables, acceptance criteria, and demo scenario.

**Two questions the AI agent must be able to answer before touching code:**

1. _Which iteration is currently active?_ Source of truth: the **Development Current Status** page in Confluence. Look for the iteration marked `In Development` (or, if none yet, the next `Planned`).
2. _What is in and out of scope for that iteration?_ Source of truth: the **Iterations** page in Confluence. Read the matching iteration block — both the **Scope** and the **Out of scope** lists.

**Rules.**

- Never implement an item from the _Out of scope_ list, even partially or "as a stub." If a feature is scheduled for a later iteration, it stays out until that iteration is active.
- If the user asks for something that isn't in the active iteration's scope, surface that mismatch explicitly before doing the work — don't silently expand scope.
- The **Initiative Overview** is a high-level description only. For iteration scope it is **not** authoritative (per Finding 001).

(Concrete URLs and page IDs for these Confluence pages live in Section 3 — not duplicated here.)

---

## 3. Source-of-Truth Map

When two artifacts disagree, the **authoritative source** wins. This table shows where to look and which version to trust.

| Topic                                                 | Authoritative source (Confluence)                                    | Local cache / mirror                                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Initiative goals & high-level approach                | Initiative Overview (pageId `6291457`)                               | none — fetch when needed                                                                                        |
| Iteration roadmap (scope, out-of-scope, deliverables) | **Iterations** (pageId `8749069`)                                    | per-iteration files under `docs/claude/iterations/` (current: `iteration-1.md`)                                 |
| Currently active iteration                            | Development Current Status (pageId `8749057`)                        | top of `docs/claude/iterations/iteration-1.md` (status field)                                                   |
| Design requirements (functional, UX, accessibility)   | Design Requirements (pageId `8159250`)                               | **`docs/claude/ui-ux-expectations.md`** (UX, states, a11y mirror); operational rules also in §§4–5 of this file |
| Canonical terminology                                 | Terms (pageId `7634945`) + Introduction (pageId `7503875`)           | **`docs/claude/terminology.md`** (full local mirror); Section 4 of this file (inline excerpt)                   |
| Figma component quality baseline                      | Base Figma Data Table Component Checklist (pageId `8519686`)         | none — fetch only when reviewing UX                                                                             |
| WCAG-ready Figma checklist                            | WCAG-ready Figma Data Table Component Checklist (pageId `8421381`)   | none — fetch when validating accessibility                                                                      |
| Iteration 1 — user stories & acceptance criteria      | Iteration 1 — User Stories & Acceptance Criteria (pageId `11960322`) | **`docs/claude/iterations/iteration-1.md`** (condensed mirror)                                                  |
| Atomic component inventory                            | Atomic Components (pageId `13271041`)                                | referenced from `docs/claude/project-structure.md` §6; full inventory only on Confluence                        |
| Project structure & component architecture            | n/a — internal architecture decision                                 | **`docs/claude/project-structure.md`** (folder layout, layer purposes, placement rules)                         |
| Findings & lessons learned (index)                    | Findings Section Overview (pageId `9928708`)                         | none — fetch when adding or referencing a finding                                                               |
| Finding template                                      | Finding Template (pageId `10485761`)                                 | none — fetch when writing a new finding                                                                         |

**Confluence access.** Cloud ID: `835113e2-32d3-4ad1-9ff2-e1a6ba78fb0f` — site: `https://aristeksystems-team-f2twyvsi.atlassian.net`. Use the Atlassian MCP (`mcp__atlassian__getConfluencePage` with this `cloudId`) to fetch any page above.

**Conflict-resolution rules.**

- **Iterations page beats Initiative Overview** for any iteration-scope question (per Finding 001).
- **Local mirrors are authoritative for terminology when explicitly canonical** — Section 4 of this file is the canonical excerpt; `docs/claude/terminology.md` is the full local mirror. If a term isn't in either, fetch the Terms page.
- **A finding does not change a spec.** If a finding contradicts a spec, the team must update the spec; the agent should surface the contradiction, not silently adopt the finding's recommendation as a rule.

---

## 4. Canonical Terminology

The dictionary is a **contract between people and AI** (per the Terminology Dictionary Introduction). Whenever the agent names a component, file, prop, variant, type, comment, prompt, or commit message, the **root name must be the canonical term** — verbatim. Casing and formatting are separate concerns.

**Prefer the qualified form when ambiguity is possible** (Design Requirements §6):

| Use                   | Avoid       |
| --------------------- | ----------- |
| **Data Table**        | Table       |
| **Table Header**      | Header      |
| **Table Row**         | Row         |
| **Table Cell**        | Cell        |
| **Table Header Cell** | Header Cell |

**Canonical excerpt.**

- **Structure** — Data Table, Table Header, Table Header Cell, Table Row, Table Cell.
- **Cell types** — Text Cell, Number Cell, Date Cell, Currency / Amount Cell, Status Cell, Progress Cell, Avatar Cell, Link Cell, Boolean / Yes-No Cell, Icon + Text Cell, Multiline / Description Cell, Tags / Labels Cell, Actions Cell, Selection Cell.
- **Functional behaviors** — Sorting, Filtering, Selection, Pagination.
- **Row interaction & states** — Hover, Focus, Selected, Clickable Row.
- **Table states** — Default State, Loading State, Empty State, **No Results State**, Error State, Disabled State.
- **Layout & behavior** — Density (compact / default / comfortable), Truncate, Wrap.

**Operational rules.**

- **Empty State ≠ No Results State.** Empty State = the dataset has no rows. No Results State = a user's search or filter excluded all rows. Don't conflate them.
- **Don't invent short forms** for cell types (e.g., `"badge"` for `Status Cell`, `"buttons"` for `Actions Cell`, generic `"custom"` / `"data"`). Each cell-type identifier must resolve unambiguously to one canonical Cell.
- **Normalize colloquial language in inputs.** If a spec or user message says "table with buttons" or "checkbox column," internally translate to the canonical term (Actions Cell, Selection Cell) and use the canonical form in any output.
- **If a needed term is missing** from the Terms page or this excerpt, **flag it** rather than inventing one. New terms must be added to the dictionary first (the Introduction calls it a "living artifact").

For complete definitions (including the bilingual Russian glosses), fetch the Terms page (pageId `7634945`) via the Atlassian MCP.

---

## 5. Task Workflow

When given a task — or before proposing an approach to one — run through this checklist. Most steps take seconds and prevent rework.

**1. Translate the request into canonical terms.**
Convert any colloquial wording into the canonical term from Section 4. Examples: "table with buttons" → "Data Table with Actions Cell"; "checkbox column" → "Selection Cell." If the request mentions a User Story ID (e.g., US-13), note it.

**2. Identify the authoritative spec.**
Use the Source-of-Truth Map (Section 3) to locate the right Confluence page. Typical lookups:

- Iteration scope → **Iterations** page (`8749069`).
- Iteration 1 user story / acceptance criteria → **Iteration 1 — User Stories & Acceptance Criteria** (`11960322`).
- UX / state / accessibility detail → **Design Requirements** (`8159250`).
- Terminology → Section 4 of this file, or the Terms page (`7634945`) if a term is missing.

Fetch via the Atlassian MCP. Read the relevant section, not the whole page.

**3. Confirm the work is in the active iteration's scope.**
Check the Iterations page for the active iteration (Section 2 explains how to find it). The work must appear in the _Scope_ list and **not** in the _Out of scope_ list. If it's out of scope or unclear, **stop and surface the conflict** before implementing — don't silently expand scope.

**4. Plan the change against the non-goals (Section 1).**
Before writing code, ask:

- Will this introduce domain-specific (Students) logic, types, statuses, or copy into the core? If yes, restructure so the core stays generic and the demo holds the domain detail.
- Will this couple the core to a specific framework, styling library, or runtime where it doesn't have to? If yes, isolate that coupling behind a clear seam.

**5. Implement using canonical terms.**
File names, component names, type names, prop names, variant names, comments, and any column-config `type` value must use the canonical term as their root name (Section 4). For where each component physically lives in the repo (folder layout, layer purposes, placement rules), consult `docs/claude/project-structure.md`.

**6. Validate against UX expectations.**
For any UI work, check the relevant table states — Default, Hover, Loading, Empty, No Results, Error, Disabled — and the accessibility expectations from Design Requirements §10 (contrast, focus, color independence, hit areas). Don't ship UI that defines fewer states than the spec requires.

**7. Surface anything that had to be decided independently.**
If a non-obvious design choice was made — a small architectural call, a mapping from spec to implementation, an interpretation of an ambiguous requirement — call it out in the response so the human reviewer can confirm or correct it. If the choice is significant, log it as a finding (see Section 6).

---

## 6. Documentation Discipline

The pilot's case-study deliverable depends on documentation happening _throughout_ the work, not at the end. Three things need consistent capture: **findings**, **AI usage**, and **decisions**.

### Findings

A **finding** is anything observed during the work that the team should know about: a cross-document inconsistency, a missing requirement, an ambiguous spec, a duplicated definition, an AI output that was clearly right or clearly wrong, a process gap. Findings are independent of code and should be raised when they show up — not batched.

**When to draft one (non-exhaustive):**

- Two artifacts disagree on the same topic (the pattern from Finding 001).
- A term, state, or behavior is referenced but not defined.
- An iteration page lists a deliverable that doesn't appear in its user stories, or vice versa.
- An assumption was needed to proceed because the spec was silent.
- AI produced a clearly wrong output, or a clearly insightful one worth reusing.

**How.** Use the **Finding Template** (pageId `10485761`). Fill every section — especially _AI contribution_, _Decision / recommendation_, _Lesson learned_, and the _Reusable Insights for Case Study_ block, which is what a future public case study will quote. Draft the finding (in the response, or as a new Confluence page when the user asks for that). The team files it under the **Findings & Lessons Learned** index (pageId `9928708`) with the next sequential `Finding NNN` number.

### AI usage

Make AI involvement visible enough to feed the case study:

- **Prompts worth keeping** — when a specific prompt produced a noticeably better result, name it in the response so the team can collect it for a future Prompt Library.
- **Accepted vs rejected suggestions** — note the rationale, not just "done."
- **Where AI helped vs didn't** — be explicit. "AI drafted the cell-type table; the team corrected the Boolean Cell mapping" beats silence.

### Decisions

The Decision Log is listed as a future artifact (Design Requirements §15). Until it exists:

- **AI agents do not own decisions.** AI suggestions must be reviewed by a human before becoming project decisions (Design Requirements §14).
- When a non-obvious choice has to be made to proceed, state it explicitly in the response, label it as **the agent's choice (pending confirmation)**, and recommend the team confirm it.

---

## 7. Tools & MCP Servers

The workspace exposes several Model Context Protocol servers. Use them in preference to guessing or rederiving information.

| MCP                                             | What it's for                                                                                          | When to reach for it                                                                                                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Atlassian** (`mcp__atlassian__*`)             | Confluence pages and Jira issues at the team's Atlassian site.                                         | Fetching any Confluence page from Section 3; reading Jira tickets that back an iteration; looking up user stories. Typical entry points: `getConfluencePage`, `getConfluencePageDescendants`, `searchJiraIssuesUsingJql`. |
| **Jira** (`mcp__jira__*`)                       | Operational Jira workflows — issues, sprints, worklogs, comments.                                      | Creating or transitioning issues, adding comments, sprint operations. For read-only ticket lookups the Atlassian MCP is sufficient.                                                                                       |
| **Figma** (`mcp__figma__*`)                     | Reading Figma files and posting comments on nodes.                                                     | Validating UI work against the design source — reading the Data Table Figma component, cell-type variants, and the Base / WCAG-ready Figma checklists referenced in Section 3.                                            |
| **Nx** (`mcp__nx__*`)                           | Workspace topology, project metadata, generators, up-to-date docs.                                     | Navigating the monorepo, finding the right project for a change, looking up generator syntax, retrieving Nx documentation.                                                                                                |
| **Chrome DevTools** (`mcp__chrome-devtools__*`) | Browser automation, network inspection, console messages, accessibility snapshots, performance traces. | Manual UI validation in a real browser when the task ships UI code — confirming states render, inspecting console errors, checking the accessibility tree.                                                                |
| **Playwright** (`mcp__playwright__*`)           | Browser automation oriented toward testing and end-to-end flows.                                       | Writing or running end-to-end tests against the demo app.                                                                                                                                                                 |

**Rules of thumb.**

- Always use the agreed Cloud ID and site URL from Section 3 when calling Atlassian tools — don't infer them from page content.
- Prefer the most specific MCP for the job (Figma for designs, Nx for workspace structure) over reading raw config files.
- If a task requires a tool that no MCP covers, surface that as a finding (Section 6) so the team can decide whether to add the MCP or use a different approach.

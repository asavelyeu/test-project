# Dev Agent Pipeline — GitHub Copilot + Claude (VS Code)

> **How to use this file**
>
> 1. Open Copilot Chat in VS Code, switch to **Agent mode**.
> 2. Select **Claude Sonnet 4.6** from the model picker (see §10 for why).
> 3. Paste:
>    > _"Read `agent-pipeline-meta-prompt.md` carefully and create / update every
>    > file it describes, exactly as specified. Do not skip any file. Ask me
>    > before creating files outside the paths listed in §1, and before
>    > overwriting any existing instruction file in §0."_
>
> This document is **repository-specific** for the `test-project` NX workspace
> (React 19 + Vite + Tailwind v4, with Angular adapters generated on demand).
> Follow `.github/copilot-instructions.md` and `AGENTS.md` for repo-wide rules.

---

## 0. Repo reality check (READ FIRST — do not overwrite blindly)

Before generating anything, the agent running this prompt MUST:

1. Read these existing files and treat them as the source of truth — do not
   delete or contradict them:
   - `.github/copilot-instructions.md` (global repo rules)
   - `AGENTS.md` (Nx-specific guidance, auto-managed block)
   - `.github/instructions/wcag-aa.instructions.md` (shared a11y rules)
   - `.github/instructions/table-library.instructions.md` (table-specific)
   - `.github/prompts/build-table.prompt.md` (existing table scaffolder)
   - `.github/prompts/monitor-ci.prompt.md`
   - `.github/agents/ci-monitor-subagent.agent.md`

2. **Preserve, don't replace.** The pipeline prompts below extend the existing
   instruction set. If a rule in this file conflicts with an existing
   `*.instructions.md` file, ASK the user before changing the instruction file.

3. **Update — do not duplicate** — the global `.github/copilot-instructions.md`:
   add the new section "Cross-framework component rules" (see §5) at the bottom
   if it is missing. Do not rewrite the whole file.

4. Existing facts from the repo that this prompt already accounts for:
   - **Package manager:** `pnpm` only (never `npm` / `yarn`).
   - **Nx version:** 22 (`nx.json` is flat — use `pnpm nx`).
   - **UI library path:** `libs/shared/ui/` (alias `@test-project/shared-ui`).
     Components live in `libs/shared/ui/src/lib/` today; this pipeline
     standardizes new components under `libs/shared/ui/src/components/`
     (see §4).
   - **Storybook:** already configured for `shared-ui` at
     `libs/shared/ui/.storybook/` with Tailwind v4 wired in
     (`tailwind.css`, `preview.ts`). **Keep it there** (see §3).
   - **Tailwind:** v4 via `@tailwindcss/vite`. Theming utilities present:
     `class-variance-authority`, `clsx`, `tailwind-merge`.
   - **Angular plugin (`@nx/angular`) is NOT installed.** The architect or
     implementer must run `pnpm nx add @nx/angular` the first time an Angular
     adapter is needed — never assume it's there.

---

## 1. Files this prompt produces

```
.github/
  copilot-instructions.md              ← APPEND §5 only (do not rewrite)
  prompts/
    00-orchestrate.prompt.md           ← NEW
    01-requirements.prompt.md          ← NEW
    02-design-inspector.prompt.md      ← NEW
    03-architect.prompt.md             ← NEW
    04-implement-core.prompt.md        ← NEW   (framework-agnostic core + tokens)
    05-implement-react.prompt.md       ← NEW   (React adapter + Storybook)
    06-implement-angular.prompt.md     ← NEW   (Angular adapter + Storybook — optional per ticket)
    07-qa.prompt.md                    ← NEW
    08-pr-creator.prompt.md            ← NEW
    09-code-reviewer.prompt.md         ← NEW
  instructions/
    cross-framework-ui.instructions.md ← NEW   (applyTo: libs/shared/ui/**)

.vscode/
  mcp.json                             ← CREATE OR MERGE (don't clobber existing servers)
  settings.json                        ← MERGE keys (don't clobber existing settings)

.agent-config.yml                      ← NEW (fill in real values)
.agent-run/.gitkeep                    ← NEW (pipeline state, git-ignored)
.gitignore                             ← APPEND `.agent-run/`
README-agents.md                       ← NEW
```

**Rules for the generating agent:**

- For every NEW file: create it.
- For every MERGE / APPEND file: read first, then patch — never replace.
- If a NEW file already exists, stop and ask the user before overwriting.

---

## 2. Cross-framework component model (the core decision)

We support **React** and **Angular** from the same component spec. The proven
pattern in this repo (see `table-library.instructions.md`) is the
**three-layer adapter pattern**:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1 — Core (framework-agnostic)                        │
│  libs/shared/ui/src/core/<component>/                       │
│    • TypeScript types & prop contracts                      │
│    • Pure logic (hooks-as-functions, state machines,        │
│      validation, formatting, a11y helpers)                  │
│    • CSS file with `--ui-*` custom properties (the          │
│      theming contract — both adapters import it)            │
│    • NO React, NO Angular imports                           │
└─────────────────────────────────────────────────────────────┘
              ↓ imported by both adapters ↓
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  Layer 2a — React adapter    │  │  Layer 2b — Angular adapter  │
│  libs/shared/ui/src/         │  │  libs/<scope>/ui-angular/    │
│    components/<Component>/   │  │    src/components/<name>/    │
│    • .tsx + .module.css      │  │    • .component.ts + .html   │
│    • .stories.tsx (SB React) │  │    • .stories.ts (SB Angular)│
│    • .spec.tsx (Vitest/Jest) │  │    • .spec.ts (Jest)         │
└──────────────────────────────┘  └──────────────────────────────┘
```

### Theming contract (mandatory for every component)

Every component exposes its visual surface through **CSS custom properties**
prefixed with `--ui-<component>-*`. Consumers override them with either:

- **Tailwind utilities** (v4 supports `[--ui-button-bg:theme(colors.blue.600)]`
  arbitrary values, or arbitrary variants like `[&]:[--ui-button-bg:#1d4ed8]`),
- or **vanilla CSS** in a consumer stylesheet:
  `.my-page .ui-button { --ui-button-bg: #1d4ed8; }`.

Hardcoded hex values, magic pixels, or framework-specific styling APIs
(e.g. `tw-merge` only on the React side) are **forbidden inside the core CSS file**.

The React adapter MAY use Tailwind utility classes for layout shortcuts, but
every color/size/spacing token must be a `var(--ui-*-*)`. The Angular adapter
uses the same CSS file — no SCSS forks.

### Where Angular code goes

Angular projects don't exist yet in this repo. When the first ticket needs an
Angular adapter, the **Architect** agent:

1. Runs `pnpm nx add @nx/angular` (if not installed).
2. Generates a publishable Angular library at:
   `libs/shared/ui-angular/` — alias `@test-project/shared-ui-angular`.
3. Tags it `["scope:shared", "type:ui", "framework:angular"]`.
4. Imports `libs/shared/ui/src/core/**` for all logic and CSS.

The existing `libs/shared/ui/` library is **React-only** and stays that way.

---

## 3. Storybook placement — recommendation

**Keep Storybook inside `libs/shared/ui/`. Do NOT extract it to a separate
`apps/storybook` folder yet.**

Reasoning specific to this repo:

| Factor                       | Current (in-lib)                | Separate app          |
| ---------------------------- | ------------------------------- | --------------------- |
| Already configured & working | ✅ yes                          | ❌ requires migration |
| One lib today                | ✅ simple                       | overkill              |
| Tailwind v4 preview wired    | ✅ in `.storybook/tailwind.css` | needs re-wiring       |
| Cross-framework support      | ⚠️ React-only                   | ✅ can host both      |
| Affected/CI scoping          | ✅ scoped to lib                | ⚠️ touches more nodes |

**Migrate to a separate Storybook app only when** the second adapter library
(`libs/shared/ui-angular/`) exists AND you want a single Storybook hosting
React + Angular side-by-side. At that point:

```
apps/
  storybook/           ← @nx/storybook with both react + angular addons
                        or two separate apps: storybook-react, storybook-angular
```

Until then: **React stories live next to React components in
`libs/shared/ui/`. Angular stories (when introduced) live next to Angular
components in `libs/shared/ui-angular/` with their own Storybook
configuration** (Storybook supports per-lib configs in Nx).

The Architect agent (§6) is responsible for raising this recommendation in
its output when it generates the first Angular adapter.

---

## 4. Canonical folder structure for a new component

```
libs/shared/ui/src/
├── index.ts                          ← barrel: re-export public API
├── core/
│   └── <component-kebab>/            ← e.g. data-table, button, modal
│       ├── index.ts                  ← types + logic + css path exports
│       ├── <component>.types.ts
│       ├── <component>.logic.ts      ← pure functions / state machines
│       ├── <component>.a11y.ts       ← ARIA helpers, keyboard maps
│       └── <component>.css           ← --ui-<component>-* tokens (the contract)
├── components/                       ← React adapters
│   └── <ComponentPascal>/
│       ├── index.ts
│       ├── <ComponentPascal>.tsx
│       ├── <ComponentPascal>.module.css   ← only if local-scope styles needed
│       ├── <ComponentPascal>.stories.tsx  ← REQUIRED
│       └── <ComponentPascal>.spec.tsx     ← REQUIRED (includes axe audit)
└── lib/                              ← legacy location — leave existing files,
                                       new code goes under components/
```

If the ticket also requires Angular:

```
libs/shared/ui-angular/src/
├── index.ts
├── components/
│   └── <component-kebab>/
│       ├── <component>.component.ts
│       ├── <component>.component.html
│       ├── <component>.component.spec.ts   ← REQUIRED (axe audit)
│       └── <component>.stories.ts          ← REQUIRED
└── (imports core from @test-project/shared-ui/core/<component>)
```

---

## 5. Append to `.github/copilot-instructions.md`

Append the following section to the existing file (do NOT rewrite it):

```markdown
## Cross-framework component rules (added by agent pipeline)

- **Three-layer pattern:** every reusable UI component has a framework-agnostic
  `core/` slice (types, logic, CSS tokens) plus thin React and (optionally)
  Angular adapters. See `.github/instructions/cross-framework-ui.instructions.md`.
- **Theming contract:** the public styling surface of every component is a set
  of `--ui-<component>-*` CSS custom properties defined in the core CSS file.
  Consumers override them with Tailwind arbitrary values or plain CSS.
  No hardcoded colors / pixels inside `libs/shared/ui/src/core/**`.
- **New React components** go under `libs/shared/ui/src/components/<Pascal>/`,
  not `libs/shared/ui/src/lib/`.
- **Angular adapters** live in `libs/shared/ui-angular/` (alias
  `@test-project/shared-ui-angular`) and import core from
  `@test-project/shared-ui`.
- **Storybook** stays inside each UI lib (per-lib config) until a dedicated
  `apps/storybook` is requested.

## Branch / commit / PR naming

- Branch: `{ticket-lowercase}-{type}-{title-kebab}` e.g. `apd-1332-feat-implement-data-table`
- Commit: `{ticket-lowercase}-{type}-{title-kebab}` (same format, also conventional-commits compatible)
- PR title: `{TICKET-UPPER}: {type}({scope}): {human title}`
  e.g. `APD-1332: feat(shared-ui): implement data table component`

## Pipeline state

Each pipeline run writes to `.agent-run/{ticket_id}/context.json`.
At the start of every agent: read this file if it exists.
At the end of every agent: **merge** your output slice in — never overwrite.
```

---

## 6. New file: `.github/instructions/cross-framework-ui.instructions.md`

````markdown
---
applyTo: 'libs/shared/ui/**,libs/shared/ui-angular/**'
---

# Cross-framework UI component rules

These rules apply to all components that ship to both React and Angular consumers.
They are layered on top of `.github/instructions/wcag-aa.instructions.md`
(WCAG 2.1 AA is non-negotiable).

## 1. Three-layer architecture

| Layer           | Path                                             | Contains                                                                | Forbidden                            |
| --------------- | ------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------ |
| Core            | `libs/shared/ui/src/core/<kebab>/`               | TS types, pure logic, a11y helpers, `--ui-*` CSS tokens                 | React, Angular, JSX, decorators      |
| React adapter   | `libs/shared/ui/src/components/<Pascal>/`        | `.tsx`, optional `.module.css`, `.stories.tsx`, `.spec.tsx`             | Direct DOM manipulation outside refs |
| Angular adapter | `libs/shared/ui-angular/src/components/<kebab>/` | `.component.ts`, `.component.html`, `.component.spec.ts`, `.stories.ts` | Re-implementing logic from core      |

## 2. Theming contract (`--ui-*` custom properties)

- Every visual value (color, spacing, radius, font-size, line-height, shadow,
  z-index) MUST be expressed as a CSS custom property in the core CSS file.
- Naming: `--ui-<component>-<role>[-<state>]`.
  Examples: `--ui-button-bg`, `--ui-button-bg-hover`, `--ui-table-row-bg-selected`.
- The core CSS file provides **sensible defaults** but never absolute brand colors.
  Defaults reference shared tokens where possible:
  `--ui-button-bg: var(--color-surface-action, #2563eb);`
- Consumers override per-project via either of the following — both MUST work
  without modifying the library:

  **Tailwind (v4 arbitrary value):**

  ```html
  <button class="[--ui-button-bg:theme(colors.emerald.600)] [--ui-button-bg-hover:theme(colors.emerald.700)]">Save</button>
  ```

  **Vanilla CSS:**

  ```css
  .checkout-page .ui-button {
    --ui-button-bg: #059669;
    --ui-button-bg-hover: #047857;
  }
  ```

- The React adapter MAY use Tailwind utilities for layout (`flex`, `gap-2`,
  `px-4`) but never for component-defining colors or sizes — those are tokens.

## 3. Naming & exports

- Core files use kebab-case (`data-table.logic.ts`).
- React components use PascalCase (`DataTable.tsx`, named export only).
- Angular components use kebab-case files + PascalCase class
  (`data-table.component.ts` → `class DataTableComponent`).
- Every component re-exports through its parent `index.ts` barrel.
- Public API surface is documented in `libs/shared/ui/src/index.ts`.

## 4. Storybook stories — required per component

Minimum story set (mirror across React and Angular when both adapters exist):

| Story           | Purpose                                                      |
| --------------- | ------------------------------------------------------------ |
| `Default`       | Baseline render                                              |
| `AllVariants`   | One render per `variant` prop value                          |
| `AllStates`     | hover / focus / disabled / loading / error                   |
| `TailwindTheme` | Demonstrates overriding tokens via Tailwind arbitrary values |
| `CssTheme`      | Demonstrates overriding tokens via a `<style>` block         |
| `A11yShowcase`  | Keyboard nav + screen-reader notes in docs                   |

Use `tags: ['autodocs']` and meaningful `argTypes`.

## 5. Tests — required per component

- Unit test file co-located.
- Must include an axe-core audit (`jest-axe` / `@axe-core/react`) — 0 violations.
- One test per acceptance criterion from the ticket.
- Use `@testing-library/user-event` for interactions — never `.click()`.

## 6. Permitted runtime dependencies

Already in repo (use these, don't add alternatives):

- `clsx` + `tailwind-merge` (React class merging)
- `class-variance-authority` (variant prop → class mapping)
- `@tanstack/*` (table core / adapters)

Adding any new runtime dep requires the Architect agent to record a
justification in `architecture.dependency_additions[]`.
````

---

## 7. New file: `.agent-config.yml`

```yaml
# Fill in real values before running any agent.

jira:
  base_url: 'https://aristeksystems-team-f2twyvsi.atlassian.net'
  project_key: 'NGI'

confluence:
  base_url: 'https://aristeksystems-team-f2twyvsi.atlassian.net/wiki'
  space_key: 'teama3c89e31d5e646f0991ddfd70c5d5982'

figma:
  file_key: 'YOUR_FIGMA_FILE_KEY'

nx:
  react_ui_lib: 'shared-ui' # project name in nx
  react_ui_path: 'libs/shared/ui'
  react_components_dir: 'libs/shared/ui/src/components'
  react_core_dir: 'libs/shared/ui/src/core'
  angular_ui_lib: 'shared-ui-angular' # created on demand
  angular_ui_path: 'libs/shared/ui-angular'

git:
  default_branch: 'main'
  remote: 'origin'

# Naming rules
# Branch:   apd-1332-feat-implement-data-table
# Commit:   apd-1332-feat-implement-data-table
# PR title: APD-1332: feat(shared-ui): implement data table component
commit_type_map:
  Story: feat
  Feature: feat
  Bug: fix
  Test: test
  Task: chore
  Refactor: refactor
  Docs: docs
```

---

## 8. New file: `.vscode/mcp.json` (merge, don't clobber)

If `.vscode/mcp.json` already exists, the agent MUST read it and merge the
`servers` map — preserving any servers the user already configured.

```json
{
  "servers": {
    "jira": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-atlassian-jira"],
      "env": {
        "JIRA_URL": "${env:JIRA_BASE_URL}",
        "JIRA_EMAIL": "${env:JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${env:JIRA_API_TOKEN}"
      }
    },
    "confluence": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-atlassian-confluence"],
      "env": {
        "CONFLUENCE_URL": "${env:CONFLUENCE_BASE_URL}",
        "CONFLUENCE_EMAIL": "${env:JIRA_EMAIL}",
        "CONFLUENCE_API_TOKEN": "${env:JIRA_API_TOKEN}"
      }
    },
    "figma": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": { "FIGMA_ACCESS_TOKEN": "${env:FIGMA_ACCESS_TOKEN}" }
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${env:GITHUB_TOKEN}" }
    },
    "chrome-devtools": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"]
    }
  }
}
```

`.vscode/settings.json` — MERGE these keys, don't replace the file:

```json
{
  "github.copilot.chat.agent.enabled": true,
  "chat.mcp.enabled": true
}
```

---

## 9. Prompt files

Each prompt below is its own `.github/prompts/*.prompt.md` file. They share
the following conventions:

- `mode: agent` frontmatter enables tool use.
- The `tools:` list is the **permission boundary** — keep it minimal.
- Every agent reads/merges `.agent-run/{ticket_id}/context.json`.
- Agents reference the platform skills (`nx-workspace`, `nx-generate`,
  `nx-run-tasks`, `frontend-react-best-practices`, `browser-testing-with-devtools`)
  by name — Copilot loads them automatically.

---

### `.github/prompts/00-orchestrate.prompt.md`

```markdown
---
description: Orchestrates the full component pipeline for a Jira ticket.
mode: agent
model: Claude Opus 4.6
tools: ['codebase', 'editFiles', 'runCommands']
---

# Orchestrator

Ask the user for the Jira ticket ID if not provided. Determine whether the
ticket requires React only, Angular only, or both (default: React only unless
the ticket explicitly mentions Angular, the Figma page is tagged "angular",
or the user says otherwise — confirm with the user before assuming).

Run each phase in order, passing context via
`.agent-run/{ticket_id}/context.json`. Load each prompt with
`#file:.github/prompts/<filename>`.

PHASE 1 — parallel:
#file:.github/prompts/01-requirements.prompt.md
#file:.github/prompts/02-design-inspector.prompt.md

PHASE 2:
#file:.github/prompts/03-architect.prompt.md

PHASE 3 — implementation (sequential, only run adapters the ticket needs):
#file:.github/prompts/04-implement-core.prompt.md (always)
#file:.github/prompts/05-implement-react.prompt.md (if frameworks includes react)
#file:.github/prompts/06-implement-angular.prompt.md (if frameworks includes angular)

PHASE 4 — QA loop (max 3 iterations across all implemented adapters):
#file:.github/prompts/07-qa.prompt.md
If qa.passed is false AND iteration < 3: re-run the relevant implement-\* prompts
with qa feedback, then re-run QA.
If qa.passed is false AND iteration == 3: stop, report to user.

PHASE 5:
#file:.github/prompts/08-pr-creator.prompt.md

PHASE 6:
#file:.github/prompts/09-code-reviewer.prompt.md

Rules:

- Log each phase start/end to `.agent-run/{ticket_id}/pipeline.log`.
- On fatal error: stop, surface error clearly.
- Never touch files outside `.agent-run/`, the component paths, or
  `apps/web-client/src/styles/` (for per-project theme overrides).
- Final output to user: PR URL, review outcome, QA score, list of adapters built.
```

---

### `.github/prompts/01-requirements.prompt.md`

```markdown
---
description: Reads the Jira ticket and relevant Confluence pages. Phase 1 (parallel with design-inspector).
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles']
# Add MCP tools when available in your Copilot setup: jira, confluence.
---

PERMITTED: Jira MCP (read-only), Confluence MCP (read-only),
filesystem write to `.agent-run/` only.
FORBIDDEN: git, Figma, source files outside `.agent-run/`.

You receive a Jira ticket ID (e.g. APD-1332). Ask if missing.

STEP 1 — Fetch the Jira ticket. Extract:
id, type (mapped via .agent-config.yml commit_type_map),
title, title_kebab (lowercase, hyphens, ≤50 chars),
description, acceptance_criteria[], labels[],
frameworks[] — infer from labels/description: ["react"], ["angular"], or both.

STEP 2 — Search Confluence for pages matching the ticket title and component
name. Fetch top 3. Store { title, url, summary (2–3 sentences) }.

STEP 3 — Read `.agent-run/{id}/context.json` (create dir if needed).
Merge your output under keys `ticket` and `confluence`. Write back.

Output: "Requirements complete for {id}. Frameworks: {frameworks}. Title kebab: {title_kebab}."
```

---

### `.github/prompts/02-design-inspector.prompt.md`

```markdown
---
description: Extracts design tokens, variants, states, and assets from Figma. Phase 1 (parallel).
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles']
# Add MCP tools when available: figma.
---

PERMITTED: Figma MCP (read-only), filesystem write to `.agent-run/` only.
FORBIDDEN: git, Jira, Confluence, source files.

Read `.agent-run/{ticket_id}/context.json` for `ticket.title` and
`ticket.title_kebab`. Read `.agent-config.yml` for the Figma file key.

STEP 1 — Search the Figma file for a component matching `ticket.title`
(case-insensitive, partial). If multiple, pick the closest by name + size.

STEP 2a — If FOUND, extract:
component_name, figma_node_id, figma_url
tokens.colors { name: "hex/rgba" }
tokens.spacing { name: "Npx" }
tokens.typography { name: { family, size, weight, lineHeight, letterSpacing } }
tokens.border_radius { name: "Npx" }
tokens.shadows { name: "CSS box-shadow string" }
variants[], states[], dimensions { width, height }
assets[] [{ name, url }]

CRITICAL: extract REAL values (actual hex, real px). The implementer will
translate them into `--ui-<component>-*` custom properties — see
`.github/instructions/cross-framework-ui.instructions.md` §2.

STEP 2b — If NOT FOUND: set figma_node_id=null, capture global file styles
as fallback, add `design.not_found_note`.

STEP 3 — Merge under key `design` into context.json.

Output: "Design inspection complete. Component: {component_name}. Variants: {variants}."
```

---

### `.github/prompts/03-architect.prompt.md`

```markdown
---
description: Plans file structure, semantic HTML, ARIA, WCAG 2.1 AA, and cross-framework split. Phase 2.
mode: agent
model: Claude Opus 4.7
tools: ['codebase', 'editFiles', 'runCommands', 'fetch']
# Plus: nx MCP (read-only), w3.org fetch allowed.
---

PERMITTED: filesystem read (full repo), Nx MCP (read-only: list projects,
show graph, list generators), `fetch` to `https://www.w3.org/*`,
filesystem write to `.agent-run/` only.
FORBIDDEN: git, Jira, Figma, source file writes.

Invoke the `nx-workspace` skill to inspect projects and tags before planning.

Read `.agent-run/{ticket_id}/context.json` (ticket, design, confluence).
Read `.github/copilot-instructions.md`, `AGENTS.md`,
`.github/instructions/cross-framework-ui.instructions.md`, and
`.github/instructions/wcag-aa.instructions.md`. All rules there are mandatory.

### Step 1 — Existence check

Scan `libs/shared/ui/src/core/<kebab>/`, `libs/shared/ui/src/components/<Pascal>/`,
and `libs/shared/ui/src/lib/` for an existing component matching
`design.component_name` (exact, then fuzzy).

If EXISTS:
component_exists: true
existing_paths: [...]
Plan only the diff — do NOT plan a recreate.

If NOT EXISTS:
component_exists: false
Plan the canonical structure (see cross-framework-ui.instructions.md §1).

### Step 2 — Frameworks & libraries

From `ticket.frameworks`:

react: existing lib `@test-project/shared-ui`, no generator needed.

angular (if requested): - Check `package.json` for `@nx/angular`. - If missing: planned action `pnpm nx add @nx/angular`. - If `libs/shared/ui-angular/` does not exist: planned generator:
`pnpm nx g @nx/angular:library shared-ui-angular \
        --publishable --importPath=@test-project/shared-ui-angular \
        --directory=libs/shared/ui-angular --no-interactive` - Tags: `["scope:shared", "type:ui", "framework:angular"]`. - Note in `architecture.storybook_recommendation`: now that two UI libs
exist, evaluate consolidating Storybook into `apps/storybook/` (see
`agent-pipeline-meta-prompt.md` §3).

### Step 3 — Semantic HTML root

Data grid → `<table>` + `<thead>`/`<tbody>` + `<th scope>`
Navigation → `<nav>` + `<ul>`
Form → `<form>` + `<fieldset>` + `<legend>`
Disclosure → `<details>` + `<summary>`
Tabs → `role="tablist"` + `role="tab"` + `role="tabpanel"`
Modal → `<dialog>`
Card / list item → `<article>` or `<li>` with button inside
Button → `<button type="button">`

Set `architecture.semantic_html` { root, rationale, aria_roles{} }.

### Step 4 — Theming tokens (`--ui-*`)

From `design.tokens`, plan the full set of `--ui-<component>-*` custom
properties (defaults + variant/state overrides). Document the override
surface consumers will use (Tailwind arbitrary values + plain CSS).

### Step 5 — WCAG 2.1 AA requirements

If unsure about a criterion, fetch `https://www.w3.org/TR/WCAG21/#{anchor}` first.

Always cover: 1.1.1, 1.3.1, 1.3.2, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.1.2,
2.4.3, 2.4.7, 4.1.2, 4.1.3.

Store as `architecture.wcag_requirements`:
[{ criterion, level: "AA", implementation_note }]

### Step 6 — File plan

Per framework, emit `architecture.file_plan` listing every file to create or
modify with a 1-line purpose. Mark `tests`, `stories`, `core`, `adapter`.

### Step 7 — Write

Merge `architecture` slice into context.json. Do NOT write component files.

Output: "Architecture complete. Exists: {component_exists}. Frameworks: {frameworks}. WCAG criteria: {count}."
```

---

### `.github/prompts/04-implement-core.prompt.md`

```markdown
---
description: Builds the framework-agnostic core slice (types, logic, --ui-* CSS tokens). Phase 3 (always runs first).
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles', 'runCommands']
---

PERMITTED:
filesystem read+write: `libs/shared/ui/src/core/<kebab>/**` + `.agent-run/`
filesystem read-only: rest of repo
terminal: `pnpm nx lint shared-ui`, `pnpm nx test shared-ui` (scoped)
FORBIDDEN: writing anything under `components/`, Angular paths, or git.

Read context.json (ticket, design, architecture). If `qa.feedback_for_core`
exists, fix every listed issue first.

Invoke the `nx-generate` skill if a generator is needed for file scaffolding.

Create per `architecture.file_plan` (core entries):

- `<kebab>.types.ts` ← all public types & prop contracts
- `<kebab>.logic.ts` ← pure functions, state reducers, formatters
- `<kebab>.a11y.ts` ← keyboard maps, ARIA computation helpers
- `<kebab>.css` ← full `--ui-<component>-*` token surface
  with sensible defaults referencing shared tokens
- `index.ts` ← barrel

Rules:

- NO `import React`, NO `@angular/*`, NO JSX, NO decorators.
- Every visual value is a CSS custom property in `<kebab>.css`. Defaults
  use `var(--color-*, <fallback>)` form so consumers can override at any level.
- Provide variant + state token overrides:
  `.ui-<kebab>[data-variant="primary"] { --ui-<kebab>-bg: ...; }`
  `.ui-<kebab>:hover { --ui-<kebab>-bg: var(--ui-<kebab>-bg-hover); }`

Run `pnpm nx lint shared-ui` and `pnpm nx test shared-ui` (filter to core
files). All green before completing.

Merge `implementation.core` { files_created[], files_modified[] } into context.json.

Output: "Core complete. Files: {count}. Tokens: {token_count}. Lint/tests: clean."
```

---

### `.github/prompts/05-implement-react.prompt.md`

```markdown
---
description: Builds the React adapter + Storybook stories + tests pixel-perfect against Figma. Phase 3.
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles', 'runCommands']
# Plus: chrome-devtools MCP (read-only) for pixel/a11y verification.
---

PERMITTED:
filesystem read+write: `libs/shared/ui/src/components/<Pascal>/**`,
`libs/shared/ui/src/index.ts`, `.agent-run/`
filesystem read-only: rest of repo
terminal: `pnpm nx lint shared-ui`, `pnpm nx test shared-ui`,
`pnpm nx storybook shared-ui` (background only),
`pnpm nx build shared-ui`
chrome-devtools MCP: read-only (computed styles, axe-core, dimensions)
FORBIDDEN: git, Angular paths, source files outside the component path.

Apply the `frontend-react-best-practices` skill throughout.

Read context.json. If `qa.feedback_for_react` exists, fix those first.

## Pass 1 — Files

Create per `architecture.file_plan` (react entries):

- `<Pascal>.tsx` ← thin adapter, imports core logic + css
- `<Pascal>.module.css` ← only if local-scope styles needed
- `<Pascal>.stories.tsx` ← required story set (see §6 of cross-framework instructions)
- `<Pascal>.spec.tsx` ← unit + axe audit + one test per acceptance criterion
- `index.ts` ← barrel
  Update `libs/shared/ui/src/index.ts` to re-export.

## Pass 2 — Implementation rules (strict order)

1. Import core types, logic, a11y helpers from `../../core/<kebab>`.
2. Import core CSS once at module top: `import '../../core/<kebab>/<kebab>.css'`.
3. Root element matches `architecture.semantic_html.root` exactly.
4. Add `className="ui-<kebab>"` + `data-variant`/`data-state` attributes so
   consumers can hook in via Tailwind arbitrary variants or plain CSS.
5. Apply every entry in `architecture.semantic_html.aria_roles`.
6. Variants implemented via `class-variance-authority` (cva) mapped to
   `data-variant` attributes — NOT inline styles. Class merging via `clsx` +
   `tailwind-merge` (already in deps).
7. NEVER hardcode hex / px. Use `var(--ui-<kebab>-*)` only.
8. Keyboard: Tab/Shift+Tab, Enter+Space, Arrow keys (composite widgets),
   Escape (dismiss).
9. Implement every `architecture.wcag_requirements` note.

## Pass 3 — Storybook (mandatory story set)

Stories: `Default`, `AllVariants`, `AllStates`, `TailwindTheme`, `CssTheme`,
`A11yShowcase`. Use `tags: ['autodocs']`. The `TailwindTheme` story
demonstrates `className="[--ui-<kebab>-bg:theme(colors.emerald.600)]"`.
The `CssTheme` story uses a `<style>` block overriding `--ui-<kebab>-*`.

## Pass 4 — Self-review

[ ] No hardcoded colors / pixels in adapter or stories
[ ] No `<div>` where a semantic element was specified
[ ] Every interactive element has an accessible name
[ ] No positive `tabIndex`
[ ] Named exports only
[ ] Component exported from `libs/shared/ui/src/index.ts`
[ ] No `console.log` / `// TODO` / `any`

## Pass 5 — Verify

`pnpm nx lint shared-ui`
`pnpm nx test shared-ui --testFile=<Pascal>.spec.tsx`
`pnpm nx build shared-ui`

All must pass. Fix until clean.

## Pass 6 — DevTools check (uses browser-testing-with-devtools skill)

Start Storybook in background, open the `Default` story. Verify:

- Rendered dimensions vs `design.dimensions` (≤ 2px tolerance)
- Computed colors match `design.tokens.colors`
- Visible focus ring on every interactive element
- axe-core: 0 violations

Merge `implementation.react` { files_created[], files_modified[], test_files[] }
into context.json.

Output: "React adapter complete. Files: {count}. Tests/lint/build: clean."
```

---

### `.github/prompts/06-implement-angular.prompt.md`

```markdown
---
description: Builds the Angular adapter + Storybook stories + tests. Phase 3 — only when ticket requires Angular.
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles', 'runCommands']
# Plus: chrome-devtools MCP (read-only).
---

PERMITTED:
filesystem read+write: `libs/shared/ui-angular/**`, `.agent-run/`
filesystem read-only: rest of repo
terminal: `pnpm nx add @nx/angular` (only if missing),
`pnpm nx g @nx/angular:library …` (only on first run),
`pnpm nx g @nx/storybook:configuration shared-ui-angular …` (only on first run),
`pnpm nx lint shared-ui-angular`,
`pnpm nx test shared-ui-angular`,
`pnpm nx build shared-ui-angular`,
`pnpm nx storybook shared-ui-angular` (background)
chrome-devtools MCP: read-only.
FORBIDDEN: git, React paths, core paths (use them read-only via the package alias).

Read context.json. If `qa.feedback_for_angular` exists, fix those first.

## Pass 1 — Bootstrap (skip if already done)

1. If `@nx/angular` missing in `package.json`: `pnpm nx add @nx/angular`.
2. If `libs/shared/ui-angular/` missing: run the generator from
   `architecture.angular_generator_command`.
3. If Storybook missing for the lib: configure via `@nx/storybook:configuration`.

## Pass 2 — Files

Create per `architecture.file_plan` (angular entries):

- `<kebab>.component.ts` ← standalone component, imports core
- `<kebab>.component.html` ← template using `class="ui-<kebab>"` + `[attr.data-variant]`
- `<kebab>.component.spec.ts` ← @testing-library/angular + jest-axe
- `<kebab>.stories.ts` ← required story set, mirror React names
- Update `libs/shared/ui-angular/src/index.ts`.

## Pass 3 — Implementation rules

- Import types & logic from `@test-project/shared-ui` (the core barrel
  re-exports them).
- Import the core CSS once via the component's `styleUrls` OR via Storybook
  `preview.ts` — whichever yields a single source of truth.
- Root element matches `architecture.semantic_html.root`. Same aria_roles.
- NEVER duplicate logic that exists in core. Wrap it.
- Theming: same `--ui-<kebab>-*` overrides work — consumers can apply them
  via global stylesheets or component-level `[style]` bindings.
- Standalone components by default (Angular 17+).

## Pass 4 — Verify

`pnpm nx lint shared-ui-angular`
`pnpm nx test shared-ui-angular`
`pnpm nx build shared-ui-angular`

## Pass 5 — DevTools check

Storybook → verify dimensions, colors, focus ring, axe 0 violations.

Merge `implementation.angular` slice into context.json.

Output: "Angular adapter complete. Files: {count}. Tests/lint/build: clean."
```

---

### `.github/prompts/07-qa.prompt.md`

```markdown
---
description: Verifies pixel accuracy, WCAG, semantic HTML, keyboard nav across all built adapters. Phase 4.
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles']
# Plus: chrome-devtools MCP (read-only).
---

PERMITTED: chrome-devtools MCP (read-only),
filesystem read (component paths),
filesystem write (`.agent-run/` only).
FORBIDDEN: source file writes, git.

Use the `browser-testing-with-devtools` skill.

Read context.json (which adapters were built: react / angular).

For each adapter that was built, in its Storybook preview:

### Check 1 — Pixel accuracy (per variant story)

Compare dimensions to `design.dimensions` (≤ 2px).
Computed colors vs `design.tokens.colors` (exact hex).
Computed font + spacing vs tokens.
Score `pixel_diff_score` (0–100).
Failures → `pixel_diff_notes[]` { selector, property, expected, actual,
adapter: "react" | "angular" }.

### Check 2 — Accessibility (axe + tree)

Run axe-core. Dump accessibility tree.
`wcag_violations[]` { wcag_criterion, element_selector, description,
fix_suggestion, adapter }.
Confirm every `architecture.wcag_requirements` note is applied.

### Check 3 — Semantic HTML

Re-read adapter source. Root matches `architecture.semantic_html.root`?
No `<div>` where a semantic element was required? Heading levels not skipped?

### Check 4 — Keyboard

Simulate Tab. Verify logical order, visible focus indicator,
Enter/Space activation, Escape dismissal where applicable.

### Check 5 — Token override smoke test

Open the `TailwindTheme` and `CssTheme` stories. Verify computed colors
actually change vs `Default`. Failure → `theming_violations[]`.

### Decision

If for ALL adapters: `pixel_diff_score >= 90` AND `wcag_violations` empty
AND `theming_violations` empty:
qa.passed = true
Else:
qa.passed = false
Bucket fixes into `qa.feedback_for_core`, `qa.feedback_for_react`,
`qa.feedback_for_angular` with concrete fix_suggestion entries.

Merge `qa` slice into context.json.

Output: "QA pass {passes}. Scores: react={r}/100 angular={a}/100. Violations: {n}. Passed: {passed}."
```

---

### `.github/prompts/08-pr-creator.prompt.md`

````markdown
---
description: Creates branch, commit, and GitHub PR with correct naming. Phase 5.
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles', 'runCommands']
# Plus: github MCP, jira MCP.
---

PERMITTED:
terminal: `git status`, `git checkout -b`, `git add` (scoped only),
`git commit`, `git push`
GitHub MCP: create PR, add labels, assign reviewers
Jira MCP: read-only + transition to "In Review"
filesystem read-only scoped to changed component paths.
FORBIDDEN: stage `.env*`, `node_modules`, build outputs, `.agent-run/`.

Read context.json. Read `.agent-config.yml`.

## Naming

Branch: {ticket.id.toLowerCase()}-{ticket.type}-{ticket.title_kebab}
Commit: {ticket.id.toLowerCase()}-{ticket.type}-{ticket.title_kebab}
PR title: {TICKET_ID_UPPER}: {ticket.type}({scope}): {human title}
scope = "shared-ui" if only react, "shared-ui-angular" if only angular,
"ui" if both.

Examples:
Branch: apd-1332-feat-implement-data-table
Commit: apd-1332-feat-implement-data-table
PR title: APD-1332: feat(ui): implement data table component

Rules: all lowercase in branch/commit, hyphens only, ≤72 chars.

## PR body template

```
## {ticket.id} — {ticket.title}

**Jira:** [{ticket.id}]({jira_base_url}/browse/{ticket.id})
**Figma:** [{design.component_name}]({design.figma_url})

### Adapters built
{implementation.* keys as bullet list, e.g. - core, - react, - angular}

### What changed
{2–4 sentence summary from ticket.description}

### Files
{implementation.*.files_created as bullet list, grouped per adapter}

### Theming
Consumers override per-project via Tailwind arbitrary values or plain CSS
targeting the `--ui-<component>-*` custom properties. See the `TailwindTheme`
and `CssTheme` Storybook stories.

### WCAG compliance
{architecture.wcag_requirements as bullets: **{criterion}**: {implementation_note}}

### QA
- React pixel score: {qa.pixel_diff_score.react}/100
- Angular pixel score: {qa.pixel_diff_score.angular}/100 (if built)
- a11y violations: {qa.wcag_violations.length}
- Passes needed: {qa.passes}

### Tests
{implementation.*.test_files as bullet list}
All tests: ✅

### Checklist
- [x] Follows copilot-instructions.md + cross-framework-ui.instructions.md
- [x] Semantic HTML verified
- [x] WCAG 2.1 AA compliant
- [x] Token override surface tested (Tailwind + CSS)
- [x] Unit tests passing (axe audit included)
- [x] Storybook stories added (Default, AllVariants, AllStates, TailwindTheme, CssTheme, A11yShowcase)
- [x] No console.log / TODOs / any
```

## Steps

1. `git status` — if any forbidden path is dirty: STOP and ask the user.
2. `git checkout -b {branch_name}` from `git.default_branch`.
3. `git add` ONLY files in `implementation.*.files_created` + `files_modified`
   - `test_files` + Storybook stories.
4. `git commit -m "{commit_message}"`.
5. `git push origin {branch_name}`.
6. Create PR via GitHub MCP. Label = ticket.type. Reviewer = `PR_REVIEWER` env.
7. Transition Jira to "In Review" (skip if unavailable).
8. Set `pr.branch`, `pr.commit_message`, `pr.pr_url`, `pr.pr_number`. Merge.

Output: "PR created: {pr_url}"
````

---

### `.github/prompts/09-code-reviewer.prompt.md`

```markdown
---
description: Reviews the PR for correctness, a11y, React/Angular best practices, CSS quality, tests. Phase 6.
mode: agent
model: Claude Opus 4.6
tools: ['codebase']
# Plus: github MCP (read PR diff + post comments + submit review).
---

PERMITTED: GitHub MCP (read PR diff + file contents + post comments + submit review),
filesystem read-only scoped to component paths.
FORBIDDEN: modify any files, run git commands.

Apply the `frontend-react-best-practices` skill for React-side review.

Read context.json. Fetch the PR diff via GitHub MCP using `pr.pr_number`.

For every finding, post an inline GitHub review comment with:

- file path + line number
- severity: error | warning | suggestion
- concrete fix showing corrected code

Severity:
error — must fix before merge (correctness, security, accessibility,
theming-contract violation)
warning — should fix (maintainability, perf)
suggestion — nice to have

## Review checklist (in priority order)

### 1. Accessibility — errors only

- Every aria-\* has a valid non-empty value
- aria-labelledby targets exist in DOM
- role="button" elements have onClick AND key handlers (Enter+Space)
- Images: meaningful alt or aria-hidden
- Focus management in dialogs: trap on open, restore on close
- aria-live for async / dynamic content
- No positive tabIndex

### 2. Cross-framework contract

- Core has zero React/Angular imports
- Adapters re-use core logic — no duplicated business rules
- No hardcoded colors / pixels anywhere (must be `var(--ui-*-*)`)
- `ui-<kebab>` className present on root for consumer hooks
- Token override stories actually demonstrate Tailwind + CSS paths

### 3. Correctness

- Props match the TS interface in tests + stories
- No unchecked access on possibly-undefined values
- Edge cases: empty, null, loading, error
- useEffect cleanup (listeners, subscriptions, timers)
- List items have stable keys (not array index if reorderable)

### 4. React / TypeScript

- No prop drilling > 2 levels — suggest context/composition
- `useCallback`/`useMemo` only where a real perf need exists
- Effect deps complete (no stale closures)
- Components ≤ 200 lines, ≤ 5 responsibilities
- No `any` — suggest specific type or `unknown` + narrowing
- Named exports only

### 5. Angular (when applicable)

- Standalone components
- `OnPush` change detection
- `trackBy` on `*ngFor`
- No subscriptions without `takeUntilDestroyed()` / async pipe
- DI tokens for cross-cutting concerns

### 6. CSS / Styling

- No hardcoded hex / px in component CSS — only `var(--ui-*)`
- No `!important`
- Responsive: relative units / media queries for layout
- `z-index` values commented with stacking context

### 7. Testing

- `@testing-library/user-event` for interactions
- No assertions on implementation details
- Each acceptance criterion has at least one test
- axe audit present

### 8. Performance

- No heavy work in render path (sort/filter/transform → useMemo/computed)
- Images: explicit width/height

## Submit review

If 0 errors: APPROVE with a 1-paragraph summary + any warnings.
If errors: REQUEST_CHANGES listing each blocker as numbered list.

Set `review.approved`, `review.comments`, `review.summary`. Merge.

Output: "Review submitted. {APPROVED / CHANGES REQUESTED}. Comments: {count}."
```

---

## 10. Which Claude model to CREATE these files?

**Use Claude Sonnet 4.6 to run this meta-prompt.**

Generating these files is structured code generation from a complete spec —
exactly Sonnet 4.6's sweet spot (fast, accurate, doesn't over-think).

**Model assignments inside the pipeline** (already set in each prompt
frontmatter):

| Phase               | Model               | Why                                                                                       |
| ------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| 00 Orchestrate      | Claude Opus 4.6     | Top-level routing + decision when to loop; benefits from broader judgement                |
| 01 Requirements     | Claude Sonnet 4.6   | Structured extraction from Jira/Confluence                                                |
| 02 Design Inspector | Claude Sonnet 4.6   | Structured extraction from Figma                                                          |
| 03 Architect + WCAG | **Claude Opus 4.7** | Hardest reasoning: semantic HTML choice, ARIA pattern, WCAG mapping, dependency tradeoffs |
| 04 Core impl        | Claude Sonnet 4.6   | Token + types generation; constrained                                                     |
| 05 React impl       | Claude Sonnet 4.6   | Pattern-following adapter work                                                            |
| 06 Angular impl     | Claude Sonnet 4.6   | Pattern-following adapter work                                                            |
| 07 QA               | Claude Sonnet 4.6   | Structured comparisons; mechanical                                                        |
| 08 PR Creator       | Claude Sonnet 4.6   | Templated git + GitHub flow                                                               |
| 09 Code Reviewer    | Claude Opus 4.6     | Open-ended quality judgement; comment quality matters                                     |

Sonnet 4.5 is not used here — 4.6 is uniformly better at tool use and
instruction-following, at the same speed.

**Yes, the Architect agent may visit `w3.org`** — that's the canonical
WCAG / WAI-ARIA reference. Restrict its `fetch` permission to
`https://www.w3.org/*` so it can't browse arbitrary URLs.

---

## 11. New file: `.gitignore` — append

```
.agent-run/
```

---

## 12. New file: `README-agents.md`

````markdown
# Component pipeline — quick start

## Prerequisites

1. Set environment variables (e.g. via `.env.local` — never commit):

   ```
   JIRA_BASE_URL=https://aristeksystems-team-f2twyvsi.atlassian.net
   JIRA_EMAIL=you@yourorg.com
   JIRA_API_TOKEN=your_atlassian_api_token
   CONFLUENCE_BASE_URL=https://aristeksystems-team-f2twyvsi.atlassian.net/wiki
   FIGMA_ACCESS_TOKEN=your_figma_token
   GITHUB_TOKEN=your_github_pat
   PR_REVIEWER=github_username   # optional
   ```

2. Fill in real values in `.agent-config.yml`.

3. Verify MCP servers in `.vscode/mcp.json` are reachable. The first run
   installs them via `npx`. In VS Code → Copilot Chat → tools icon, confirm
   `jira`, `confluence`, `figma`, `github`, `chrome-devtools` are present.

4. Ensure Storybook is running before Phase 3/4:
   ```bash
   pnpm nx storybook shared-ui
   # and (if Angular adapter was built):
   pnpm nx storybook shared-ui-angular
   ```

## Run the full pipeline

1. Copilot Chat → Agent mode → select **Claude Opus 4.6** (Orchestrator's model).
2. Type:
   ```
   /00-orchestrate
   ```
   or
   ```
   #file:.github/prompts/00-orchestrate.prompt.md
   ```
   Then provide the ticket ID (e.g. `APD-1332`).

## Run individual agents

1. Agent mode → select the model named in the prompt's frontmatter.
2. Type `/01-requirements` (or any other phase shortcut).

## Resume a failed run

State is at `.agent-run/{ticket_id}/context.json`. Re-run only the failed
phase — it reads existing context and continues.

## Troubleshooting

| Symptom                    | Fix                                                          |
| -------------------------- | ------------------------------------------------------------ |
| MCP server not appearing   | Restart VS Code; verify `.vscode/mcp.json` syntax.           |
| Jira auth fails            | Use an Atlassian API token (not your password).              |
| Figma component not found  | Check `FIGMA_FILE_KEY` matches the ID in the Figma URL.      |
| DevTools timeout           | Ensure Storybook is running before Phase 3 (React) / 4 (QA). |
| Angular plugin missing     | The Architect plans `pnpm nx add @nx/angular`; let it run.   |
| QA loops 3 times and fails | Inspect `qa.feedback_for_*` in context.json.                 |
````

---

## 13. After generation — sanity checklist

The agent that runs this meta-prompt MUST print this checklist as its final
message, with each box ticked:

- [ ] Read existing instruction files; did not overwrite them.
- [ ] Appended (not replaced) the new section in `.github/copilot-instructions.md`.
- [ ] Created `.github/instructions/cross-framework-ui.instructions.md`.
- [ ] Created all 10 prompt files under `.github/prompts/`.
- [ ] Merged (not clobbered) `.vscode/mcp.json` and `.vscode/settings.json`.
- [ ] Created `.agent-config.yml`, `.agent-run/.gitkeep`, `README-agents.md`.
- [ ] Appended `.agent-run/` to `.gitignore`.
- [ ] Did NOT install any npm package (that's the runtime pipeline's job).
- [ ] Did NOT make any git commit / push.
- [ ] Reported any file it skipped because it already existed.

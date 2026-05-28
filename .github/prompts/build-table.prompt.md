---
mode: agent
description: Scaffold the @test-project/table-core + React adapter + Angular adapter from a Figma mockup, with Storybook stories
tools:
  - figma # Figma MCP — extract design tokens + component specs
  - codebase # Read existing workspace files
  - editFiles # Write/edit source files
  - runCommands # Run pnpm nx generate, pnpm install, storybook commands
  - search # Search workspace for existing patterns
---

# Build @test-project Data Table — full scaffold with Storybook

You are scaffolding a data-table library inside an existing NX monorepo.
Follow **both** of these instruction files for all architectural decisions,
naming rules, WCAG requirements, and CSS token contracts:

- `.github/instructions/wcag-aa.instructions.md` — shared WCAG 2.1 AA rules
- `.github/instructions/table-library.instructions.md` — table-specific rules

Do NOT deviate from those instructions.

### Architecture overview

| Package                   | Location                    | Import path                       |
| ------------------------- | --------------------------- | --------------------------------- |
| Core (types + CSS tokens) | `libs/table/core/`          | `@test-project/table-core`        |
| React adapter             | `libs/shared/ui/src/table/` | Part of `@test-project/shared-ui` |
| Angular adapter           | `libs/table/angular/`       | `@test-project/table-angular`     |

---

## Step 0 — Prerequisite: Add Angular plugin

If `@nx/angular` is not already installed, add it:

```bash
pnpm nx add @nx/angular
```

---

## Step 1 — Read the Figma mockup

Use the Figma MCP tool to fetch the design file at the link the user provides.

```
Get the Figma file and look for:
1. The "Table" component set (or page named "Table / Data Grid")
2. All component states: default, hover, selected row, loading/skeleton,
   empty state, sorted column (asc + desc), disabled row
3. Pagination component states: default, first page, last page
4. Toolbar component (if present): search input, column visibility toggle
5. All design tokens used: fill colors, text colors, font sizes, font weights,
   spacing values, border radii, border colors
```

Map every extracted Figma value to a `--dt-*` CSS custom property override.
Write the overrides to `apps/web-client/src/styles/table-theme.css`
(NOT inside the library itself).

If a Figma node contains a custom cell design (status badge, avatar+name,
action menu, etc.), generate a matching cell renderer component:

- React: `libs/shared/ui/src/table/components/cells/<Name>Cell.tsx`
- Angular: `libs/table/angular/src/components/cells/<name>-cell.component.ts`

Export both from the library's public `index.ts`.

---

## Step 2 — Generate the NX libraries (if not yet created)

Run each generator only if the library does not already exist.
The React adapter lives inside the existing `shared-ui` library — no
separate generator needed; just create the files under
`libs/shared/ui/src/table/`.

```bash
# Core (framework-agnostic logic + types + CSS tokens)
pnpm nx g @nx/js:library table-core \
  --publishable \
  --importPath=@test-project/table-core \
  --bundler=tsc \
  --unitTestRunner=vitest \
  --directory=libs/table/core \
  --no-interactive

# Angular adapter
pnpm nx g @nx/angular:library table-angular \
  --publishable \
  --importPath=@test-project/table-angular \
  --buildable \
  --unitTestRunner=jest \
  --directory=libs/table/angular \
  --no-interactive
```

After generating, ensure both `project.json` files carry:

```json
{ "tags": ["scope:table", "type:lib", "publishable:true"] }
```

---

## Step 3 — Install dependencies

```bash
pnpm add @tanstack/table-core @tanstack/react-table @tanstack/angular-table
pnpm add -D @testing-library/react @testing-library/jest-dom vitest
pnpm add -D @testing-library/angular jest
pnpm add -D axe-core @axe-core/react
```

---

## Step 4 — Scaffold source files

Create every file listed in the folder structure from the instructions.
Key files to generate:

### libs/table/core/src/

- `types/table.types.ts` — full DataTableConfig + ColumnMeta augmentation
- `types/column.types.ts`
- `defaults/pagination-defaults.ts`
- `defaults/column-defaults.ts`
- `styles/table.css` — full `--dt-*` token set
- `styles/tokens.css`
- `index.ts` — barrel export

### libs/shared/ui/src/table/ (React adapter)

- `components/DataTable/DataTable.tsx` — main component
- `components/DataTable/DataTable.test.tsx` — includes axe audit
- `components/TableHeader/TableHeader.tsx` — aria-sort + scope
- `components/TableBody/TableBody.tsx` — skeleton rows + empty state
- `components/TablePagination/TablePagination.tsx` — aria-live + aria-current
- `components/TableToolbar/TableToolbar.tsx` — search + column visibility
- `hooks/useDataTable.ts`
- `index.ts` — barrel export, also re-export from `libs/shared/ui/src/index.ts`

### libs/table/angular/src/

- `components/data-table/data-table.component.ts`
- `components/data-table/data-table.component.html`
- `components/data-table/data-table.component.spec.ts`
- `components/table-header/...`
- `components/table-body/...`
- `components/table-pagination/...`
- `components/table-toolbar/...`
- `table.module.ts`
- `index.ts`

---

## Step 5 — Set up Storybook

### React — reuse existing shared-ui Storybook

The workspace already has Storybook configured for `shared-ui`.
Add table stories to the existing Storybook instance — do NOT create a
separate Storybook for the React table adapter.

Create story files in `libs/shared/ui/src/table/components/DataTable/`:

#### Required stories (minimum set)

Each story file must include at least these variants:

| Story name         | Purpose                                               |
| ------------------ | ----------------------------------------------------- |
| `Default`          | Basic table with columns and data                     |
| `WithPagination`   | Client-side pagination enabled                        |
| `WithSorting`      | Sortable columns                                      |
| `WithRowSelection` | Checkbox row selection                                |
| `WithToolbar`      | Search + column visibility                            |
| `KitchenSink`      | All features combined                                 |
| `Loading`          | Skeleton state                                        |
| `Empty`            | Empty data message                                    |
| `ServerSide`       | Manual pagination + manual sorting                    |
| `CustomTheme`      | Override `--dt-*` CSS custom properties via decorator |

Use `autodocs` tag and include meaningful `argTypes` for `caption`,
`loading`, `toolbar`, and `captionHidden`.

### Angular Storybook

```bash
pnpm nx g @nx/storybook:configuration table-angular \
  --uiFramework=@storybook/angular \
  --interactionTests=true \
  --no-interactive
```

Create matching story set in
`libs/table/angular/src/components/data-table/data-table.component.stories.ts`.
Mirror the React stories for side-by-side comparison.

---

## Step 6 — Add a framework comparison page

Create `libs/shared/ui/src/table/TableComparison.mdx`:

```mdx
import { Meta } from '@storybook/blocks';

<Meta title="Table / Framework comparison" />

# React vs Angular — DataTable

Both adapters implement the same `DataTableConfig` API from `@test-project/table-core`.

| Feature        | React                            | Angular                             |
| -------------- | -------------------------------- | ----------------------------------- |
| Sorting        | `sorting` prop → `SortingConfig` | `[sorting]` input → `SortingConfig` |
| Pagination     | `pagination` prop                | `[pagination]` input                |
| Row selection  | `rowSelection` prop              | `[rowSelection]` input              |
| Cell renderers | JSX in `columnDef.cell()`        | `TemplateRef` in `columnDef.cell`   |
| Toolbar        | `toolbar={true}`                 | `[toolbar]="true"`                  |
| Theming        | `--dt-*` CSS custom props        | Same                                |
| WCAG           | 2.1 AA                           | 2.1 AA                              |
| Server-side    | `manualSorting` + `totalRows`    | Same                                |
```

---

## Step 7 — Generate README files

For each library (`table-core`, `shared-ui` table section, `table-angular`),
generate a `README.md` using the template from
`.github/instructions/table-library.instructions.md` Section 15.
Populate the Figma-extracted token values into the theming section.

---

## Step 8 — Verify

Run the following checks and fix any errors before finishing:

```bash
# Type-check
pnpm nx run-many -t typecheck -p table-core,shared-ui,table-angular

# Run tests
pnpm nx run-many -t test -p table-core,shared-ui,table-angular

# Build
pnpm nx run-many -t build -p table-core,shared-ui,table-angular

# Start shared-ui Storybook to verify React table stories
pnpm nx run shared-ui:storybook

# Start Angular Storybook to verify (different terminal)
pnpm nx run table-angular:storybook
```

Report any build or test failures and fix them before declaring done.

---

## What to ask the user before starting

1. **Figma link** — paste the full URL to the Figma file or specific frame
   containing the table design.
2. **Angular version** — confirm Angular major version (17 or 18+) so the
   correct standalone/module pattern is used.

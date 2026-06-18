# test-project - Copilot Instructions

## Project Overview

test-project web React app in an Nx monorepo.

## Tech Stack

- **Framework**: React 19 with Vite
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4
- **Monorepo**: Nx 22 with pnpm
- **Testing**: Jest and Vitest
- **Platform**: Web

## Project Structure

```
test-project/
├── apps/                        # Thin, deployable entry points only
│   └── web-client/              # Web app (bootstrapping, routing shell)
│
├── libs/                        # Where the actual code lives
│   ├── shared/                  # Used across all apps
│   │   ├── ui/                  # Shared UI components (Button, Card, Modal…)
│   │   ├── utils/               # Shared utility functions
│   │   └── types/               # Shared TypeScript types & interfaces
│   ├── client/                  # Mobile/web client-specific
│   │   ├── feature-auth/        # Authentication feature
│   │   ├── feature-dashboard/   # Dashboard feature
│   │   └── feature-settings/    # Settings feature
│   └── server/                  # Server/API-specific (if applicable)
│       ├── data-access/         # Database / external API access
│       └── api-routes/          # API route handlers
│
├── tools/                       # Custom scripts and workspace generators
├── nx.json                      # Nx workspace configuration
├── tsconfig.base.json           # Shared TypeScript config & path aliases
└── package.json
```

### Key Principles

- **apps/ = thin entry points.** Apps contain only bootstrapping, navigation shell, and app-level config. No business logic or reusable components.
- **libs/ = where the code lives.** All features, UI components, and utilities belong in libs, never co-located inside apps/.
- **Organize libs by scope and type:**
  - Scope: `shared` (all apps), `client` (mobile/web), `server` (backend)
  - Type: `feature-*` (screens/flows), `ui` (components), `data-access` (API/DB), `utils`, `types`
- **Tag every project** in `project.json` for module boundary enforcement:
  ```json
  { "tags": ["scope:client", "type:feature"] }
  { "tags": ["scope:shared", "type:ui"] }
  ```
- **Path aliases** — Nx auto-adds entries to `tsconfig.base.json` when you generate a lib:
  ```ts
  import { Button } from '@test-project/shared-ui';
  import { useAuth } from '@test-project/client-feature-auth';
  ```
- **Barrel exports** — each lib exposes its public API only through `src/index.ts`.

## Code Conventions

- Use React with Vite for the web app
- Use Tailwind utility classes where appropriate for styling
- All reusable components go in `libs/shared/ui/` or `libs/client/` — never inside `apps/`
- Prefer functional components with hooks

## Important

- Always use `pnpm` as the package manager
- Run tasks via `pnpm nx` (e.g., `pnpm nx run web-client:serve`)

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

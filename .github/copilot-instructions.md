# test-project - Copilot Instructions

## Project Overview

test-project mobile app built with Expo (React Native) in an Nx monorepo.

## Tech Stack

- **Framework**: Expo SDK 54 with Expo Router (file-based routing)
- **Language**: TypeScript (strict)
- **Styling**: NativeWind v5 (Tailwind CSS for React Native)
- **Monorepo**: Nx 22 with pnpm
- **Testing**: jest-expo
- **Platform**: iOS and Android (React Native), with web support via react-native-web

## Project Structure

```
test-project/
├── apps/                        # Thin, deployable entry points only
│   ├── mobile-client/           # Expo mobile app (bootstrapping, navigation shell)
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

- Use **Expo Router** for navigation — file-based routing under `app/` directory
- Use **NativeWind** (`className` prop) for all styling — no StyleSheet.create
- All reusable components go in `libs/shared/ui/` or `libs/client/` — never inside `apps/`
- Prefer functional components with hooks
- Use `expo-constants`, `expo-linking`, and other Expo SDK modules over bare React Native equivalents
- Platform-specific code: use `.ios.tsx` / `.android.tsx` file extensions or `Platform.select()`

## Important

- Always use `pnpm` as the package manager
- Run tasks via `pnpm nx` (e.g., `pnpm nx run mobile-client:start`)
- Never use `react-navigation` directly — use Expo Router which wraps it

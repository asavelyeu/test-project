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

- `apps/mobile-client/` — main Expo app
- `libs/` — shared libraries (UI components, utilities, data access)

## Code Conventions

- Use **Expo Router** for navigation — file-based routing under `app/` directory
- Use **NativeWind** (`className` prop) for all styling — no StyleSheet.create
- Components go in `libs/ui/` if reusable, or co-located in `apps/mobile-client/src/` if app-specific
- Prefer functional components with hooks
- Use `expo-constants`, `expo-linking`, and other Expo SDK modules over bare React Native equivalents
- Platform-specific code: use `.ios.tsx` / `.android.tsx` file extensions or `Platform.select()`

## Important

- Always use `pnpm` as the package manager
- Run tasks via `pnpm nx` (e.g., `pnpm nx run mobile-client:start`)
- Never use `react-navigation` directly — use Expo Router which wraps it

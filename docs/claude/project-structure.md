# Project Structure & Component Architecture

A reference guide for organizing source code in this repository. It defines the high-level layout, the purpose of each directory, and the rules that govern how directories relate to one another. It does **not** enumerate which specific component belongs in which folder — that is a decision the agent makes by applying the principles below and consulting the canonical sources listed in §6.

Use this doc when:

- starting a new component or module and deciding where it lives;
- deciding whether a piece of logic belongs in `libs/`, in an app's `lib/`, in `pages/`, or in framework plumbing;
- onboarding to the Atomic Design layout used inside each framework app.

---

## 1. Monorepo layout

The repo is an Nx + pnpm monorepo. Three framework apps consume the shared engine:

```
test-project/
  libs/
    data-table/                  ← shared headless engine, framework-free
  apps/
    web-client/                  ← React app (Students demo consumer)
    angular-client/              ← Angular app (Students demo consumer)
    vue-client/                  ← Vue app (Students demo consumer)
  docs/claude/                   ← local mirrors and architecture decisions
```

`libs/data-table` is the only shared package. All framework apps depend on it; nothing else does.

`apps/mobile-client` is out of scope for this initiative and does not consume `libs/data-table`.

---

## 2. The shared library — `libs/data-table`

**Purpose.** Framework-free contracts and the headless table engine. Anything two framework apps must agree on lives here: column definitions, the cell-type registry contract, state-machine semantics, and helper functions for sort / filter / selection / pagination configuration.

**Sole external dependency:** `@tanstack/table-core` (the headless engine, pure TypeScript). The framework adapters `@tanstack/react-table`, `@tanstack/angular-table`, and `@tanstack/vue-table` are deliberately **not** used. Each app writes its own thin reactivity bridge — see §4.

**What does not belong here**

- Any framework code (no JSX, no Angular decorators, no signals, no React hooks).
- Any domain code (no `Student`, no domain enums, no domain copy).
- Any rendering. Renderers are app-side; `libs/data-table` defines the contracts they implement.

**The seam.** Domain detail stays out of the core through the cell-type registry: `libs/data-table` declares what a `StatusCell` *config* looks like; each app declares the renderer that draws it. The library never sees `Student.status`.

---

## 3. Per-app structure

Each framework app uses the same shape:

```
apps/<framework>/
  src/
    app/                         ← application root (all apps put code here)
      pages/                     ← concrete page instances; CONTAIN domain code
      lib/                       ← reusable component library, organized atomically
        primitives/
        atoms/
        formatters/
        molecules/
        organisms/
        templates/
        framework/
```

Both `pages/` and `lib/` live under `src/app/` (e.g. `apps/web-client/src/app/lib/`, `apps/angular-client/src/app/lib/`, `apps/vue-client/src/app/lib/`) — not at the app root. The split between `src/app/pages/` and `src/app/lib/` is the load-bearing decision. `lib/` is the *reusable* surface; pages are concrete *instances*. Domain types (Student, etc.) only exist under `pages/`. That makes the no-domain-leakage rule physical: a cell renderer in `lib/molecules/cells/` cannot accidentally import `Student` because `lib/` does not depend on `pages/`.

### 3.1 What each `lib/` directory is for

The atomic layout follows the _Atomic Components_ Confluence page (see §6). Each layer below names its concern — use the concern, not a checklist, to decide where a new component lives.

- **`primitives/`** — minimal building blocks below atoms: only what genuinely cannot be expressed as a composition (e.g., a text primitive). Reach for this layer rarely; new primitives should be discussed with the team before being added.
- **`atoms/`** — small, indivisible, domain-free UI components. The canonical atom inventory is owned by the _Atomic Components_ Confluence page. Do **not** invent atoms locally; see §5.
- **`formatters/`** — pure-function utilities for value transformation (dates, numbers, currency, percent). No JSX, no Angular templates: take a value, return a string.
- **`molecules/`** — small compositions of atoms or primitives that have a single focused role: cell renderers, sort indicators, pagination controls, search inputs. Cell renderers live in `molecules/cells/` and follow the cell-type composition recipes from the _Atomic Components_ page where one is given.
- **`organisms/`** — complex composed components that own behavior or coordinate sub-components: the Data Table itself, its header / row / cell containers, and the state organisms (Default / Loading / Empty / NoResults / Error / Disabled).
- **`templates/`** — page-level layout skeletons with named slots. Use when multiple pages reuse the same shell (toolbar / table / pagination, etc.).
- **`framework/`** — plumbing for the framework, not part of the atomic taxonomy. The TanStack reactivity bridge and the cell-type registry binding live here. See §4.

### 3.2 Deciding which layer a component belongs to

Ask in this order; stop at the first match.

1. **Is it a concrete page instance with domain data?** → `src/app/pages/<feature>/`.
2. **Is it framework plumbing (state bridging, dependency wiring)?** → `lib/framework/`.
3. **Does it own behavior or coordinate sub-components with their own state?** → `lib/organisms/`.
4. **Is it a layout skeleton with slots reused across pages?** → `lib/templates/`.
5. **Is it a focused composition of atoms or primitives serving one role (e.g., a cell renderer, a sort indicator)?** → `lib/molecules/`.
6. **Is it a pure-function value transformation?** → `lib/formatters/`.
7. **Is it an indivisible, domain-free UI element?** → `lib/atoms/` — but only if it appears in the canonical atom inventory (§6). If it doesn't, see §5 rule 4.
8. **Is it more fundamental than an atom and genuinely indivisible (e.g., a text primitive)?** → `lib/primitives/`.

If none of the above fit cleanly, that is itself a signal — surface a finding (CLAUDE.md §6) rather than force-fit.

---

## 4. The reactivity bridge

`libs/data-table` provides the headless engine. Each app owns a thin bridge in `lib/framework/` that translates the engine's state into its framework's native reactivity model. The exact shape of that bridge is decided per framework when the framework is implemented, not in this doc.

Keep this glue minimal. Anything that could be reused across both frameworks belongs in `libs/data-table`, not in `framework/`.

---

## 5. Cross-cutting rules

1. **`libs/data-table` does not import from any framework or any app.** Only `@tanstack/table-core` and pure TS.
2. **`apps/<framework>/src/app/lib/` does not import from `apps/<framework>/src/app/pages/`.** Pages depend on `lib/`; never the reverse.
3. **No domain types in `lib/`.** Domain code lives under `pages/`; configuration crosses the boundary, types do not.
4. **No locally invented atoms.** The atom inventory is owned by the _Atomic Components_ Confluence page (§6). If a cell type or feature seems to need an atom that page does not list, raise a finding (CLAUDE.md §6) — do not add the atom locally.
5. **`Chip` is the only label-style atom.** Per the Confluence page, `Chip` covers what would otherwise be `Badge`, `Tag`, or `Pill`. Variants come from props.
6. **No re-implementing canonical concepts under different names.** If something maps to a canonical term in CLAUDE.md §4, use that term as the root name.

---

## 6. References

When this doc does not cover a question, reach for these.

| Question | Source |
|---|---|
| What atomic components exist? What's their responsibility? Which atoms compose which cell type? | Confluence — _Atomic Components_ (pageId `13271041`). Authoritative for the atom inventory and naming. |
| What is the canonical name for a structural element, cell type, or state? | CLAUDE.md §4 (excerpt) and Confluence — _Terms_ (pageId `7634945`). |
| What states must the Data Table render? What are the UX / a11y expectations? | `docs/claude/ui-ux-expectations.md`. |
| What is in or out of scope for the active iteration? | `docs/claude/iterations/iteration-1.md` and Confluence — _Iterations_ (pageId `8749069`). |

**About the _Atomic Components_ page.** It is the canonical source for the atomic inventory but is not exhaustive — some canonical cell types listed in CLAUDE.md §4 do not yet have an atomic mapping or composition recipe. When the page is silent on a needed atom or recipe, surface that as a finding (CLAUDE.md §6) rather than inventing locally.

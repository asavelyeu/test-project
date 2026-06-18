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

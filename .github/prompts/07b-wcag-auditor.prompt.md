---
description: Deep WCAG 2.1 AA audit subagent invoked by Phase 4 (07-qa). Uses chrome-devtools MCP emulations to verify forced-colors, reduced-motion, text-spacing, 400% reflow, and contrast tokens.
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles', 'runCommands']
---

# WCAG Auditor (subagent)

PERMITTED: chrome-devtools MCP (read + emulations only),
terminal scoped to `node tools/scripts/contrast-check.mjs ...` and
`pnpm nx test-storybook ...`, filesystem write to `.agent-run/` only.
FORBIDDEN: source file writes, Storybook config edits, git, pushing PRs.

Use the `browser-testing-with-devtools` skill.

You are invoked once per built adapter (`react`, `angular`) after the
baseline checks in `07-qa.prompt.md` pass. Catch WCAG 2.1 AA criteria
that axe-core alone misses: 1.4.1, 1.4.10, 1.4.12, 1.4.13, 2.3.3.

Read `.agent-run/{ticket_id}/context.json` for `design.tokens`,
`architecture.file_plan`, and the adapter under test. Open every
variant + state story listed in `architecture.stories`.

## Check 1 — Forced-colors mode (WCAG 1.4.1, 1.4.11)

- Apply emulation: `forcedColors: "active"`. Reload the story.
- For every interactive element returned by axe (or matching
  `[role="button"], button, a, input, select, textarea, [tabindex]`):
  - getComputedStyle and assert `border-width > 0` OR `outline-width > 0`,
    OR the element declares `forced-color-adjust: auto`.
- Capture a full-page screenshot to
  `.agent-run/{ticket_id}/audit/{adapter}/forced-colors-{story}.png`.
- Reset: `forcedColors: "none"`.
- Record failures as `{ check: "forced_colors", wcag_criterion: "1.4.1",
selector, expected, actual }`.

## Check 2 — Reduced motion (WCAG 2.3.3)

- Apply emulation: `reducedMotion: "reduce"`. Reload the story.
- For every animation/transition target documented in
  `design.tokens` (filter token names matching `*-transition-*` or
  `*-animation-*`), trigger the relevant state (hover, focus) and
  assert computed `transitionDuration <= 0.01s` AND
  `animationDuration <= 0.01s`.

## Check 3 — Text spacing (WCAG 1.4.12)

- Inject the override stylesheet:
  ```css
  * {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p {
    margin-bottom: 2em !important;
  }
  ```
- Assert NO text-bearing container has computed `overflow: hidden` with
  `scrollHeight > clientHeight` (= clipping).
- Assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`
  (no new horizontal scrollbar).

## Check 4 — 400% reflow (WCAG 1.4.10)

- Apply emulation: `viewport: { width: 320, height: 256 }`. Reload.
- Assert `document.documentElement.scrollWidth <= 321`.
- If the component is a data table, it is exempt per SC 1.4.10 — record
  `{ exempt: "data table" }` instead of failing. Detect by
  `architecture.semantic_html.root === "table"` or
  `design.component_name` matching `/table/i`.

## Check 5 — Contrast tokens (deterministic)

- Build `pairs.json` from `design.tokens.colors`. For every
  `--ui-<comp>-<variant>-fg` token, locate the matching `-bg` token.
  Tag `kind`:
  - `"large_text"` when `design.tokens.typography[*].size >= 18px`
    (or `>= 14px` with `weight >= 700`),
  - `"ui"` for border/outline/icon tokens,
  - `"normal_text"` otherwise.
- Shell out:
  `echo '<pairs.json>' | node tools/scripts/contrast-check.mjs audit --pairs -`
- Non-zero exit → parse `results[].passes === false` and record each
  failure with `{ check: "contrast_token", wcag_criterion: "1.4.3",
pair_name, fg, bg, ratio, required }`.

## Output

Merge the following slice into `.agent-run/{ticket_id}/context.json`
under `qa.wcag_audit.{adapter}` (additive — never overwrite the other
adapter's slice):

```jsonc
{
  "adapter": "react",
  "ran_at": "<iso>",
  "checks": {
    "forced_colors": { "passed": true, "failures": [], "screenshots": [".agent-run/.../forced-colors-default.png"] },
    "reduced_motion": { "passed": true, "failures": [] },
    "text_spacing": { "passed": true, "failures": [] },
    "reflow_400": { "passed": true, "failures": [], "exempt_reason": null },
    "contrast_token": { "passed": true, "failures": [], "audited_pairs": 14 },
  },
  "passed": true,
}
```

If `passed: false`, append every failure to `qa.wcag_violations[]` and
bucket fix suggestions into `qa.feedback_for_core`,
`qa.feedback_for_react`, `qa.feedback_for_angular` so the QA loop in
the orchestrator can re-run the implementers.

Final stdout line (single sentence):
`"WCAG audit {adapter}: forced_colors={a} reduced_motion={b} text_spacing={c} reflow_400={d} contrast_token={e}. Passed: {bool}."`

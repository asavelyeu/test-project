---
description: Orchestrates the full component pipeline for a Jira ticket.
mode: agent
model: Claude Opus 4.6
tools: ['codebase', 'editFiles', 'runCommands']
---

# Orchestrator

Ask the user the following questions before starting the pipeline:

1. **Jira ticket ID** (required) — if not already provided.
2. **Frameworks** (required) — ask whether to build React only, Angular only,
   or both. Do NOT assume a default; always ask.
3. **Figma source for THIS subticket** (required) — ALWAYS ask, even if a
   sibling subticket already had one. Each subticket usually shows a
   different state of the same component (e.g. NGI-12 = plain table,
   NGI-13 = table with pagination), so we always need the design for the
   current scope. Collect:
   - **Figma URL** (file/frame URL — preferred), and/or
   - **Figma screenshot path** (local PNG fallback).
     At least one is required. The orchestrator caches it on the
     **subticket** (not the epic) via `agent:epic set-design` in Phase 0.

The architect (Phase 2) is responsible for diff-detecting what already
exists in the epic's `spec/component.json` vs what the new design shows,
and planning only the delta. Implementers (Phase 3) hard-refuse to touch
files outside the delta plan. See Phase 2 prompt for details.

## Epic memory is OPT-IN per epic

Not every Jira epic deserves shared memory. "Grab-bag" epics (e.g.
`PERF-Q3`, `Bugfix sweep`, `Infra upgrades`) bundle unrelated tickets,
and sharing `must_respect.existing_exports` across them would inject
irrelevant constraints into every subticket. Cohesive epics (e.g.
`Build the data-table component`) are exactly what epic memory is for.

The orchestrator decides like this (in Phase 0 step 2):

1. If the ticket has no Jira parent → single-ticket mode (no question).
2. If the parent epic already has an `IGNORED.json` marker → single-ticket
   mode, silently. Don't re-ask.
3. If the parent epic already has an `epic.json` → epic mode, silently
   (the user opted in earlier).
4. Otherwise ASK ONCE:

   > Ticket {SUB} is part of epic {EPIC} — "{epic.title}". Use shared
   > epic memory for this epic? Say YES only if the subtickets all build
   > or extend the same component/feature (so prior decisions, exports,
   > and tokens should constrain later subtickets). Say NO for grab-bag
   > epics like performance/bugfix/infra sweeps. [y/N]
   - **yes** → init the epic, run full Phase 0.
   - **no** → run `pnpm agent:epic ignore --epic {EPIC} --reason "user declined at orchestrator"`
     and run single-ticket mode for this and all future siblings of this epic.

The user can flip the decision later with `pnpm agent:epic unignore --epic {EPIC}`.

Run each phase in order, passing context via
`.agent-run/{ticket_id}/context.json`. Load each prompt with
`#file:.github/prompts/<filename>`.

All epic-level memory operations go through the deterministic CLI
`tools/scripts/epic-sync.mjs` (invoked via `pnpm agent:epic <cmd>` or
`node tools/scripts/epic-sync.mjs <cmd>`). NEVER hand-edit
`.agent-run/epics/**/epic.json` or `spec/component.json` — always shell
out so the schema and merges stay deterministic.

PHASE 0 — Epic Sync (MANDATORY, runs before everything else):

1. Fetch the ticket from Jira (Jira MCP). Extract `parent` (the epic).
   - If the ticket has no parent → **single-ticket mode**. Skip steps
     2–6. State lives only in `.agent-run/{ticket_id}/context.json`.
   - If `parent.id` exists → set `epic_id = parent.id`,
     `subticket_id = ticket.id` and continue.
2. Decide epic-vs-single mode by inspecting the epic:
   `pnpm agent:epic status --epic {epic_id}` always returns JSON with
   one of three shapes:
   - `{ok: true, ignored: true, ...}` → **single-ticket mode** (silent,
     do NOT ask). Skip steps 3–6.
   - `{ok: true, exists: true, epic: {...}}` → **epic mode** (silent,
     user opted in earlier). Skip step 2b, go to step 3.
   - `{ok: true, exists: false, ignored: false}` → first time we see
     this epic. **ASK** the question from the "Epic memory is OPT-IN"
     section above. Then: - **no** → run
     `pnpm agent:epic ignore --epic {epic_id} --reason "<user's reason or 'declined at orchestrator'>"`,
     fall through to **single-ticket mode**. Skip steps 3–6. - **yes** → fetch all child issues of `parent.id` from Jira,
     build `[{id, title, depends_on?}, ...]` (infer depends_on from
     Jira issue links of type "is blocked by" / "depends on"; else
     empty), and pipe to:
     `pnpm agent:epic init --epic {epic_id} --title "{epic.title}" \
--component {component-kebab} --subtickets -` (stdin).
3. Resolve next action: `pnpm agent:epic next --epic {epic_id}`.
   - If `next_action.subticket_id` differs from the user's requested
     `subticket_id`, STOP and ask the user to confirm (dependencies may
     be unmet, or another subticket is in progress).
4. Mark this subticket started:
   `pnpm agent:epic start --epic {epic_id} --subticket {subticket_id}`.
   This writes `.agent-run/epics/{epic_id}/subtickets/{subticket_id}/context.json`
   pre-seeded with `epic`, `must_respect`, `previous_designs`, and
   `spec_paths` slices. From this point forward, `context.json` in
   subsequent phases means this file.
5. Load `spec/component.json`, `spec/tokens.css`, and the last 50 lines of
   `progress.md` into the working context for downstream phases. The
   architect and implementers MUST treat `must_respect.existing_exports`,
   `existing_tokens`, and `existing_files` as hard constraints — never
   redefine or rename them.
6. Cache the per-subticket design source (always runs — the user provided
   it in step 3 of the questions):
   `pnpm agent:epic set-design --epic {epic_id} --subticket {subticket_id} \
[--figma-url <url>] [--figma-file-key <key>] [--figma-node-id <id>] \
[--screenshot <path>] [--notes "..."]`
   The seeded `context.json` then includes:
   - `design_source` — this subticket's design pointer (used by Phase 1b).
   - `previous_designs[]` — pointers from all already-`done` sibling
     subtickets so the architect can compare the new design against what
     was implemented before.

In **single-ticket mode** (no parent, ignored epic, or user declined),
state lives only at `.agent-run/{ticket_id}/context.json`. Phases 1–6
run normally; Phase 7 (Epic Update) is SKIPPED.
PHASE 1 — parallel:
#file:.github/prompts/01-requirements.prompt.md
#file:.github/prompts/02-design-inspector.prompt.md

PHASE 1.5 — Fetch gate (deterministic, no LLM call):
Read context.json. HALT and surface to user if ANY of these is true: - `fetch_status.jira === "error"` - `fetch_status.figma === "error"` (only required when
`ticket.frameworks` is non-empty) - `fetch_status.jira` is missing entirely (Phase 1 never ran)
`"hit" | "ok" | "stale_refreshed"` are all acceptable.
Log: `"Fetch gate: jira={...} confluence={...} figma={...}"`.

PHASE 2:
#file:.github/prompts/03-architect.prompt.md

PHASE 3 — implementation (sequential, only run adapters the ticket needs):
#file:.github/prompts/04-implement-core.prompt.md (always)
#file:.github/prompts/05-implement-react.prompt.md (if frameworks includes react)
#file:.github/prompts/06-implement-angular.prompt.md (if frameworks includes angular)

PHASE 4 — QA loop (max 3 iterations across all implemented adapters):
#file:.github/prompts/07-qa.prompt.md
When the base QA checks pass, ALSO invoke the deep WCAG auditor once per
built adapter:
#file:.github/prompts/07b-wcag-auditor.prompt.md
Effective `qa.passed = base.qa.passed && every adapter's qa.wcag_audit.passed`.
If qa.passed is false AND iteration < 3: re-run the relevant implement-\* prompts
with qa feedback (including any `qa.wcag_audit` failures bucketed into
`feedback_for_core/react/angular`), then re-run QA.
If qa.passed is false AND iteration == 3: stop, report to user.

PHASE 5:
#file:.github/prompts/08-pr-creator.prompt.md

PHASE 6:
#file:.github/prompts/09-code-reviewer.prompt.md

PHASE 7 — Epic Update (runs only in **epic mode**; skip entirely if
Phase 0 determined single-ticket mode — i.e. no parent epic, the epic
is marked ignored, or the user declined opting in). Build a `produced`
JSON payload from `context.json`:

```jsonc
{
  "files": [...implementation.core.files_created, ...implementation.react.files_created, ...implementation.angular?.files_created],
  "exports": [...newly exported symbols from the updated barrels...],
  "tokens_added": [...new --ui-<component>-* custom properties introduced this subticket...],
  "types": [...new public TS interfaces/types...],
  "notes": [
    "QA pixel score react={qa.pixel_diff_score.react}",
    "WCAG criteria covered: {count}"
  ]
}
```

Pipe to:
`pnpm agent:epic complete --epic {epic_id} --subticket {subticket_id} \
  --pr-url {pr.pr_url} --produced -`

If the architect logged any cross-cutting decisions, also run:
`pnpm agent:epic add-decision --epic {epic_id} --subticket {subticket_id} \
  --message "..."`

After this call, the next pipeline run for any sibling subticket will
automatically pick up the updated `must_respect` constraints, exports,
and tokens via Phase 0.

Rules:

- Log each phase start/end to `.agent-run/{ticket_id}/pipeline.log`.
- On fatal error: stop, surface error clearly, and run
  `pnpm agent:epic journal --epic {epic_id} --message "blocked at phase X: …"`
  so the next session knows where we stopped.
- Never touch files outside `.agent-run/`, the component paths, or
  `apps/web-client/src/styles/` (for per-project theme overrides).
- Never hand-edit anything under `.agent-run/epics/**` — always go through
  `pnpm agent:epic`.
- Final output to user: PR URL, review outcome, QA score, list of adapters
  built, AND `epic.next_action.subticket_id` so the user knows what to
  pick up tomorrow.

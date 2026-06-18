---
description: Orchestrates the full component pipeline for a Jira ticket.
mode: agent
model: Claude Opus 4.6
tools: ['codebase', 'editFiles', 'runCommands']
---

# Orchestrator

The pipeline supports three modes:

- **Single-ticket mode** — one Jira ticket, no parent epic.
- **Epic mode** — one Jira ticket with a parent epic (shared memory).
- **Batch mode** — multiple related Jira tickets implemented on one branch
  with one commit per ticket, unified architecture, and a single QA + PR.

## Input collection

Ask the user the following questions before starting the pipeline:

1. **Jira ticket ID(s)** (required) — if not already provided. Accept a
   single ticket ID (e.g. `NGI-12`) OR a comma-separated list
   (e.g. `NGI-12, NGI-13, NGI-14`).
   - If multiple IDs are provided → **batch mode**. The first ticket in the
     list is the **primary ticket** (used for branch naming and context path).
   - If a single ID → single-ticket or epic mode (existing behaviour).

2. **Frameworks** (required) — ask whether to build React only, Angular only,
   or both. Do NOT assume a default; always ask. In batch mode this applies
   to ALL tickets in the batch.

3. **Figma source** (optional) — collection depends on mode:

   **Single-ticket / epic mode (existing behaviour):**
   ALWAYS ask for the Figma source for THIS subticket. Each subticket usually
   shows a different state of the same component. Collect:
   - **Figma URL** (file/frame URL — preferred), and/or
   - **Figma screenshot path** (local PNG fallback).

   **Batch mode:**
   a. Ask for a **shared Figma source** first:
      > "Provide a shared Figma URL/screenshot that covers all tickets in
      > this batch (optional):"
   b. Then for each ticket, ask:
      > "Override Figma for {TICKET_ID}? (Enter URL/path, or skip to use
      > the shared source):"
   Each ticket's resolved `design_source` = its override if provided,
   else the shared source, else null. Store resolved sources per ticket
   in `batch.tickets[i].design_source`.

   If no Figma sources are provided at all, Phase 1b (design inspection)
   is skipped and the architect works from the Jira descriptions alone.

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

## Batch mode

When the user provides multiple ticket IDs, the pipeline enters **batch mode**.
The primary ticket (first in the list) determines the branch name and context
path. All tickets MUST share the same parent epic OR all be parentless — do NOT
mix epic and non-epic tickets in a batch.

### Batch context structure

State lives at `.agent-run/{primary_ticket_id}/context.json` with an additional
`batch` slice:

```jsonc
{
  "batch": {
    "enabled": true,
    "primary_ticket_id": "NGI-12",
    "ticket_ids": ["NGI-12", "NGI-13", "NGI-14"],
    "shared_design_source": { "figma_url": "...", "screenshot": "..." },  // or null
    "frameworks": ["react"],
    "current_ticket": "NGI-12",       // set before each implementer run
    "current_ticket_index": 0
  },
  "tickets": {
    "NGI-12": {
      "ticket": { /* ... requirements output ... */ },
      "design_source": { /* resolved: override or shared fallback */ },
      "design": { /* ... design inspector output ... */ },
      "confluence": { /* ... */ },
      "fetch_status": { /* ... */ }
    },
    "NGI-13": { /* ... same structure ... */ },
    "NGI-14": { /* ... same structure ... */ }
  },
  // These remain top-level (unified across all tickets):
  "architecture": { /* ... unified plan with per-ticket sections ... */ },
  // In batch mode, implementation is keyed by ticket_id:
  "implementation": {
    "NGI-12": {
      "core": { "files_created": [], "files_modified": [] },
      "react": { "files_created": [], "test_files": [] },
      "angular": { "files_created": [] },
      "commit_sha": "abc123..."
    },
    "NGI-13": { /* ... same structure ... */ }
  },
  "qa": { /* ... single QA pass result ... */ },
  "pr": { /* ... single PR ... */ },
  "review": { /* ... single review ... */ }
}
```

### Batch phase flow

The phases are identical to single-ticket mode except where noted below.
Phases marked "(batch-aware)" have modified behaviour in batch mode.

### Batch PHASE 0 — Setup (batch-aware)

1. For each ticket ID in the list, fetch from Jira (Jira MCP).
2. Validate all tickets share the same parent epic (or all lack one).
   If mixed → HALT: "All tickets in a batch must share the same parent
   epic (or all be parentless). Found: {ticket_id} → {parent}, ..."
3. If the tickets have a shared parent epic, follow the normal epic opt-in
   flow from the "Epic memory is OPT-IN" section above. Then:
   a. Run `pnpm agent:epic status --epic {epic_id}` to see which
      sibling subtickets are already `done` (e.g. NGI-18 completed in a
      prior session). This confirms the epic already has accumulated
      `must_respect` constraints, exports, and tokens from prior work.
   b. Run `pnpm agent:epic start --epic {epic_id} --subticket {ID} \
      --batch {comma_separated_batch_ids}` for EACH ticket in the batch.
      The `--batch` flag tells epic-sync to skip dependency checks for
      sibling tickets within this batch (the architect's `batch_scopes`
      handles intra-batch ordering instead). Each `start` call returns
      `context_seed` with `must_respect`, `previous_designs`, and
      `spec_paths` accumulated from all previously completed siblings
      (e.g. NGI-18 done in a prior session).
   c. Merge the returned `must_respect`, `previous_designs`, and
      `spec_paths` into the shared batch context (top-level keys).
      These constraints apply to ALL tickets in the batch.
   d. Load `spec/component.json`, `spec/tokens.css`, and the last 50
      lines of `progress.md` into working context — same as single-ticket
      epic mode. The architect and implementers treat these as hard
      constraints.
4. Create the batch context at `.agent-run/{primary_ticket_id}/context.json`
   with the `batch` slice populated.
5. Store each ticket's resolved `design_source` under
   `tickets.{TICKET_ID}.design_source` in the shared context.

**IMPORTANT: All batch agents use `--ticket {primary_ticket_id}` for context
I/O.** The `batch.current_ticket` key tells them which ticket's scope to
work on. Secondary ticket IDs never get their own context files in batch mode.

### Batch PHASE 1 — Requirements + Design (batch-aware)

Run Phase 1a (requirements) for ALL tickets in parallel. Each stores its
output under `tickets.{TICKET_ID}.ticket`, `tickets.{TICKET_ID}.confluence`,
and `tickets.{TICKET_ID}.fetch_status` in the shared context.
All agents use `--ticket {primary_ticket_id}` for context I/O.

AFTER all requirements complete, run Phase 1b (design inspector) for each
ticket that has a non-null `tickets.{TICKET_ID}.design_source`. Design
inspection needs `ticket.title` / `ticket.title_kebab` from requirements,
so it runs AFTER, not in parallel. Results go under
`tickets.{TICKET_ID}.design`.

Also populate the top-level `ticket` key with the primary ticket's data
(for backward-compatibility with downstream prompts that read `ticket.*`).

### Batch PHASE 1.5 — Fetch gate (batch-aware)

Check `tickets.{ID}.fetch_status` for ALL tickets. HALT if ANY has
`jira === "error"`. Log statuses for all tickets.

### Batch PHASE 2 — Unified Architecture (batch-aware)

The architect receives ALL tickets' requirements and designs at once.
Instead of planning for one ticket, it produces a UNIFIED `architecture`
that covers the full scope.

The `architecture.file_plan` is extended with a `ticket_id` field on each
entry so implementers know which files belong to which ticket's commit:

```jsonc
{
  "architecture": {
    "file_plan": [
      { "path": "libs/shared/ui/src/core/data-table/data-table.types.ts",
        "purpose": "Core types for table + pagination",
        "ticket_id": "NGI-12", "type": "core" },
      { "path": "libs/shared/ui/src/components/DataTable/TablePagination.tsx",
        "purpose": "Pagination sub-component",
        "ticket_id": "NGI-13", "type": "adapter" }
    ],
    // Per-ticket scopes for implementation ordering
    "batch_scopes": {
      "NGI-12": { "summary": "Base data table", "depends_on": [] },
      "NGI-13": { "summary": "Pagination", "depends_on": ["NGI-12"] },
      "NGI-14": { "summary": "Sticky header", "depends_on": ["NGI-12"] }
    }
  }
}
```

The architect MUST resolve inter-ticket dependencies and set the
`batch_scopes[].depends_on` order. Implementation proceeds in dependency
order (topological sort), NOT necessarily the order the user listed them.

### Batch PHASE 3 — Implementation with per-ticket commits (batch-aware)

For each ticket in dependency order (`architecture.batch_scopes`):

1. Set BOTH `batch.current_ticket` (the ticket ID string) AND
   `batch.current_ticket_index` in context via:
   `echo '{"current_ticket":"{ID}","current_ticket_index":{N}}' | pnpm agent:context merge --ticket {primary_id} --slice batch`
2. Run the implementation prompts (core → react → angular) scoped to ONLY
   the files tagged with this ticket's ID in `architecture.file_plan`.
   Implementers read `batch.current_ticket` and scope their work.
3. After all adapters are implemented for this ticket:
   - `git add` only this ticket's files.
   - `git commit -m "{ticket_id_lower}-{ticket_type}-{ticket_title_kebab}"`.
   - Store commit SHA via:
     `echo '{"commit_sha":"{SHA}"}' | pnpm agent:context merge --ticket {primary_id} --slice implementation.{ticket_id}`
4. Move to the next ticket.

The first ticket in the batch creates the branch:
`git checkout -b {primary_ticket_id_lower}-{type}-{title_kebab}`

Subsequent tickets commit on the same branch (no new checkout).

Implementation prompts receive an extra context key `batch.current_ticket`
indicating which ticket's scope they should implement. They MUST only
touch files tagged with that ticket ID.

### Batch PHASE 3.5 — Validate (batch-aware)

Run `pnpm agent:context validate --ticket {primary_ticket_id}`. The
validator checks all implementation slices.

### Batch PHASE 4 — QA (batch-aware)

QA runs ONCE on the final state (all commits applied). The QA agent
receives `batch.ticket_ids` and validates the combined output. If QA
fails, the fix loop targets the specific ticket whose files caused the
failure (determined from `qa.feedback_for_*` mapped back via file paths
to `architecture.file_plan[].ticket_id`).

### Batch PHASE 5 — PR creator (batch-aware)

- Branch already exists (created in Phase 3). All commits are already pushed.
- `git push origin {branch_name}`.
- PR title uses the primary ticket: `{PRIMARY_ID}: {type}({scope}): {title}`
- PR body lists ALL tickets with links, groups files per ticket.
- One PR for the entire batch.

### Batch PHASE 6 — Code review

Standard code review — no changes needed. The reviewer sees all commits.

### Batch PHASE 7 — Epic update (batch-aware)

If in epic mode, loop through each ticket in `batch.ticket_ids` and build
a PER-TICKET `produced` payload from `implementation.{ticket_id}`:

```jsonc
{
  "files": [...implementation.{ticket_id}.core.files_created, ...react, ...angular],
  "exports": [...newly exported symbols from this ticket's files...],
  "tokens_added": [...new --ui-* tokens introduced by this ticket...],
  "types": [...new TS types from this ticket...]
}
```

Then call for EACH ticket:
`echo '{per_ticket_produced}' | pnpm agent:epic complete --epic {epic_id} \
  --subticket {ticket_id} --pr-url {pr.pr_url} --produced -`

This ensures each subticket's epic memory entry only claims ownership of
its own artifacts — not the entire batch's output.

All epic-level memory operations go through the deterministic CLI
`tools/scripts/epic-sync.mjs` (invoked via `pnpm agent:epic <cmd>` or
`node tools/scripts/epic-sync.mjs <cmd>`). NEVER hand-edit
`.agent-run/epics/**/epic.json` or `spec/component.json` — always shell
out so the schema and merges stay deterministic.

PHASE 0a — MCP Preflight (MANDATORY, runs before everything):

Run `pnpm agent:doctor`. Examine the output.

- If ANY **required** check fails (exit code 1): **HALT immediately**.
  Surface the doctor's output to the user with this message:
  > "Pipeline cannot start — required dependencies are missing. Run
  > `pnpm agent:doctor` and fix the items marked ✘ above."
  Do NOT proceed to Phase 0 or any other phase.
- If only **optional** checks fail (exit code 0 with warnings): log
  the warnings to `.agent-run/{ticket_id}/pipeline.log` and continue.
  Note which MCP servers may be unavailable (e.g. Figma, Confluence)
  so downstream phases can degrade gracefully.

After the doctor passes, **ping each MCP server** to verify it is actually
running (not just configured). A configured-but-stopped server will silently
break downstream phases:

| MCP Server | Ping call | Required for |
|------------|-----------|--------------|
| **Jira** | `jira_get_issue` with the target ticket ID | Phase 0 (requirements) |
| **chrome-devtools** | `chrome_devtools_take_screenshot` (any tab) | Phase 4 (QA visual checks) |
| **Playwright** | `playwright_navigate` to `about:blank` | Phase 4 (QA keyboard/interaction) |
| **Figma** | `figma_get_file` with a known file key | Phase 1 (design inspection) |

For each server:
- If the ping call **succeeds** → mark the server as `alive` in memory.
- If the ping call **errors or times out (>10 s)** → notify the user:
  > "⚠️ MCP server `{name}` is configured but not responding.
  > Please restart it in VS Code (Cmd+Shift+P → 'MCP: Restart Server')
  > then confirm to continue."
  Wait for user confirmation before proceeding.
- If the server is **optional** for the current ticket (e.g. Figma when
  design is already cached, or Playwright when only React is in scope)
  → log the warning and continue without blocking.

**Critical servers** that MUST be alive to proceed:
- Jira — always required (ticket fetch is Phase 0 step 1)
- chrome-devtools — required if the pipeline will reach Phase 4 QA

**Degradable servers** (pipeline can continue without them):
- Figma — only needed if `design_source` is non-null and no cached design exists in context.json
- Playwright — only needed for interaction testing in QA

PHASE 0b — Resumability Check:

Before starting Phase 0, check for existing progress:

1. **Epic mode:** If the ticket has an epic parent, check
   `.agent-run/epics/{epic_id}/subtickets/{ticket_id}/context.json`.
2. **Single-ticket mode:** Check `.agent-run/{ticket_id}/context.json`.

If the context file exists AND has `last_completed_phase` set:
> "Found existing progress for {ticket_id}: last completed phase =
> {last_completed_phase}. Resume from phase {last_completed_phase + 1}?
> [Y/n]"

- **yes** → Load the existing context. Skip all phases up to and
  including `last_completed_phase`. Continue from
  `last_completed_phase + 1`.
- **no** → Wipe the context file (`phases` and `last_completed_phase`
  keys only — preserve `epic`, `must_respect`, `design_source` if
  present) and start from Phase 0.

At the end of each phase, persist progress via:
`pnpm agent:epic checkpoint --epic {epic_id} --subticket {subticket_id} \
  --phase {N} --slice -`
(In single-ticket mode, write `last_completed_phase` directly into
`.agent-run/{ticket_id}/context.json` instead.)

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
6. Cache the per-subticket design source (**only if the user provided a
   Figma URL or screenshot in step 3**; skip entirely otherwise):
   `pnpm agent:epic set-design --epic {epic_id} --subticket {subticket_id} \
[--figma-url <url>] [--figma-file-key <key>] [--figma-node-id <id>] \
[--screenshot <path>] [--notes "..."]`
   The seeded `context.json` then includes:
   - `design_source` — this subticket's design pointer (used by Phase 1b).
   - `previous_designs[]` — pointers from all already-`done` sibling
     subtickets so the architect can compare the new design against what
     was implemented before.
   If no design source was provided, set `design_source: null` in
   `context.json` and Phase 1b (design inspection) will be skipped.

In **single-ticket mode** (no parent, ignored epic, or user declined),
state lives only at `.agent-run/{ticket_id}/context.json`. Phases 1–6
run normally; Phase 7 (Epic Update) is SKIPPED.
PHASE 1 — parallel:
#file:.github/prompts/01-requirements.prompt.md
#file:.github/prompts/02-design-inspector.prompt.md (skip if `context.json design_source` is null)
In batch mode: run for EACH ticket in the batch (parallel). See "Batch PHASE 1" above.

PHASE 1.5 — Fetch gate (deterministic, no LLM call):
Read context.json. HALT and surface to user if ANY of these is true: - `fetch_status.jira === "error"` - `fetch_status.figma === "error"` (only when
`design_source` is non-null AND `ticket.frameworks` is non-empty) - `fetch_status.jira` is missing entirely (Phase 1 never ran)
`"hit" | "ok" | "stale_refreshed"` are all acceptable.
Log: `"Fetch gate: jira={...} confluence={...} figma={...}"`.

PHASE 2:
#file:.github/prompts/03-architect.prompt.md
In batch mode: the architect receives ALL tickets' requirements/designs and
produces a unified plan. See "Batch PHASE 2" above.

PHASE 3 — implementation (sequential, only run adapters the ticket needs):
#file:.github/prompts/04-implement-core.prompt.md (always)
#file:.github/prompts/05-implement-react.prompt.md (if frameworks includes react)
#file:.github/prompts/06-implement-angular.prompt.md (if frameworks includes angular)
In batch mode: loop through tickets in dependency order. For each ticket,
run the implementation prompts scoped to that ticket's files, then commit.
See "Batch PHASE 3" above.

PHASE 3.5 — Implementation gate (deterministic, no LLM call):
Run `pnpm agent:context validate --ticket {ticket_id}`.
If `issues` is non-empty, HALT and surface to user:
> "Implementation gate failed: {issues}. Fix the listed issues before QA."
This catches malformed architecture or missing implementation slices
before the QA agent consumes them in a fresh context.

PHASE 4 — QA loop (max 3 iterations across all implemented adapters):

In batch mode: QA runs ONCE on the final state (all tickets' commits applied).
The QA agent receives `batch.ticket_ids` so it can validate everything together.
See "Batch PHASE 4" above.

Spawn the `qa-verifier` agent via Task. This agent runs in a FRESH context
(no accumulated tokens from Phases 0–3) and handles BOTH the base QA checks
AND the deep WCAG 2.1 AA audit internally (no nested sub-agent dispatch).

For each iteration (1–3):

1. Spawn agent `qa-verifier` with prompt:
   > "Ticket: {ticket_id}. Iteration: {N}. Adapters built: {react/angular/both}.
   >  Read context via: pnpm agent:context read --ticket {ticket_id}
   >  Write results via: pnpm agent:context merge --ticket {ticket_id} --slice qa"

2. Wait for agent to complete.

3. Read result: `pnpm agent:context read --ticket {ticket_id} --slice qa`

4. Check `qa.passed`:
   - `true` → proceed to Phase 5.
   - `false` AND iteration < 3 → re-run the relevant implement-\* prompts
     with qa feedback (the agent wrote `feedback_for_core/react/angular`
     into the qa slice), then re-spawn `qa-verifier` for next iteration.
   - `false` AND iteration == 3 → stop, report to user with
     `qa.iteration_diff` summary.

PHASE 5:
#file:.github/prompts/08-pr-creator.prompt.md
In batch mode: branch already exists with N commits. Push and create a single
PR listing all tickets. See "Batch PHASE 5" above.

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

# Agent scripts

Deterministic helpers the agent pipeline shells out to. Keeping these as
plain Node scripts (no deps) means JSON state never gets corrupted by an
LLM rewriting a large file from memory.

## `epic-sync.mjs` — epic memory CLI

Single source of truth for in-flight epics. Every epic gets its own folder
under `.agent-run/epics/<EPIC_ID>/`:

```
.agent-run/epics/NGI-11/
├── epic.json                  ← managed; never hand-edit
├── progress.md                ← append-only journal
├── spec/
│   ├── component.json         ← merged exports + types across subtickets
│   ├── tokens.css             ← canonical --ui-data-table-* tokens
│   └── decisions.md           ← ADR log
└── subtickets/
    └── NGI-12/context.json    ← per-subticket pipeline state (resumable)
```

Schema: [`epic.schema.json`](./epic.schema.json) (draft 2020-12).

### Commands

Run via `pnpm agent:epic <cmd> [flags]`. Every command prints a JSON
result to stdout (`{ "ok": true, ... }` on success, `{ "ok": false, "error": "..." }`
on failure with non-zero exit code).

| Command        | Purpose                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------ | ----------------- |
| `init`         | Seed a new epic from Jira data. Required: `--epic`, `--title`, `--component`; optional `--subtickets <file   | ->` (JSON array). |
| `status`       | Print the current `epic.json`.                                                                               |
| `next`         | Print `next_action` — which subticket to pick up and what to respect.                                        |
| `start`        | Mark a subticket `in_progress` and emit a context seed.                                                      |
| `complete`     | Mark a subticket `done`, merge `produced` slice (files/exports/tokens/types), update PR URL, append journal. |
| `journal`      | Append a free-form line to `progress.md`.                                                                    |
| `add-decision` | Append an ADR entry to `spec/decisions.md`.                                                                  |
| `add-tokens`   | Append tokens to `spec/tokens.css` outside the normal complete flow.                                         |
| `list`         | List all epics with status + done/total.                                                                     |

### Typical usage (orchestrator Phase 0 → Phase 7)

```bash
# Phase 0 — seed if absent, start the next subticket
pnpm agent:epic status --epic NGI-11 \
  || cat subtickets.json | pnpm agent:epic init \
        --epic NGI-11 --title "Iteration 1: Data Table MVP" \
        --component data-table --subtickets -
pnpm agent:epic next --epic NGI-11
pnpm agent:epic start --epic NGI-11 --subticket NGI-12

# Phase 7 — close the subticket after the PR exists
printf '%s' "$PRODUCED_JSON" | pnpm agent:epic complete \
  --epic NGI-11 --subticket NGI-12 \
  --pr-url https://github.com/org/repo/pull/41 --produced -
```

### Resumption guarantee

Tomorrow, running `pnpm agent:epic next --epic NGI-11` returns the first
not-started subticket whose `depends_on` are all `done`, plus
`must_respect.{existing_exports, existing_tokens, existing_files}`. The
architect and implementer phases treat that block as hard constraints —
no re-litigating decisions, no duplicate tokens, no renamed exports.

### Why a script (not inline LLM JSON edits)?

LLMs reliably corrupt large JSON when rewriting it from context. This
script:

- Performs **atomic writes** (`*.tmp-<pid>-<ts>` → `rename`).
- **Dedupes** arrays on every merge.
- **Validates** the epic schema version on every read.
- **Computes** `next_action` and `status` from data — they're never
  user-writable.

If you ever need to extend the schema, bump `SCHEMA_VERSION` in
`epic-sync.mjs` and `epic.schema.json` together, and add a migration
branch in `loadEpic()`.

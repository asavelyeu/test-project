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
3. **Figma screenshot** (optional) — ask if they have a screenshot of the Figma
   design to attach. Skip if they decline.
4. **Figma URL** (optional) — ask if they have a Figma file/frame URL to
   reference. Skip if they decline.

Run each phase in order, passing context via
`.agent-run/{ticket_id}/context.json`. Load each prompt with
`#file:.github/prompts/<filename>`.

PHASE 1 — parallel:
#file:.github/prompts/01-requirements.prompt.md
#file:.github/prompts/02-design-inspector.prompt.md

PHASE 2:
#file:.github/prompts/03-architect.prompt.md

PHASE 3 — implementation (sequential, only run adapters the ticket needs):
#file:.github/prompts/04-implement-core.prompt.md (always)
#file:.github/prompts/05-implement-react.prompt.md (if frameworks includes react)
#file:.github/prompts/06-implement-angular.prompt.md (if frameworks includes angular)

PHASE 4 — QA loop (max 3 iterations across all implemented adapters):
#file:.github/prompts/07-qa.prompt.md
If qa.passed is false AND iteration < 3: re-run the relevant implement-\* prompts
with qa feedback, then re-run QA.
If qa.passed is false AND iteration == 3: stop, report to user.

PHASE 5:
#file:.github/prompts/08-pr-creator.prompt.md

PHASE 6:
#file:.github/prompts/09-code-reviewer.prompt.md

Rules:

- Log each phase start/end to `.agent-run/{ticket_id}/pipeline.log`.
- On fatal error: stop, surface error clearly.
- Never touch files outside `.agent-run/`, the component paths, or
  `apps/web-client/src/styles/` (for per-project theme overrides).
- Final output to user: PR URL, review outcome, QA score, list of adapters built.

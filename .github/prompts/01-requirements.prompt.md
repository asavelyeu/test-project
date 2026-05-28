---
description: Reads the Jira ticket and relevant Confluence pages. Phase 1 (parallel with design-inspector).
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles']
# Add MCP tools when available in your Copilot setup: jira, confluence.
---

PERMITTED: Jira MCP (read-only), Confluence MCP (read-only),
terminal scoped to `pnpm agent:cache <get|set|peek>`,
filesystem write to `.agent-run/` only.
FORBIDDEN: git, Figma, source files outside `.agent-run/`.

You receive a Jira ticket ID (e.g. APD-1332). Ask if missing.

STEP 0 — Fetch cache (TTL 6h).
Compute `cache_key = "jira:" + ticket_id`.
Run `pnpm agent:cache get --key "{cache_key}" --ttl-seconds 21600`.

- `status === "hit"` → use `payload.ticket`, set
  `fetch_status.jira = "hit"`, `fetch_status.from_cache = true`,
  skip STEP 1's Jira call (still run STEP 1b epic awareness).
- `status ∈ ("miss", "stale")` → continue to STEP 1, then write the
  fresh ticket back with
  `echo '{"ticket":<obj>}' | pnpm agent:cache set --key "{cache_key}" --source jira --ttl-seconds 21600`
  and set `fetch_status.jira = "ok"` (or `"stale_refreshed"`).
- On any Jira error: set `fetch_status.jira = "error"`, emit the
  error message, and HALT — the orchestrator's Phase 1.5 fetch gate
  will block Phase 2.

STEP 1 — Fetch the Jira ticket. Extract:
id, type (mapped via .agent-config.yml commit_type_map),
title, title_kebab (lowercase, hyphens, ≤50 chars),
description, acceptance_criteria[], labels[],
frameworks[] — infer from labels/description: ["react"], ["angular"], or both,
parent — Jira parent issue {id, title, type} if any (the epic),
links — Jira issue links of type "is blocked by" / "depends on", as `depends_on: [ID, ...]`.

STEP 1b — Epic awareness:
If `parent.id` exists AND parent type is Epic, set context.epic = { id, title }.
Phase 0 (orchestrator) is responsible for `pnpm agent:epic init/start` calls;
this prompt MUST NOT call epic-sync itself. Just read
`.agent-run/epics/{epic.id}/spec/component.json` and
`.agent-run/epics/{epic.id}/progress.md` (last 50 lines) and merge their
contents into context under key `epic_memory` so downstream phases see them.

STEP 2 — Search Confluence for pages matching the ticket title and component
name. Use the same cache pattern as STEP 0 with
`cache_key = "confluence:" + ticket_id + ":" + ticket.title_kebab` and
TTL 12h (43200). Set `fetch_status.confluence` to
`hit | ok | stale_refreshed | error`. Fetch top 3. Store
{ title, url, summary (2–3 sentences) }.

STEP 3 — Read `.agent-run/{id}/context.json` (create dir if needed).
Merge your output under keys `ticket`, `confluence`, (if applicable)
`epic_memory`, and ALWAYS `fetch_status: { jira, confluence,
from_cache }`. Write back.

Output: "Requirements complete for {id}. Frameworks: {frameworks}. Parent epic: {epic.id or 'none'}. Title kebab: {title_kebab}. Cache: jira={fetch_status.jira} confluence={fetch_status.confluence}."

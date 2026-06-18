---
description: Extracts design tokens, variants, states, and assets from Figma. Phase 1 (parallel).
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles']
# Add MCP tools when available: figma.
---

PERMITTED: Figma MCP (read-only),
terminal scoped to `pnpm agent:cache <get|set|peek>`,
filesystem write to `.agent-run/` only.
FORBIDDEN: git, Jira, Confluence, source files.

Read `.agent-run/{ticket_id}/context.json` for `ticket.title`,
`ticket.title_kebab`, and the per-subticket `epic.subticket.design_source`
seeded by Phase 0. Read `.agent-config.yml` for the Figma file key.

STEP 0 — Fetch cache (TTL 6h).
Compute `cache_key = "figma:" + figma_file_key + ":" + (figma_node_id || "root")`
using the file key + node id from `design_source` (falls back to
the global file key when the subticket only supplied a screenshot).
Run `pnpm agent:cache get --key "{cache_key}" --ttl-seconds 21600`.

- `status === "hit"` → use `payload.design`, set
  `fetch_status.figma = "hit"`, skip Figma MCP calls.
- `status ∈ ("miss", "stale")` → continue to STEP 1, write fresh
  payload back via `pnpm agent:cache set --source figma --ttl-seconds 21600`,
  set `fetch_status.figma = "ok"` or `"stale_refreshed"`.
- On Figma error: set `fetch_status.figma = "error"`, emit message,
  and HALT — Phase 1.5 will block Phase 2.

STEP 1 — Search the Figma file for a component matching `ticket.title`
(case-insensitive, partial). If multiple, pick the closest by name + size.

STEP 2a — If FOUND, extract:
component_name, figma_node_id, figma_url
tokens.colors { name: "hex/rgba" }
tokens.spacing { name: "Npx" }
tokens.typography { name: { family, size, weight, lineHeight, letterSpacing } }
tokens.border_radius { name: "Npx" }
tokens.shadows { name: "CSS box-shadow string" }
variants[], states[], dimensions { width, height }
assets[] [{ name, url }]

CRITICAL: extract REAL values (actual hex, real px). The implementer will
translate them into `--ui-<component>-*` custom properties — see
`.github/instructions/cross-framework-ui.instructions.md` §2.

STEP 2b — If NOT FOUND: set figma_node_id=null, capture global file styles
as fallback, add `design.not_found_note`.

STEP 3 — Merge under key `design` into context.json. ALWAYS merge
`fetch_status.figma` (one of `hit | ok | stale_refreshed | error`) at
the top level alongside the slice set by 01-requirements.

Output: "Design inspection complete. Component: {component_name}. Variants: {variants}. Cache: figma={fetch_status.figma}."

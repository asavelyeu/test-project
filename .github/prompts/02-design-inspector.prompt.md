---
description: Extracts design tokens, variants, states, and assets from Figma. Phase 1 (parallel).
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles']
# Add MCP tools when available: figma.
---

PERMITTED: Figma MCP (read-only), filesystem write to `.agent-run/` only.
FORBIDDEN: git, Jira, Confluence, source files.

Read `.agent-run/{ticket_id}/context.json` for `ticket.title` and
`ticket.title_kebab`. Read `.agent-config.yml` for the Figma file key.

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

STEP 3 — Merge under key `design` into context.json.

Output: "Design inspection complete. Component: {component_name}. Variants: {variants}."

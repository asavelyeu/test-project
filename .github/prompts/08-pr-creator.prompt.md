---
description: Creates branch, commit, and GitHub PR with correct naming. Phase 5.
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles', 'runCommands']
# Plus: github MCP, jira MCP.
---

PERMITTED:
terminal: `git status`, `git checkout -b`, `git add` (scoped only),
`git commit`, `git push`
GitHub MCP: create PR, add labels, assign reviewers
Jira MCP: read-only + transition to "In Review"
filesystem read-only scoped to changed component paths.
FORBIDDEN: stage `.env*`, `node_modules`, build outputs, `.agent-run/`.

Read context.json. Read `.agent-config.yml`.

## Batch mode awareness

If `batch.enabled === true`, this is a multi-ticket PR. Key differences:

- **Branch already exists** with N commits (one per ticket, created in Phase 3).
  Do NOT run `git checkout -b` — just `git push origin {branch_name}`.
- **Branch name** uses the primary ticket:
  `{primary_ticket_id_lower}-{type}-{title_kebab}`
- **PR title** uses the primary ticket but mentions the batch:
  `{PRIMARY_ID}: {type}({scope}): {primary_title} (+{N-1} tickets)`
  Example: `NGI-12: feat(ui): implement data table (+2 tickets)`
- **PR body** uses the batch template (see below).
- **Jira transition**: transition ALL tickets in `batch.ticket_ids` to
  "In Review".

### Batch PR body template

```
## Batch: {batch.ticket_ids joined with ", "}

{For each ticket in batch.ticket_ids:}
### {ticket.id} — {ticket.title}
**Jira:** [{ticket.id}]({jira_base_url}/browse/{ticket.id})
**Commit:** `{implementation.{ticket.id}.commit_sha}`

#### Files
{implementation.{ticket.id}.files_created as bullet list}

{End for each}

### Shared Figma
**Figma:** [{design.component_name}]({batch.shared_design_source.figma_url})
{Per-ticket overrides listed if any}

### Adapters built
{implementation.* keys as bullet list}

### Theming
Consumers override per-project via Tailwind arbitrary values or plain CSS
targeting the `--ui-<component>-*` custom properties.

### WCAG compliance
{architecture.wcag_requirements as bullets}

### QA
- React pixel score: {qa.pixel_diff_score.react}/100
- Angular pixel score: {qa.pixel_diff_score.angular}/100 (if built)
- a11y violations: {qa.wcag_violations.length}
- Passes needed: {qa.passes}

### Epic context (if applicable)
<!-- Same as single-ticket mode -->

### Tests
{All test files across all tickets}
All tests: ✅

### Checklist
- [x] Follows copilot-instructions.md + cross-framework-ui.instructions.md
- [x] Semantic HTML verified
- [x] WCAG 2.1 AA compliant
- [x] Token override surface tested
- [x] Unit tests passing
- [x] Storybook stories added
- [x] No console.log / TODOs / any
```

## Naming (single-ticket mode — unchanged)

Branch: {ticket.id.toLowerCase()}-{ticket.type}-{ticket.title_kebab}
Commit: {ticket.id.toLowerCase()}-{ticket.type}-{ticket.title_kebab}
PR title: {TICKET_ID_UPPER}: {ticket.type}({scope}): {human title}
scope = "shared-ui" if only react, "shared-ui-angular" if only angular,
"ui" if both.

Examples:
Branch: apd-1332-feat-implement-data-table
Commit: apd-1332-feat-implement-data-table
PR title: APD-1332: feat(ui): implement data table component

Rules: all lowercase in branch/commit, hyphens only, ≤72 chars.

## PR body template

```
## {ticket.id} — {ticket.title}

**Jira:** [{ticket.id}]({jira_base_url}/browse/{ticket.id})
**Figma:** [{design.component_name}]({design.figma_url})

### Adapters built
{implementation.* keys as bullet list, e.g. - core, - react, - angular}

### What changed
{2–4 sentence summary from ticket.description}

### Files
{implementation.*.files_created as bullet list, grouped per adapter}

### Theming
Consumers override per-project via Tailwind arbitrary values or plain CSS
targeting the `--ui-<component>-*` custom properties. See the `TailwindTheme`
and `CssTheme` Storybook stories.

### WCAG compliance
{architecture.wcag_requirements as bullets: **{criterion}**: {implementation_note}}

### QA
- React pixel score: {qa.pixel_diff_score.react}/100
- Angular pixel score: {qa.pixel_diff_score.angular}/100 (if built)
- a11y violations: {qa.wcag_violations.length}
- Passes needed: {qa.passes}

### Epic context (if applicable)
<!-- Only include this section when context.epic.id exists (epic mode) -->
<details>
<summary>Epic {context.epic.id} — {context.epic.title}</summary>

**Jira epic:** [{context.epic.id}]({jira_base_url}/browse/{context.epic.id})

| Subticket | Title | Status | PR |
|-----------|-------|--------|-----|
{for each epic.subtickets: | {s.id} | {s.title} | {s.status} | {s.pr_url or '—'} |}

**Component spec:** {spec.exports.length} exports, {spec.types.length} types
**Tokens:** {count of --ui-* tokens in spec/tokens.css}
**Constraints carried forward:** {must_respect.existing_exports.length} exports, {must_respect.existing_tokens.length} tokens
</details>

### Tests
{implementation.*.test_files as bullet list}
All tests: ✅

### Checklist
- [x] Follows copilot-instructions.md + cross-framework-ui.instructions.md
- [x] Semantic HTML verified
- [x] WCAG 2.1 AA compliant
- [x] Token override surface tested (Tailwind + CSS)
- [x] Unit tests passing (axe audit included)
- [x] Storybook stories added (Default, AllVariants, AllStates, TailwindTheme, CssTheme, A11yShowcase)
- [x] No console.log / TODOs / any
```

## Steps

1. `git status` — if any forbidden path is dirty: STOP and ask the user.
2. **Single-ticket mode:** `git checkout -b {branch_name}` from `git.default_branch`.
   **Batch mode:** branch already exists — skip this step.
3. `git add` ONLY files in `implementation.*.files_created` + `files_modified`
   - `test_files` + Storybook stories.
   **Batch mode:** all files are already committed — skip this step.
4. **Single-ticket mode:** `git commit -m "{commit_message}"`.
   **Batch mode:** all commits already exist — skip this step.
5. `git push origin {branch_name}`.
6. Create PR via GitHub MCP. Label = ticket.type. Reviewer = `PR_REVIEWER` env.
   **Batch mode:** label with primary ticket's type. Add all ticket IDs as labels.
7. Transition Jira to "In Review" (skip if unavailable).
   **Batch mode:** transition ALL tickets in `batch.ticket_ids`.
8. Set `pr.branch`, `pr.commit_message`, `pr.pr_url`, `pr.pr_number`. Merge.
   **Batch mode:** also set `pr.batch_ticket_ids` and `pr.commits[]`.
9. Epic context prep — only if `context.epic.id` exists.
   **Batch mode:** build `pr.produced` aggregating ALL tickets' implementation.
   Populate the `pr.produced` payload from the merged implementation slices
   so Phase 7 (Epic Update) can pass it to `pnpm agent:epic complete`:

   ```json
   {
     "files": ["...files_created + files_modified across core/react/angular..."],
     "exports": ["...new symbols exported from the updated barrels..."],
     "tokens_added": ["...new --ui-<component>-* custom properties..."],
     "types": ["...new public TS types/interfaces..."],
     "notes": ["pr={pr.pr_url}", "qa_react={qa.pixel_diff_score.react}"]
   }
   ```

   Merge `pr.produced` into context.json. Do NOT call `pnpm agent:epic complete`
   here — that is Phase 7's responsibility.

Output: "PR created: {pr_url}. Next subticket: {epic.next_action.subticket_id ?? 'none — epic done'}"

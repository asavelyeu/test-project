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

## Naming

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
2. `git checkout -b {branch_name}` from `git.default_branch`.
3. `git add` ONLY files in `implementation.*.files_created` + `files_modified`
   - `test_files` + Storybook stories.
4. `git commit -m "{commit_message}"`.
5. `git push origin {branch_name}`.
6. Create PR via GitHub MCP. Label = ticket.type. Reviewer = `PR_REVIEWER` env.
7. Transition Jira to "In Review" (skip if unavailable).
8. Set `pr.branch`, `pr.commit_message`, `pr.pr_url`, `pr.pr_number`. Merge.

Output: "PR created: {pr_url}"

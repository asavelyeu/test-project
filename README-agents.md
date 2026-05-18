# Component pipeline — quick start

## Prerequisites

1. Set environment variables (e.g. via `.env.local` — never commit):

   ```
   JIRA_BASE_URL=https://aristeksystems-team-f2twyvsi.atlassian.net
   JIRA_EMAIL=you@yourorg.com
   JIRA_API_TOKEN=your_atlassian_api_token
   CONFLUENCE_BASE_URL=https://aristeksystems-team-f2twyvsi.atlassian.net/wiki
   FIGMA_ACCESS_TOKEN=your_figma_token
   GITHUB_TOKEN=your_github_pat
   PR_REVIEWER=github_username   # optional
   ```

2. Fill in real values in `.agent-config.yml`.

3. Verify MCP servers in `.vscode/mcp.json` are reachable. The first run
   installs them via `npx`. In VS Code → Copilot Chat → tools icon, confirm
   `jira`, `confluence`, `figma`, `github`, `chrome-devtools` are present.

4. Ensure Storybook is running before Phase 3/4:
   ```bash
   pnpm nx storybook shared-ui
   # and (if Angular adapter was built):
   pnpm nx storybook shared-ui-angular
   ```

## Run the full pipeline

1. Copilot Chat → Agent mode → select **Claude Opus 4.6** (Orchestrator's model).
2. Type:
   ```
   /00-orchestrate
   ```
   or
   ```
   #file:.github/prompts/00-orchestrate.prompt.md
   ```
   Then provide the ticket ID (e.g. `APD-1332`).

## Run individual agents

1. Agent mode → select the model named in the prompt's frontmatter.
2. Type `/01-requirements` (or any other phase shortcut).

## Resume a failed run

State is at `.agent-run/{ticket_id}/context.json`. Re-run only the failed
phase — it reads existing context and continues.

## Troubleshooting

| Symptom                    | Fix                                                          |
| -------------------------- | ------------------------------------------------------------ |
| MCP server not appearing   | Restart VS Code; verify `.vscode/mcp.json` syntax.           |
| Jira auth fails            | Use an Atlassian API token (not your password).              |
| Figma component not found  | Check `FIGMA_FILE_KEY` matches the ID in the Figma URL.      |
| DevTools timeout           | Ensure Storybook is running before Phase 3 (React) / 4 (QA). |
| Angular plugin missing     | The Architect plans `pnpm nx add @nx/angular`; let it run.   |
| QA loops 3 times and fails | Inspect `qa.feedback_for_*` in context.json.                 |

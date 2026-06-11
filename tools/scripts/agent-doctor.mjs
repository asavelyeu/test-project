#!/usr/bin/env node
/**
 * agent-doctor — preflight health check for the agent pipeline.
 *
 * Verifies environment variables, CLI tools, and prompt files required
 * by the Jira-to-code pipeline. Run before every orchestrator session.
 *
 * USAGE
 *   node tools/scripts/agent-doctor.mjs          # full check
 *   pnpm agent:doctor                            # same, via package.json
 *
 * EXIT CODES
 *   0 — all required checks pass (optional warnings may be present)
 *   1 — one or more required checks failed
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');

// ---------- check definitions ----------

const ENV_CHECKS = [
  // [env var name, required?, description]
  ['JIRA_URL', true, 'Jira instance URL (e.g. https://yourcompany.atlassian.net)'],
  ['JIRA_EMAIL', true, 'Jira username/email for API auth'],
  ['JIRA_API_TOKEN', true, 'Jira API token (generate at id.atlassian.com)'],
  ['TEST_PROJECT_FIGMA_ACCESS_TOKEN', false, 'Figma personal access token'],
  ['CONFLUENCE_BASE_URL', false, 'Confluence instance URL'],
  ['GITHUB_TOKEN', false, 'GitHub personal access token (for MCP server)'],
];

const CLI_CHECKS = [
  // [command, required?, description, install hint]
  ['uvx --version', true, 'uv/uvx (runs Jira MCP)', 'brew install uv'],
  ['npx --version', true, 'npx (runs other MCP servers)', 'Install Node.js 20+'],
  ['pnpm --version', true, 'pnpm (package manager)', 'npm install -g pnpm@10'],
];

const PROMPT_FILES = [
  '00-orchestrate.prompt.md',
  '01-requirements.prompt.md',
  '02-design-inspector.prompt.md',
  '03-architect.prompt.md',
  '04-implement-core.prompt.md',
  '05-implement-react.prompt.md',
  '06-implement-angular.prompt.md',
  '08-pr-creator.prompt.md',
  '09-code-reviewer.prompt.md',
];

const SCRIPT_FILES = [
  'tools/scripts/epic-sync.mjs',
  'tools/scripts/fetch-cache.mjs',
  'tools/scripts/contrast-check.mjs',
];

// ---------- runner ----------

function checkEnvVar(name) {
  return !!process.env[name];
}

function checkCli(command) {
  try {
    execSync(command, { stdio: 'pipe', timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

function checkFile(relativePath) {
  return existsSync(resolve(REPO_ROOT, relativePath));
}

// ---------- main ----------

const results = [];
let hasRequiredFailure = false;

// env vars
for (const [name, required, description] of ENV_CHECKS) {
  const ok = checkEnvVar(name);
  if (!ok && required) hasRequiredFailure = true;
  results.push({
    category: 'env',
    name,
    required,
    passed: ok,
    description,
    fix: ok ? null : `export ${name}="<your-value>"`,
  });
}

// CLI tools
for (const [command, required, description, hint] of CLI_CHECKS) {
  const ok = checkCli(command);
  if (!ok && required) hasRequiredFailure = true;
  results.push({
    category: 'cli',
    name: command.split(' ')[0],
    required,
    passed: ok,
    description,
    fix: ok ? null : hint,
  });
}

// prompt files
for (const file of PROMPT_FILES) {
  const fullPath = `.github/prompts/${file}`;
  const ok = checkFile(fullPath);
  if (!ok) hasRequiredFailure = true;
  results.push({
    category: 'file',
    name: file,
    required: true,
    passed: ok,
    description: 'Pipeline prompt file',
    fix: ok ? null : `Missing: ${fullPath}`,
  });
}

// script files
for (const file of SCRIPT_FILES) {
  const ok = checkFile(file);
  if (!ok) hasRequiredFailure = true;
  results.push({
    category: 'file',
    name: file.split('/').pop(),
    required: true,
    passed: ok,
    description: 'Pipeline script',
    fix: ok ? null : `Missing: ${file}`,
  });
}

// ---------- output ----------

const COL = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', dim: '\x1b[2m', bold: '\x1b[1m' };

function icon(passed, required) {
  if (passed) return `${COL.green}✔${COL.reset}`;
  if (required) return `${COL.red}✘${COL.reset}`;
  return `${COL.yellow}⚠${COL.reset}`;
}

function label(required) {
  return required ? 'REQUIRED' : `${COL.dim}optional${COL.reset}`;
}

console.log(`\n${COL.bold}Agent Pipeline Health Check${COL.reset}\n`);

const categories = [
  ['env', 'Environment Variables'],
  ['cli', 'CLI Tools'],
  ['file', 'Pipeline Files'],
];

for (const [cat, title] of categories) {
  const items = results.filter((r) => r.category === cat);
  console.log(`${COL.bold}${title}${COL.reset}`);
  for (const r of items) {
    const status = `${icon(r.passed, r.required)} ${r.name.padEnd(42)} ${label(r.required)}`;
    console.log(`  ${status}`);
    if (!r.passed && r.fix) {
      console.log(`    ${COL.dim}Fix: ${r.fix}${COL.reset}`);
    }
  }
  console.log();
}

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const requiredFailed = results.filter((r) => !r.passed && r.required).length;

if (hasRequiredFailure) {
  console.log(`${COL.red}${COL.bold}FAILED${COL.reset} — ${requiredFailed} required check(s) failed (${failed} total). Fix them before running the pipeline.\n`);
  process.exit(1);
} else if (failed > 0) {
  console.log(`${COL.yellow}${COL.bold}PASSED with warnings${COL.reset} — ${failed} optional check(s) failed. Pipeline can run but some features may be unavailable.\n`);
} else {
  console.log(`${COL.green}${COL.bold}ALL CHECKS PASSED${COL.reset} — ${passed}/${passed} checks OK. Pipeline is ready.\n`);
}

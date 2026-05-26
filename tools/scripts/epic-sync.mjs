#!/usr/bin/env node
/**
 * epic-sync — deterministic memory layer for the agent pipeline.
 *
 * One epic = one folder under `.agent-run/epics/<EPIC_ID>/` containing:
 *   - epic.json        single source of truth for the epic (subtickets, status,
 *                      produced exports/tokens/files, next_action)
 *   - progress.md      append-only human-readable journal
 *   - spec/
 *       component.json merged component spec (exports, props, types)
 *       tokens.css     canonical --ui-* tokens accumulated across subtickets
 *       decisions.md   ADR log: "NGI-12 chose X because Y"
 *   - subtickets/<ID>/context.json   per-subticket resumable pipeline state
 *
 * The agent pipeline shells out to this script for every read/write of epic
 * state. LLMs are bad at preserving large JSON structures across long
 * contexts; this script guarantees deterministic merges, atomic writes, and
 * a stable schema. The agent stays in charge of fetching Jira/Figma and
 * deciding *what* to write — this script only ensures *how* it's written.
 *
 * USAGE
 *   node tools/scripts/epic-sync.mjs <command> [flags]
 *
 * COMMANDS
 *   init        --epic <ID> --title <"..."> --component <kebab>
 *               [--subtickets <json-file|->]    seed a new epic
 *   status      --epic <ID>                    print epic.json
 *   next        --epic <ID>                    print next subticket + must_respect
 *   start       --epic <ID> --subticket <ID>   mark subticket in_progress, emit context seed
 *   complete    --epic <ID> --subticket <ID>
 *               [--pr-url <url>]
 *               [--produced <json-file|->]     mark subticket done, merge produced slice
 *   journal     --epic <ID> --message <"...">  append a line to progress.md
 *   add-tokens  --epic <ID> --tokens <json-file|->   merge tokens into spec/tokens.css
 *   add-decision --epic <ID> --subticket <ID> --message <"...">  append ADR entry
 *
 * Pass `-` to any `<json-file>` flag to read JSON from stdin.
 *
 * Exits non-zero on any validation error with a human-readable message on
 * stderr and a machine-readable JSON error on stdout.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  readdirSync,
  unlinkSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { argv, exit, stdin } from 'node:process';
import { fileURLToPath } from 'node:url';

const SCHEMA_VERSION = 1;
const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const EPICS_ROOT = join(REPO_ROOT, '.agent-run', 'epics');

const SUBTICKET_STATUSES = new Set([
  'not_started',
  'in_progress',
  'blocked',
  'done',
]);
const EPIC_STATUSES = new Set(['not_started', 'in_progress', 'done']);

// ---------- tiny CLI parser (no deps) ----------
function parseArgs(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

// ---------- io helpers ----------
function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJsonAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  renameSync(tmp, path);
}

function appendFileAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, existing + text, 'utf8');
  renameSync(tmp, path);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function readJsonInput(flag) {
  if (!flag) return null;
  if (flag === '-') return JSON.parse(await readStdin());
  return readJson(resolve(flag));
}

function fail(message, extra = {}) {
  process.stderr.write(`epic-sync: ${message}\n`);
  process.stdout.write(
    JSON.stringify({ ok: false, error: message, ...extra }, null, 2) + '\n',
  );
  exit(1);
}

function ok(payload) {
  process.stdout.write(
    JSON.stringify({ ok: true, ...payload }, null, 2) + '\n',
  );
}

function nowIso() {
  return new Date().toISOString();
}

// ---------- epic paths ----------
function epicDir(epicId) {
  if (!/^[A-Z][A-Z0-9]+-\d+$/.test(epicId)) {
    fail(`invalid epic id "${epicId}" (expected e.g. NGI-11)`);
  }
  return join(EPICS_ROOT, epicId);
}

function epicJsonPath(epicId) {
  return join(epicDir(epicId), 'epic.json');
}

function progressPath(epicId) {
  return join(epicDir(epicId), 'progress.md');
}

function specComponentPath(epicId) {
  return join(epicDir(epicId), 'spec', 'component.json');
}

function specTokensPath(epicId) {
  return join(epicDir(epicId), 'spec', 'tokens.css');
}

function decisionsPath(epicId) {
  return join(epicDir(epicId), 'spec', 'decisions.md');
}

function subticketContextPath(epicId, subId) {
  return join(epicDir(epicId), 'subtickets', subId, 'context.json');
}

function ignoredMarkerPath(epicId) {
  return join(epicDir(epicId), 'IGNORED.json');
}

function isEpicIgnored(epicId) {
  return existsSync(ignoredMarkerPath(epicId));
}

function readIgnoredMarker(epicId) {
  const p = ignoredMarkerPath(epicId);
  if (!existsSync(p)) return null;
  try {
    return readJson(p);
  } catch {
    return { ignored: true };
  }
}

function loadEpic(epicId) {
  const path = epicJsonPath(epicId);
  if (!existsSync(path))
    fail(`epic ${epicId} not found at ${path}. Run \`init\` first.`);
  const epic = readJson(path);
  if (epic.schema_version !== SCHEMA_VERSION) {
    fail(
      `epic ${epicId} has unsupported schema_version ${epic.schema_version} (expected ${SCHEMA_VERSION})`,
    );
  }
  return epic;
}

function saveEpic(epic) {
  epic.updated_at = nowIso();
  epic.next_action = computeNextAction(epic);
  epic.status = computeEpicStatus(epic);
  writeJsonAtomic(epicJsonPath(epic.id), epic);
}

// ---------- pure logic ----------
function computeEpicStatus(epic) {
  const statuses = epic.subtickets.map((s) => s.status);
  if (statuses.every((s) => s === 'done')) return 'done';
  if (statuses.some((s) => s === 'in_progress' || s === 'done'))
    return 'in_progress';
  return 'not_started';
}

function computeNextAction(epic) {
  const doneIds = new Set(
    epic.subtickets.filter((s) => s.status === 'done').map((s) => s.id),
  );
  const inProgress = epic.subtickets.find((s) => s.status === 'in_progress');
  const candidate =
    inProgress ||
    epic.subtickets.find(
      (s) =>
        s.status === 'not_started' &&
        (s.depends_on || []).every((dep) => doneIds.has(dep)),
    );

  const exports = new Set();
  const tokens = new Set();
  const files = new Set();
  for (const sub of epic.subtickets) {
    if (sub.status !== 'done' || !sub.produced) continue;
    (sub.produced.exports || []).forEach((e) => exports.add(e));
    (sub.produced.tokens_added || []).forEach((t) => tokens.add(t));
    (sub.produced.files || []).forEach((f) => files.add(f));
  }

  if (!candidate) {
    return {
      subticket_id: null,
      reason: 'All subtickets are done.',
      must_respect: {
        existing_exports: [...exports].sort(),
        existing_tokens: [...tokens].sort(),
        existing_files: [...files].sort(),
      },
    };
  }

  const unmetDeps = (candidate.depends_on || []).filter((d) => !doneIds.has(d));
  if (unmetDeps.length > 0) {
    return {
      subticket_id: null,
      reason: `Next candidate ${candidate.id} is blocked by unmet dependencies: ${unmetDeps.join(', ')}.`,
      blocked_subticket_id: candidate.id,
      unmet_dependencies: unmetDeps,
      must_respect: {
        existing_exports: [...exports].sort(),
        existing_tokens: [...tokens].sort(),
        existing_files: [...files].sort(),
      },
    };
  }

  return {
    subticket_id: candidate.id,
    reason:
      candidate.status === 'in_progress'
        ? `Resuming in-progress subticket ${candidate.id}.`
        : `${candidate.id} is the next not-started subticket and its dependencies are satisfied.`,
    must_respect: {
      existing_exports: [...exports].sort(),
      existing_tokens: [...tokens].sort(),
      existing_files: [...files].sort(),
    },
  };
}

function validateSubticket(sub) {
  if (!sub.id || !/^[A-Z][A-Z0-9]+-\d+$/.test(sub.id)) {
    fail(`invalid subticket id "${sub.id}"`);
  }
  if (typeof sub.title !== 'string' || sub.title.length === 0) {
    fail(`subticket ${sub.id} is missing title`);
  }
  if (sub.status && !SUBTICKET_STATUSES.has(sub.status)) {
    fail(`subticket ${sub.id} has invalid status "${sub.status}"`);
  }
  if (sub.depends_on && !Array.isArray(sub.depends_on)) {
    fail(`subticket ${sub.id} depends_on must be an array`);
  }
}

// ---------- commands ----------
async function cmdInit(args) {
  const epicId = args.epic;
  const title = args.title;
  const component = args.component;
  if (!epicId || !title || !component)
    fail('init requires --epic, --title, --component');

  const path = epicJsonPath(epicId);
  if (existsSync(path)) fail(`epic ${epicId} already exists at ${path}`);

  const subtickets = (await readJsonInput(args.subtickets)) || [];
  if (!Array.isArray(subtickets)) fail('--subtickets must be a JSON array');
  for (const s of subtickets) {
    validateSubticket(s);
    s.status = s.status || 'not_started';
    s.depends_on = s.depends_on || [];
  }

  const epic = {
    schema_version: SCHEMA_VERSION,
    id: epicId,
    title,
    component,
    status: 'not_started',
    started_at: nowIso(),
    updated_at: nowIso(),
    subtickets,
    next_action: null,
  };
  saveEpic(epic);

  // seed sibling files
  appendFileAtomic(
    progressPath(epicId),
    `# ${epicId} — ${title}\n\nComponent: \`${component}\`\n\n## ${nowIso().slice(0, 10)} — epic seeded\n` +
      subtickets.map((s) => `- ${s.id}: ${s.title} (${s.status})`).join('\n') +
      '\n',
  );
  writeJsonAtomic(specComponentPath(epicId), {
    schema_version: SCHEMA_VERSION,
    component,
    exports: [],
    types: [],
    notes: [],
  });
  appendFileAtomic(
    specTokensPath(epicId),
    `/* Canonical --ui-${component}-* tokens for epic ${epicId}.\n   Updated automatically by epic-sync. */\n`,
  );
  appendFileAtomic(
    decisionsPath(epicId),
    `# Architectural decisions — ${epicId} (${component})\n\n`,
  );

  ok({ created: path, epic });
}

function cmdStatus(args) {
  const epicId = args.epic;
  if (!epicId) fail('status requires --epic');
  if (isEpicIgnored(epicId)) {
    const marker = readIgnoredMarker(epicId);
    ok({
      ignored: true,
      epic_id: epicId,
      reason: marker?.reason || null,
      ignored_at: marker?.ignored_at || null,
      epic: null,
    });
    return;
  }
  if (!existsSync(epicJsonPath(epicId))) {
    // Not-found is a legitimate "no epic memory yet" signal for the
    // orchestrator — don't fail, return a structured absent result.
    ok({ ignored: false, epic_id: epicId, exists: false, epic: null });
    return;
  }
  const epic = loadEpic(epicId);
  ok({ ignored: false, exists: true, epic });
}

function cmdIgnore(args) {
  const epicId = args.epic;
  if (!epicId) fail('ignore requires --epic');
  if (existsSync(epicJsonPath(epicId))) {
    fail(
      `epic ${epicId} already has memory (epic.json exists); refuse to ignore. Delete .agent-run/epics/${epicId}/ by hand if you really want to discard it.`,
    );
  }
  const marker = {
    ignored: true,
    epic_id: epicId,
    reason: args.reason || null,
    ignored_at: nowIso(),
  };
  writeJsonAtomic(ignoredMarkerPath(epicId), marker);
  ok(marker);
}

function cmdUnignore(args) {
  const epicId = args.epic;
  if (!epicId) fail('unignore requires --epic');
  const p = ignoredMarkerPath(epicId);
  if (!existsSync(p)) {
    ok({ epic_id: epicId, was_ignored: false });
    return;
  }
  // Atomic-ish delete: rename out of the way then unlink.
  const tomb = `${p}.removed-${process.pid}-${Date.now()}`;
  renameSync(p, tomb);
  try {
    unlinkSync(tomb);
  } catch {
    /* best effort */
  }
  ok({ epic_id: epicId, was_ignored: true });
}

function cmdNext(args) {
  const epic = loadEpic(args.epic);
  ok({ next_action: epic.next_action, epic_status: epic.status });
}

function cmdStart(args) {
  const epic = loadEpic(args.epic);
  const subId = args.subticket;
  if (!subId) fail('start requires --subticket');

  const sub = epic.subtickets.find((s) => s.id === subId);
  if (!sub) fail(`subticket ${subId} not found in epic ${epic.id}`);

  const doneIds = new Set(
    epic.subtickets.filter((s) => s.status === 'done').map((s) => s.id),
  );
  const unmet = (sub.depends_on || []).filter((d) => !doneIds.has(d));
  if (unmet.length > 0) {
    fail(`cannot start ${subId}: unmet dependencies ${unmet.join(', ')}`, {
      unmet_dependencies: unmet,
    });
  }

  if (sub.status === 'done') fail(`subticket ${subId} is already done`);
  sub.status = 'in_progress';
  sub.started_at = sub.started_at || nowIso();
  saveEpic(epic);

  // emit a context seed the agent can merge into its own context.json
  const contextSeed = {
    epic: {
      id: epic.id,
      title: epic.title,
      component: epic.component,
    },
    subticket: {
      id: sub.id,
      title: sub.title,
      depends_on: sub.depends_on || [],
    },
    must_respect: epic.next_action.must_respect,
    design_source: sub.design_source || null,
    previous_designs: epic.subtickets
      .filter((s) => s.status === 'done' && s.design_source)
      .map((s) => ({
        subticket_id: s.id,
        title: s.title,
        figma_url: s.design_source.figma_url,
        figma_node_id: s.design_source.figma_node_id,
        screenshot_path: s.design_source.screenshot_path,
      })),
    spec_paths: {
      component_spec: specComponentPath(epic.id).replace(REPO_ROOT + '/', ''),
      tokens_css: specTokensPath(epic.id).replace(REPO_ROOT + '/', ''),
      decisions_md: decisionsPath(epic.id).replace(REPO_ROOT + '/', ''),
      progress_md: progressPath(epic.id).replace(REPO_ROOT + '/', ''),
    },
  };
  const contextPath = subticketContextPath(epic.id, sub.id);
  if (!existsSync(contextPath)) writeJsonAtomic(contextPath, contextSeed);

  appendFileAtomic(
    progressPath(epic.id),
    `\n## ${nowIso().slice(0, 10)} — starting ${sub.id} (${sub.title})\n` +
      (epic.next_action.must_respect.existing_exports.length > 0
        ? `Must respect existing exports: ${epic.next_action.must_respect.existing_exports.join(', ')}.\n`
        : ''),
  );

  ok({
    subticket: sub,
    context_seed: contextSeed,
    context_path: contextPath.replace(REPO_ROOT + '/', ''),
  });
}

async function cmdComplete(args) {
  const epic = loadEpic(args.epic);
  const subId = args.subticket;
  if (!subId) fail('complete requires --subticket');
  const sub = epic.subtickets.find((s) => s.id === subId);
  if (!sub) fail(`subticket ${subId} not found in epic ${epic.id}`);

  const produced = (await readJsonInput(args.produced)) || {};
  // shape: { files: [...], exports: [...], tokens_added: [...], types: [...], notes: [...] }
  sub.status = 'done';
  sub.finished_at = nowIso();
  if (args['pr-url']) sub.pr_url = args['pr-url'];
  sub.produced = {
    files: dedupe([...(sub.produced?.files || []), ...(produced.files || [])]),
    exports: dedupe([
      ...(sub.produced?.exports || []),
      ...(produced.exports || []),
    ]),
    tokens_added: dedupe([
      ...(sub.produced?.tokens_added || []),
      ...(produced.tokens_added || []),
    ]),
    types: dedupe([...(sub.produced?.types || []), ...(produced.types || [])]),
    notes: [...(sub.produced?.notes || []), ...(produced.notes || [])],
  };
  saveEpic(epic);

  // merge into component spec
  const spec = existsSync(specComponentPath(epic.id))
    ? readJson(specComponentPath(epic.id))
    : {
        schema_version: SCHEMA_VERSION,
        component: epic.component,
        exports: [],
        types: [],
        notes: [],
      };
  spec.exports = dedupe([...spec.exports, ...sub.produced.exports]);
  spec.types = dedupe([...spec.types, ...sub.produced.types]);
  if (sub.produced.notes.length > 0) {
    spec.notes.push({
      subticket: sub.id,
      at: sub.finished_at,
      notes: sub.produced.notes,
    });
  }
  writeJsonAtomic(specComponentPath(epic.id), spec);

  // merge tokens into tokens.css (commented section per subticket)
  if (sub.produced.tokens_added.length > 0) {
    appendFileAtomic(
      specTokensPath(epic.id),
      `\n/* From ${sub.id} — ${sub.title} (${sub.finished_at}) */\n` +
        sub.produced.tokens_added.map((t) => `${t}`).join('\n') +
        '\n',
    );
  }

  appendFileAtomic(
    progressPath(epic.id),
    `\n## ${nowIso().slice(0, 10)} — ${sub.id} done\n` +
      (sub.pr_url ? `PR: ${sub.pr_url}\n` : '') +
      (sub.produced.files.length > 0
        ? `Files: ${sub.produced.files.length}\n`
        : '') +
      (sub.produced.exports.length > 0
        ? `Exports: ${sub.produced.exports.join(', ')}\n`
        : '') +
      (sub.produced.tokens_added.length > 0
        ? `Tokens: ${sub.produced.tokens_added.join(', ')}\n`
        : ''),
  );

  ok({
    subticket: sub,
    next_action: epic.next_action,
    epic_status: epic.status,
  });
}

function cmdJournal(args) {
  const epic = loadEpic(args.epic);
  if (!args.message) fail('journal requires --message');
  appendFileAtomic(progressPath(epic.id), `\n_${nowIso()}_ ${args.message}\n`);
  ok({ appended_to: progressPath(epic.id).replace(REPO_ROOT + '/', '') });
}

async function cmdAddTokens(args) {
  const epic = loadEpic(args.epic);
  const tokens = await readJsonInput(args.tokens);
  if (!Array.isArray(tokens)) fail('--tokens must be a JSON array of strings');
  appendFileAtomic(
    specTokensPath(epic.id),
    `\n/* ad-hoc tokens added ${nowIso()} */\n` + tokens.join('\n') + '\n',
  );
  ok({ appended: tokens.length });
}

function cmdAddDecision(args) {
  const epic = loadEpic(args.epic);
  if (!args.subticket || !args.message)
    fail('add-decision requires --subticket and --message');
  appendFileAtomic(
    decisionsPath(epic.id),
    `\n## ${nowIso().slice(0, 10)} — ${args.subticket}\n${args.message}\n`,
  );
  ok({ appended_to: decisionsPath(epic.id).replace(REPO_ROOT + '/', '') });
}

function cmdSetDesign(args) {
  const epic = loadEpic(args.epic);
  const subId = args.subticket;
  if (!subId) fail('set-design requires --subticket');
  const sub = epic.subtickets.find((s) => s.id === subId);
  if (!sub) fail(`subticket ${subId} not found in epic ${epic.id}`);

  const prev = sub.design_source || {};
  const design = {
    figma_url: args['figma-url'] || prev.figma_url || null,
    figma_file_key: args['figma-file-key'] || prev.figma_file_key || null,
    figma_node_id: args['figma-node-id'] || prev.figma_node_id || null,
    screenshot_path: args['screenshot'] || prev.screenshot_path || null,
    notes: args['notes'] || prev.notes || null,
    updated_at: nowIso(),
  };
  if (!design.figma_url && !design.screenshot_path) {
    fail('set-design requires at least --figma-url or --screenshot');
  }
  sub.design_source = design;
  saveEpic(epic);
  ok({ subticket_id: sub.id, design_source: design });
}

function cmdGetDesign(args) {
  const epic = loadEpic(args.epic);
  const subId = args.subticket;
  if (!subId) fail('get-design requires --subticket');
  const sub = epic.subtickets.find((s) => s.id === subId);
  if (!sub) fail(`subticket ${subId} not found in epic ${epic.id}`);
  ok({ subticket_id: sub.id, design_source: sub.design_source || null });
}

function cmdList() {
  if (!existsSync(EPICS_ROOT)) {
    ok({ epics: [] });
    return;
  }
  const epics = readdirSync(EPICS_ROOT)
    .filter((d) => existsSync(epicJsonPath(d)))
    .map((id) => {
      const e = readJson(epicJsonPath(id));
      return {
        id: e.id,
        title: e.title,
        component: e.component,
        status: e.status,
        next_subticket: e.next_action?.subticket_id || null,
        done: e.subtickets.filter((s) => s.status === 'done').length,
        total: e.subtickets.length,
      };
    });
  ok({ epics });
}

// ---------- utils ----------
function dedupe(arr) {
  return [...new Set(arr)];
}

// ---------- entrypoint ----------
async function main() {
  const args = parseArgs(argv.slice(2));
  const cmd = args._[0];
  if (!cmd) {
    process.stderr.write(
      'Usage: epic-sync <init|status|next|start|complete|journal|add-tokens|add-decision|set-design|get-design|ignore|unignore|list> [flags]\n',
    );
    exit(2);
  }
  try {
    switch (cmd) {
      case 'init':
        return await cmdInit(args);
      case 'status':
        return cmdStatus(args);
      case 'next':
        return cmdNext(args);
      case 'start':
        return cmdStart(args);
      case 'complete':
        return await cmdComplete(args);
      case 'journal':
        return cmdJournal(args);
      case 'add-tokens':
        return await cmdAddTokens(args);
      case 'add-decision':
        return cmdAddDecision(args);
      case 'set-design':
        return cmdSetDesign(args);
      case 'get-design':
        return cmdGetDesign(args);
      case 'ignore':
        return cmdIgnore(args);
      case 'unignore':
        return cmdUnignore(args);
      case 'list':
        return cmdList();
      default:
        fail(`unknown command "${cmd}"`);
    }
  } catch (err) {
    fail(err.message || String(err));
  }
}

main();

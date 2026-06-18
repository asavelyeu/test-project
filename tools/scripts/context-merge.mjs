#!/usr/bin/env node
/**
 * context-merge — safe slice-based merge for .agent-run/{ticket}/context.json.
 *
 * Prerequisite for sub-agent pipeline phases: each agent writes only its
 * own slice (e.g. "qa", "design", "implementation.core") via this script,
 * which acquires a lock, validates the slice name, deep-merges only the
 * specified path, and rejects writes to other slices.
 *
 * USAGE
 *   node tools/scripts/context-merge.mjs <command> [flags]
 *
 * COMMANDS
 *   merge    --ticket <ID> --slice <dotpath> [--stdin|-]   merge a JSON slice
 *   read     --ticket <ID> [--slice <dotpath>]              read context or slice
 *   validate --ticket <ID>                                  validate schema
 *   lock     --ticket <ID>                                  acquire lock
 *   unlock   --ticket <ID>                                  release lock
 *
 * EXAMPLES
 *   echo '{"passed":true}' | pnpm agent:context merge --ticket APD-1332 --slice qa
 *   pnpm agent:context read --ticket APD-1332 --slice architecture
 *   pnpm agent:context validate --ticket APD-1332
 *
 * The --slice flag uses dot-notation for nested paths:
 *   --slice implementation.core   → merges into context.implementation.core
 *   --slice qa.wcag_audit.react   → merges into context.qa.wcag_audit.react
 *
 * SLICE OWNERSHIP (enforced):
 * Each top-level slice has an allowed writer. The merge command rejects
 * writes where the top-level slice doesn't match the --slice argument.
 * E.g., --slice qa prevents writing keys under "implementation" or "pr".
 *
 * Exits 0 on success (JSON on stdout), 1 on error, 2 on usage error.
 * Writes are atomic (tmp + rename). Locking uses PID-based lock files
 * with stale-lock detection (same pattern as epic-sync.mjs).
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
import { hostname } from 'node:os';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const AGENT_RUN_ROOT = join(REPO_ROOT, '.agent-run');

// Valid top-level slices. Agents may only write to these.
const VALID_SLICES = new Set([
  'ticket',
  'confluence',
  'epic_memory',
  'fetch_status',
  'design',
  'architecture',
  'implementation',
  'qa',
  'pr',
  'review',
  'last_completed_phase',
  'epic',
  'must_respect',
  'previous_designs',
  'spec_paths',
  'design_source',
  // Batch mode slices
  'batch',
  'tickets',
]);

// ─── CLI parser (no deps) ────────────────────────────────────────────
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
    } else if (a === '-') {
      out.stdin = true;
    } else {
      out._.push(a);
    }
  }
  return out;
}

// ─── IO helpers ──────────────────────────────────────────────────────
function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJsonAtomic(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  renameSync(tmp, path);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function nowIso() {
  return new Date().toISOString();
}

function ok(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  exit(0);
}

function fail(msg) {
  process.stderr.write(`context-merge: ERROR — ${msg}\n`);
  process.stdout.write(JSON.stringify({ ok: false, error: msg }) + '\n');
  exit(1);
}

// ─── Path resolution ─────────────────────────────────────────────────
// Supports both single-ticket and epic-mode context paths.
function resolveContextPath(ticketId) {
  // Check epic-mode path first (search all epics for this subticket)
  const epicsDir = join(AGENT_RUN_ROOT, 'epics');
  if (existsSync(epicsDir)) {
    const epicIds = readdirSync(epicsDir).filter(
      (d) => !d.startsWith('.') && existsSync(join(epicsDir, d, 'epic.json')),
    );
    for (const epicId of epicIds) {
      const epicCtx = join(
        epicsDir,
        epicId,
        'subtickets',
        ticketId,
        'context.json',
      );
      if (existsSync(epicCtx)) return epicCtx;
    }
  }
  // Single-ticket mode
  return join(AGENT_RUN_ROOT, ticketId, 'context.json');
}

function lockPath(ticketId) {
  return resolveContextPath(ticketId).replace('context.json', '.merge-lock');
}

// ─── Lock helpers (same pattern as epic-sync.mjs) ────────────────────
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock(ticketId) {
  const lp = lockPath(ticketId);
  mkdirSync(dirname(lp), { recursive: true });
  const lockData = JSON.stringify(
    {
      pid: process.pid,
      hostname: hostname(),
      started_at: nowIso(),
      slice_op: 'merge',
    },
    null,
    2,
  );

  if (existsSync(lp)) {
    let isStale = false;
    try {
      const existing = readJson(lp);
      if (existing.pid && isPidAlive(existing.pid)) {
        fail(
          `context.json for ${ticketId} is locked by PID ${existing.pid} since ${existing.started_at}. ` +
            `If stale, run: pnpm agent:context unlock --ticket ${ticketId}`,
        );
      }
      process.stderr.write(
        `context-merge: WARNING — overriding stale lock (PID ${existing.pid} is dead)\n`,
      );
      isStale = true;
    } catch {
      process.stderr.write(
        `context-merge: WARNING — overriding unreadable lock file\n`,
      );
      isStale = true;
    }
    if (isStale) {
      try {
        unlinkSync(lp);
      } catch {
        /* best effort */
      }
    }
  }

  try {
    writeFileSync(lp, lockData + '\n', { flag: 'wx' });
  } catch (err) {
    if (err.code === 'EEXIST') {
      fail(
        `context.json lock race for ${ticketId}. Retry or run: pnpm agent:context unlock --ticket ${ticketId}`,
      );
    }
    writeFileSync(lp, lockData + '\n', 'utf8');
  }
}

function releaseLock(ticketId) {
  const lp = lockPath(ticketId);
  if (existsSync(lp)) {
    try {
      unlinkSync(lp);
    } catch {
      /* best effort */
    }
  }
}

// ─── Deep merge (slice-scoped) ───────────────────────────────────────
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

function setNestedSlice(obj, dotpath, value) {
  const parts = dotpath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  const lastKey = parts[parts.length - 1];
  if (
    typeof current[lastKey] === 'object' &&
    current[lastKey] !== null &&
    !Array.isArray(current[lastKey]) &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    deepMerge(current[lastKey], value);
  } else {
    current[lastKey] = value;
  }
  return obj;
}

function getNestedSlice(obj, dotpath) {
  const parts = dotpath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

// ─── Commands ────────────────────────────────────────────────────────
async function cmdMerge(args) {
  const ticketId = args.ticket;
  const slicePath = args.slice;
  if (!ticketId) fail('merge requires --ticket');
  if (!slicePath) fail('merge requires --slice');

  // Validate top-level slice name
  const topSlice = slicePath.split('.')[0];
  if (!VALID_SLICES.has(topSlice)) {
    fail(
      `unknown slice "${topSlice}". Valid slices: ${[...VALID_SLICES].join(', ')}`,
    );
  }

  // Read input
  let input;
  const raw = await readStdin();
  try {
    input = JSON.parse(raw);
  } catch {
    fail('stdin is not valid JSON');
  }

  // Acquire lock, merge, release
  acquireLock(ticketId);
  try {
    const contextPath = resolveContextPath(ticketId);
    let context = {};
    if (existsSync(contextPath)) {
      context = readJson(contextPath);
    }

    // Record merge metadata
    if (!context._merge_log) context._merge_log = [];
    context._merge_log.push({
      slice: slicePath,
      merged_at: nowIso(),
      pid: process.pid,
    });

    setNestedSlice(context, slicePath, input);
    writeJsonAtomic(contextPath, context);

    ok({
      ok: true,
      ticket_id: ticketId,
      slice: slicePath,
      context_path: contextPath.replace(REPO_ROOT + '/', ''),
      merged_at: nowIso(),
    });
  } finally {
    releaseLock(ticketId);
  }
}

function cmdRead(args) {
  const ticketId = args.ticket;
  if (!ticketId) fail('read requires --ticket');

  const contextPath = resolveContextPath(ticketId);
  if (!existsSync(contextPath)) {
    fail(`no context.json found for ticket ${ticketId}`);
  }
  const context = readJson(contextPath);

  if (args.slice) {
    const value = getNestedSlice(context, args.slice);
    if (value === undefined) {
      fail(`slice "${args.slice}" not found in context.json`);
    }
    ok(value);
  } else {
    ok(context);
  }
}

function cmdValidate(args) {
  const ticketId = args.ticket;
  if (!ticketId) fail('validate requires --ticket');

  const contextPath = resolveContextPath(ticketId);
  if (!existsSync(contextPath)) {
    fail(`no context.json found for ticket ${ticketId}`);
  }
  const context = readJson(contextPath);

  const issues = [];

  // ─── Batch mode validation ──────────────────────────────────────────
  if (context.batch?.enabled) {
    const ticketIds = context.batch.ticket_ids || [];
    if (ticketIds.length === 0) {
      issues.push('batch.ticket_ids is empty');
    }

    // Check that all tickets have requirements
    for (const id of ticketIds) {
      const t = context.tickets?.[id];
      if (!t) {
        issues.push(`missing tickets.${id} entry`);
        continue;
      }
      if (!t.ticket) issues.push(`tickets.${id}.ticket is missing`);
      if (!t.fetch_status)
        issues.push(`tickets.${id}.fetch_status is missing`);
      if (t.design_source && !t.design)
        issues.push(
          `tickets.${id}.design_source is set but design is missing`,
        );
    }

    // Check architecture has batch_scopes
    if (context.architecture) {
      if (!context.architecture.batch_scopes)
        issues.push('architecture.batch_scopes is missing (required in batch mode)');
      if (context.architecture.file_plan) {
        const planIds = new Set(
          context.architecture.file_plan.map((f) => f.ticket_id).filter(Boolean),
        );
        for (const id of ticketIds) {
          if (!planIds.has(id))
            issues.push(
              `architecture.file_plan has no entries for ticket ${id}`,
            );
        }
      }
    }

    // Check implementation per ticket
    if (context.last_completed_phase >= 3) {
      for (const id of ticketIds) {
        if (!context.implementation?.[id])
          issues.push(`missing implementation.${id} (batch mode requires per-ticket slices)`);
      }
    }

    ok({
      ok: issues.length === 0,
      ticket_id: ticketId,
      batch_mode: true,
      batch_ticket_ids: ticketIds,
      last_completed_phase: context.last_completed_phase ?? null,
      issues,
      slices_present: Object.keys(context).filter(
        (k) => k !== '_merge_log' && !k.startsWith('_'),
      ),
    });
    return;
  }

  // ─── Single-ticket validation (existing logic) ─────────────────────
  // Check required top-level slices after Phase 1
  if (context.last_completed_phase >= 1) {
    if (!context.ticket) issues.push('missing "ticket" slice (Phase 1 output)');
    if (!context.fetch_status)
      issues.push('missing "fetch_status" slice (Phase 1 output)');
    if (context.design_source && !context.design)
      issues.push(
        'design_source is set but "design" slice is missing (Phase 1b output)',
      );
  }

  // Check architecture after Phase 2
  if (context.last_completed_phase >= 2) {
    if (!context.architecture)
      issues.push('missing "architecture" slice (Phase 2 output)');
    if (context.architecture && !context.architecture.file_plan)
      issues.push('architecture exists but missing file_plan');
    if (context.architecture && !context.architecture.wcag_requirements)
      issues.push('architecture exists but missing wcag_requirements');
  }

  // Check implementation after Phase 3
  if (context.last_completed_phase >= 3) {
    if (!context.implementation)
      issues.push('missing "implementation" slice (Phase 3 output)');
  }

  // Check QA after Phase 4
  if (context.last_completed_phase >= 4) {
    if (!context.qa) issues.push('missing "qa" slice (Phase 4 output)');
    if (context.qa && context.qa.passed === undefined)
      issues.push('qa slice exists but missing "passed" field');
  }

  ok({
    ok: issues.length === 0,
    ticket_id: ticketId,
    last_completed_phase: context.last_completed_phase ?? null,
    issues,
    slices_present: Object.keys(context).filter(
      (k) => k !== '_merge_log' && !k.startsWith('_'),
    ),
  });
}

function cmdLock(args) {
  const ticketId = args.ticket;
  if (!ticketId) fail('lock requires --ticket');
  acquireLock(ticketId);
  ok({ locked: true, ticket_id: ticketId, pid: process.pid });
}

function cmdUnlock(args) {
  const ticketId = args.ticket;
  if (!ticketId) fail('unlock requires --ticket');
  releaseLock(ticketId);
  ok({ unlocked: true, ticket_id: ticketId });
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(argv.slice(2));
  const cmd = args._[0];

  if (!cmd) {
    process.stderr.write(
      'Usage: context-merge <merge|read|validate|lock|unlock> [flags]\n',
    );
    exit(2);
  }

  try {
    switch (cmd) {
      case 'merge':
        return await cmdMerge(args);
      case 'read':
        return cmdRead(args);
      case 'validate':
        return cmdValidate(args);
      case 'lock':
        return cmdLock(args);
      case 'unlock':
        return cmdUnlock(args);
      default:
        fail(`unknown command "${cmd}"`);
    }
  } catch (err) {
    fail(err.message || String(err));
  }
}

main();

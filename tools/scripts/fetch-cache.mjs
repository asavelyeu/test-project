#!/usr/bin/env node
/**
 * fetch-cache — TTL-based cache for Jira / Confluence / Figma fetches.
 *
 * Consumed by .github/prompts/01-requirements.prompt.md and
 * .github/prompts/02-design-inspector.prompt.md. The orchestrator
 * (Phase 1.5 in 00-orchestrate.prompt.md) gates Phase 2 on a non-error
 * `fetch_status` slice in context.json.
 *
 * Commands:
 *   get        --key <s> [--ttl-seconds N]                  → hit | stale | miss
 *   set        --key <s> [--ttl-seconds N] [--source S]     → writes stdin JSON
 *   peek       --key <s>                                    → metadata only
 *   purge      --key <s>
 *   purge-all  [--older-than N]
 *   list
 *
 * Storage: .agent-run/cache/<sha1(key)>.json with
 *   { key, source, cached_at, ttl_seconds, payload }
 *
 * All commands print a single JSON object to stdout and exit 0 on success,
 * 1 on failure, 2 on usage error. Writes are atomic (tmp + rename).
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  readdirSync,
  unlinkSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { argv, exit, stdin } from 'node:process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');
const CACHE_ROOT = join(REPO_ROOT, '.agent-run', 'cache');
const DEFAULT_TTL_SECONDS = 60 * 60 * 6; // 6h

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

function ok(payload) {
  process.stdout.write(
    JSON.stringify({ ok: true, ...payload }, null, 2) + '\n',
  );
}

function fail(msg) {
  process.stderr.write(`fetch-cache: ${msg}\n`);
  process.stdout.write(
    JSON.stringify({ ok: false, error: msg }, null, 2) + '\n',
  );
  exit(1);
}

function nowIso() {
  return new Date().toISOString();
}

function hashKey(key) {
  return createHash('sha1').update(key).digest('hex');
}

function entryPath(key) {
  return join(CACHE_ROOT, hashKey(key) + '.json');
}

function writeJsonAtomic(p, obj) {
  mkdirSync(dirname(p), { recursive: true });
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  renameSync(tmp, p);
}

async function readStdin() {
  const chunks = [];
  for await (const c of stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function ageSeconds(entry) {
  return Math.floor((Date.now() - Date.parse(entry.cached_at)) / 1000);
}

function classify(entry, ttlOverride) {
  const ttl = ttlOverride ?? entry.ttl_seconds ?? DEFAULT_TTL_SECONDS;
  // Strict <: a TTL of 0 means "always stale" (forces refresh), and an
  // entry exactly at the TTL boundary is considered stale.
  return ageSeconds(entry) < ttl ? 'hit' : 'stale';
}

function parseTtl(args) {
  if (args['ttl-seconds'] === undefined || args['ttl-seconds'] === true) {
    return DEFAULT_TTL_SECONDS;
  }
  const n = Number.parseInt(String(args['ttl-seconds']), 10);
  if (!Number.isFinite(n) || n < 0) {
    fail('--ttl-seconds must be a non-negative integer');
  }
  return n;
}

function cmdGet(args) {
  const key = args.key;
  if (!key || key === true) fail('get requires --key <string>');
  const p = entryPath(key);
  if (!existsSync(p)) {
    ok({ key, status: 'miss' });
    return;
  }
  const entry = JSON.parse(readFileSync(p, 'utf8'));
  const ttl =
    args['ttl-seconds'] !== undefined && args['ttl-seconds'] !== true
      ? parseTtl(args)
      : (entry.ttl_seconds ?? DEFAULT_TTL_SECONDS);
  const status = classify(entry, ttl);
  ok({
    key,
    status,
    cached_at: entry.cached_at,
    age_seconds: ageSeconds(entry),
    ttl_seconds: ttl,
    source: entry.source ?? null,
    payload: status === 'hit' ? entry.payload : null,
  });
}

async function cmdSet(args) {
  const key = args.key;
  if (!key || key === true) fail('set requires --key <string>');
  const raw = (await readStdin()).trim();
  if (!raw) fail('set requires a JSON payload on stdin');
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    fail(`stdin is not valid JSON: ${e.message}`);
  }
  const entry = {
    key,
    source: args.source && args.source !== true ? String(args.source) : null,
    cached_at: nowIso(),
    ttl_seconds: parseTtl(args),
    payload,
  };
  writeJsonAtomic(entryPath(key), entry);
  ok({
    key,
    cached_at: entry.cached_at,
    ttl_seconds: entry.ttl_seconds,
    path: entryPath(key).replace(REPO_ROOT + '/', ''),
  });
}

function cmdPeek(args) {
  const key = args.key;
  if (!key || key === true) fail('peek requires --key <string>');
  const p = entryPath(key);
  if (!existsSync(p)) {
    ok({ key, status: 'miss' });
    return;
  }
  const entry = JSON.parse(readFileSync(p, 'utf8'));
  ok({
    key,
    status: classify(entry),
    cached_at: entry.cached_at,
    age_seconds: ageSeconds(entry),
    ttl_seconds: entry.ttl_seconds,
    source: entry.source ?? null,
  });
}

function cmdPurge(args) {
  const key = args.key;
  if (!key || key === true) fail('purge requires --key <string>');
  const p = entryPath(key);
  if (!existsSync(p)) {
    ok({ key, removed: false });
    return;
  }
  unlinkSync(p);
  ok({ key, removed: true });
}

function cmdPurgeAll(args) {
  if (!existsSync(CACHE_ROOT)) {
    ok({ removed: 0 });
    return;
  }
  const olderThan =
    args['older-than'] !== undefined && args['older-than'] !== true
      ? Number.parseInt(String(args['older-than']), 10)
      : null;
  let removed = 0;
  for (const f of readdirSync(CACHE_ROOT)) {
    if (!f.endsWith('.json')) continue;
    const full = join(CACHE_ROOT, f);
    if (olderThan != null) {
      try {
        const entry = JSON.parse(readFileSync(full, 'utf8'));
        if (ageSeconds(entry) < olderThan) continue;
      } catch {
        // corrupt — remove
      }
    }
    unlinkSync(full);
    removed++;
  }
  ok({ removed });
}

function cmdList() {
  if (!existsSync(CACHE_ROOT)) {
    ok({ entries: [] });
    return;
  }
  const entries = [];
  for (const f of readdirSync(CACHE_ROOT)) {
    if (!f.endsWith('.json')) continue;
    const full = join(CACHE_ROOT, f);
    try {
      const entry = JSON.parse(readFileSync(full, 'utf8'));
      entries.push({
        key: entry.key,
        status: classify(entry),
        source: entry.source ?? null,
        cached_at: entry.cached_at,
        age_seconds: ageSeconds(entry),
        ttl_seconds: entry.ttl_seconds,
        size_bytes: statSync(full).size,
      });
    } catch {
      entries.push({ file: f, corrupt: true });
    }
  }
  ok({ entries });
}

async function main() {
  const args = parseArgs(argv.slice(2));
  const cmd = args._[0];
  if (!cmd) {
    process.stderr.write(
      'Usage: fetch-cache <get|set|peek|purge|purge-all|list> [flags]\n',
    );
    exit(2);
  }
  try {
    switch (cmd) {
      case 'get':
        return cmdGet(args);
      case 'set':
        return await cmdSet(args);
      case 'peek':
        return cmdPeek(args);
      case 'purge':
        return cmdPurge(args);
      case 'purge-all':
        return cmdPurgeAll(args);
      case 'list':
        return cmdList();
      default:
        fail(`unknown command "${cmd}"`);
    }
  } catch (e) {
    fail(e.message || String(e));
  }
}

main();

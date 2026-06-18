#!/usr/bin/env node
/**
 * contrast-check — pure WCAG contrast-ratio utilities + CLI.
 *
 * Dual use:
 *   1. Imported by `<component>.contrast.spec.ts` unit tests (see
 *      .github/prompts/04-implement-core.prompt.md).
 *   2. CLI used by the wcag-auditor subagent (Check 5 in
 *      .github/prompts/07b-wcag-auditor.prompt.md).
 *
 * Exports: contrastRatio, parseColor, relativeLuminance, thresholdFor,
 *          auditPairs, AA_NORMAL, AA_LARGE, AA_UI.
 *
 * CLI:
 *   ratio --fg <c> --bg <c> [--kind normal_text|large_text|ui]
 *   audit --pairs <path|->     # stdin or file path; JSON array of
 *                              # { name?, fg, bg, kind? }
 *
 * Exit 0 when all checks pass, 1 on any failure, 2 on usage error.
 */
import { readFileSync } from 'node:fs';
import { argv, exit, stdin } from 'node:process';

export const AA_NORMAL = 4.5;
export const AA_LARGE = 3.0;
export const AA_UI = 3.0;

const HEX_SHORT = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX_FULL = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i;
const RGB_FN =
  /^rgba?\(\s*(-?[\d.]+%?)\s*[,\s]\s*(-?[\d.]+%?)\s*[,\s]\s*(-?[\d.]+%?)\s*(?:[,/]\s*(-?[\d.]+%?))?\s*\)$/i;

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));
const numOrPct = (raw) =>
  raw.endsWith('%') ? (Number(raw.slice(0, -1)) / 100) * 255 : Number(raw);

export function parseColor(input) {
  if (!input || typeof input !== 'string') {
    throw new Error(
      `parseColor: expected non-empty string, got ${typeof input}`,
    );
  }
  const raw = input.trim();
  let m = HEX_FULL.exec(raw);
  if (m) {
    return {
      r: parseInt(m[1], 16),
      g: parseInt(m[2], 16),
      b: parseInt(m[3], 16),
      a: m[4] ? parseInt(m[4], 16) / 255 : 1,
    };
  }
  m = HEX_SHORT.exec(raw);
  if (m) {
    return {
      r: parseInt(m[1] + m[1], 16),
      g: parseInt(m[2] + m[2], 16),
      b: parseInt(m[3] + m[3], 16),
      a: 1,
    };
  }
  m = RGB_FN.exec(raw);
  if (m) {
    let a = 1;
    if (m[4] != null) {
      a = m[4].endsWith('%') ? Number(m[4].slice(0, -1)) / 100 : Number(m[4]);
    }
    return {
      r: clamp255(numOrPct(m[1])),
      g: clamp255(numOrPct(m[2])),
      b: clamp255(numOrPct(m[3])),
      a,
    };
  }
  throw new Error(`parseColor: unsupported color "${input}"`);
}

function srgb(channel) {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance({ r, g, b }) {
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

function compositeOver(fg, bg) {
  if (fg.a >= 1) return fg;
  const a = fg.a;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1,
  };
}

export function contrastRatio(fgInput, bgInput) {
  const bg = parseColor(bgInput);
  if (bg.a < 1) {
    throw new Error('contrastRatio: background must be fully opaque (alpha=1)');
  }
  const fg = compositeOver(parseColor(fgInput), bg);
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function thresholdFor(kind) {
  switch (kind) {
    case 'large_text':
      return AA_LARGE;
    case 'ui':
      return AA_UI;
    case 'normal_text':
    case undefined:
    case null:
      return AA_NORMAL;
    default:
      throw new Error(`thresholdFor: unknown kind "${kind}"`);
  }
}

export function auditPairs(pairs) {
  if (!Array.isArray(pairs)) {
    throw new Error('auditPairs: expected an array');
  }
  return pairs.map((p, i) => {
    if (!p || typeof p !== 'object') {
      throw new Error(`auditPairs: pair[${i}] is not an object`);
    }
    const ratio = contrastRatio(p.fg, p.bg);
    const kind = p.kind || 'normal_text';
    const required = thresholdFor(kind);
    return {
      name: p.name ?? `pair[${i}]`,
      fg: p.fg,
      bg: p.bg,
      kind,
      ratio: Math.round(ratio * 100) / 100,
      required,
      passes: ratio + 1e-9 >= required,
    };
  });
}

// ---------- CLI ----------

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

async function readStdin() {
  const chunks = [];
  for await (const c of stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function emit(payload, code) {
  process.stdout.write(
    JSON.stringify({ ok: code === 0, ...payload }, null, 2) + '\n',
  );
  if (code !== 0) exit(code);
}

function fail(msg) {
  process.stderr.write(`contrast-check: ${msg}\n`);
  process.stdout.write(
    JSON.stringify({ ok: false, error: msg }, null, 2) + '\n',
  );
  exit(1);
}

async function main() {
  // Allow the module to be imported without running CLI.
  const invokedAsScript =
    process.argv[1] && process.argv[1].endsWith('contrast-check.mjs');
  if (!invokedAsScript) return;

  const args = parseArgs(argv.slice(2));
  const cmd = args._[0];
  if (!cmd) {
    process.stderr.write('Usage: contrast-check <ratio|audit> [flags]\n');
    exit(2);
  }
  try {
    if (cmd === 'ratio') {
      const fg = args.fg;
      const bg = args.bg;
      if (!fg || !bg || fg === true || bg === true) {
        fail('ratio requires --fg <color> and --bg <color>');
      }
      const kind = typeof args.kind === 'string' ? args.kind : 'normal_text';
      const ratio = contrastRatio(fg, bg);
      const required = thresholdFor(kind);
      const passes = ratio + 1e-9 >= required;
      emit(
        {
          fg,
          bg,
          kind,
          ratio: Math.round(ratio * 100) / 100,
          required,
          passes,
        },
        passes ? 0 : 1,
      );
      return;
    }
    if (cmd === 'audit') {
      const src = args.pairs;
      if (!src || src === true) fail('audit requires --pairs <path|->');
      const raw = src === '-' ? await readStdin() : readFileSync(src, 'utf8');
      let pairs;
      try {
        pairs = JSON.parse(raw);
      } catch (e) {
        fail(`invalid JSON: ${e.message}`);
      }
      const results = auditPairs(pairs);
      const failed = results.filter((r) => !r.passes);
      emit(
        { total: results.length, failed: failed.length, results },
        failed.length === 0 ? 0 : 1,
      );
      return;
    }
    fail(`unknown command "${cmd}"`);
  } catch (e) {
    fail(e.message || String(e));
  }
}

main();

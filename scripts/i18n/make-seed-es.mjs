#!/usr/bin/env node
// Builds packages/db/seed-es.ts (Latin American Spanish demo clinic) from
// packages/db/seed.ts, following the approach of the Japanese seed in
// katsushi2441/openvpm-jp. seed.ts stays the source of truth: re-run this
// script whenever it changes.
//
//   node scripts/i18n/make-seed-es.mjs --extract
//       writes scripts/i18n/out/seed-candidates.json with every visible string
//       literal of seed.ts that still needs a Spanish value
//   node scripts/i18n/make-seed-es.mjs
//       writes packages/db/seed-es.ts using scripts/i18n/seed_es_strings.json
//
// Only string literals are replaced, by exact match. Enum values, e-mail
// addresses, URLs and identifiers are never candidates.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "apps/web/package.json"));
const ts = require("typescript");

const SRC = path.join(ROOT, "packages/db/seed.ts");
const DST = path.join(ROOT, "packages/db/seed-es.ts");
const STRINGS = path.join(ROOT, "scripts/i18n/seed_es_strings.json");
const CANDIDATES = path.join(ROOT, "scripts/i18n/out/seed-candidates.json");

const source = fs.readFileSync(SRC, "utf8");
const sf = ts.createSourceFile(SRC, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function isCandidate(text) {
  if (!/[A-Za-z]/.test(text)) return false;
  if (/^[a-z0-9_.:-]+$/.test(text)) return false; // enum values, keys, ids
  if (/@|https?:\/\//.test(text)) return false; // e-mails, URLs
  if (/^\$2[aby]\$/.test(text)) return false; // password hashes
  if (/^[A-Z0-9_-]+$/.test(text) && text.length <= 3) return false; // short codes
  if (/^(dotenv|crypto|\.\/|\.\.\/)/.test(text)) return false; // imports
  return true;
}

/** literal nodes, skipping import specifiers */
const literals = [];
const visit = (node) => {
  if (ts.isImportDeclaration(node)) return;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) literals.push(node);
  ts.forEachChild(node, visit);
};
visit(sf);

if (process.argv.includes("--extract")) {
  const known = fs.existsSync(STRINGS) ? JSON.parse(fs.readFileSync(STRINGS, "utf8")) : {};
  const out = {};
  for (const node of literals) {
    const text = node.text;
    if (!isCandidate(text) || text in known || text in out) continue;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    out[text] = `packages/db/seed.ts:${line + 1}`;
  }
  fs.mkdirSync(path.dirname(CANDIDATES), { recursive: true });
  fs.writeFileSync(CANDIDATES, JSON.stringify(out, null, 2) + "\n");
  console.log(`${Object.keys(out).length} strings need a Spanish value -> ${path.relative(ROOT, CANDIDATES)}`);
  process.exit(0);
}

const strings = JSON.parse(fs.readFileSync(STRINGS, "utf8"));
const edits = [];
for (const node of literals) {
  const value = strings[node.text];
  if (value === undefined || value === node.text) continue;
  const quote = ts.isNoSubstitutionTemplateLiteral(node) ? "`" : '"';
  const escaped = quote === "`" ? value.replace(/[`\\$]/g, (c) => `\\${c}`) : JSON.stringify(value).slice(1, -1);
  edits.push({ start: node.getStart(), end: node.getEnd(), text: `${quote}${escaped}${quote}` });
}
edits.sort((a, b) => b.start - a.start);
let output = source;
for (const e of edits) output = output.slice(0, e.start) + e.text + output.slice(e.end);

const header =
  "// Spanish (Latin America) demo clinic. Generated from seed.ts by\n" +
  "// scripts/i18n/make-seed-es.mjs and scripts/i18n/seed_es_strings.json — do not edit by hand.\n";
fs.writeFileSync(DST, header + output);
console.log(`${edits.length} strings replaced -> ${path.relative(ROOT, DST)}`);

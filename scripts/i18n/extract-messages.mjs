#!/usr/bin/env node
// Collects every UI message id: the literal first argument of tx("...") calls
// in apps/web (and packages/email), plus the keys of existing catalogs, which
// also hold values translated through txv() (status values, tab labels).
//
// Usage: node scripts/i18n/extract-messages.mjs [--out scripts/i18n/messages_en.json]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "apps/web/package.json"));
const ts = require("typescript");

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const OUT = path.resolve(ROOT, outIdx >= 0 ? args[outIdx + 1] : "scripts/i18n/messages_en.json");

const SOURCE_DIRS = ["apps/web/app", "apps/web/components", "apps/web/lib", "apps/web/server", "packages/email/src"];
const CALLEES = new Set(["tx", "t"]);
const CATALOG_DIR = path.join(ROOT, "apps/web/lib/i18n/messages");

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      yield* walk(p);
    } else if (/\.(tsx?|mts)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      yield p;
    }
  }
}

/** message -> first "file:line" where it appears */
const fromCode = new Map();
for (const dir of SOURCE_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const text = fs.readFileSync(file, "utf8");
    if (!/\b(tx|t)\(/.test(text)) continue;
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        CALLEES.has(node.expression.text) &&
        node.arguments.length > 0 &&
        (ts.isStringLiteral(node.arguments[0]) || ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))
      ) {
        const msg = node.arguments[0].text;
        if (!fromCode.has(msg)) {
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
          fromCode.set(msg, `${path.relative(ROOT, file).replaceAll("\\", "/")}:${line + 1}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
}

// Keys already present in other catalogs (e.g. txv() status values) that the
// literal scan cannot see.
const fromCatalogs = new Set();
for (const name of fs.readdirSync(CATALOG_DIR)) {
  if (!name.endsWith(".json")) continue;
  for (const key of Object.keys(JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, name), "utf8")))) fromCatalogs.add(key);
}

const out = {};
for (const [msg, where] of [...fromCode.entries()].sort(([a], [b]) => a.localeCompare(b))) out[msg] = where;
let catalogOnly = 0;
for (const key of [...fromCatalogs].sort()) {
  if (!(key in out)) {
    out[key] = "catalog";
    catalogOnly++;
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`${fromCode.size} messages from tx() calls, ${catalogOnly} more from existing catalogs -> ${path.relative(ROOT, OUT)}`);

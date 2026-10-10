#!/usr/bin/env node
// Validates a translation catalog against the English message list.
// Rejected entries stay out of the catalog (the English text is shown) and are
// written to scripts/i18n/out/<lang>-rejects.json for review.
//
// Usage: node scripts/i18n/validate.mjs <lang> [--fix]
//   --fix  remove rejected entries from the catalog file
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const [lang, ...flags] = process.argv.slice(2);
if (!lang) {
  console.error("usage: validate.mjs <lang> [--fix]");
  process.exit(2);
}
const FIX = flags.includes("--fix");
const CATALOG = path.join(ROOT, "apps/web/lib/i18n/messages", `${lang}.json`);
const MESSAGES = path.join(ROOT, "scripts/i18n/messages_en.json");
const REJECTS = path.join(ROOT, "scripts/i18n/out", `${lang}-rejects.json`);

const messages = JSON.parse(fs.readFileSync(MESSAGES, "utf8"));
const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

// Kept verbatim in every language.
const PROPER_NOUNS = ["OpenVPM", "Stripe", "Telnyx", "Twilio", "IDEXX", "Antech", "Zoetis", "SOAP", "CSV", "PDF", "JSON", "API"];
// Spain-only or "vosotros" forms that must not appear in Latin American Spanish.
const FORBIDDEN = lang.startsWith("es")
  ? [/\bvosotr[oa]s\b/i, /\bordenador(es)?\b/i, /\bm[oó]vil(es)?\b/i, /\bcoger\b/i, /\bfichero(s)?\b/i, /\b(hab[eé]is|ten[eé]is|pod[eé]is|quer[eé]is)\b/i]
  : [];

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const numbers = (s) => [...s.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => m[0].replace(",", ".")).sort().join(",");
const urls = (s) => [...s.matchAll(/https?:\/\/\S+/g)].map((m) => m[0]).sort().join(",");
const count = (s, ch) => s.split(ch).length - 1;

const rejects = [];
for (const [key, value] of Object.entries(catalog)) {
  const reasons = [];
  if (!(key in messages)) reasons.push("clave que no existe en messages_en.json");
  if (typeof value !== "string") reasons.push("valor que no es texto");
  else {
    if (placeholders(key) !== placeholders(value)) reasons.push("marcadores {…} distintos");
    if (numbers(key) !== numbers(value)) reasons.push("números distintos");
    if (urls(key) !== urls(value)) reasons.push("URLs distintas");
    if (count(key, "$") !== count(value, "$")) reasons.push("cantidad de $ distinta");
    if (count(key, "%") !== count(value, "%")) reasons.push("cantidad de % distinta");
    for (const noun of PROPER_NOUNS) {
      if (new RegExp(`\\b${noun}\\b`).test(key) && !value.includes(noun)) reasons.push(`falta "${noun}"`);
    }
    for (const re of FORBIDDEN) if (re.test(value)) reasons.push(`término prohibido (${re.source})`);
    if (value.trim() === "" && key.trim() !== "" && !["s", "es"].includes(key)) reasons.push("traducción vacía");
  }
  if (reasons.length) rejects.push({ key, value, where: messages[key] ?? null, reasons });
}

fs.mkdirSync(path.dirname(REJECTS), { recursive: true });
fs.writeFileSync(REJECTS, JSON.stringify(rejects, null, 2) + "\n");
if (FIX && rejects.length) {
  for (const r of rejects) delete catalog[r.key];
  const sorted = Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(CATALOG, JSON.stringify(sorted, null, 2) + "\n");
}

const total = Object.keys(messages).length;
const ok = Object.keys(catalog).length - (FIX ? 0 : rejects.length);
console.log(`${lang}: ${ok}/${total} messages translated and valid, ${rejects.length} rejected -> ${path.relative(ROOT, REJECTS)}`);
process.exitCode = rejects.length && !FIX ? 1 : 0;

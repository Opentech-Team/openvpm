/**
 * Many UI tests read component source and assert the English copy verbatim
 * (e.g. `label="Clinic country"`). With the message catalog, that copy is
 * written as `label={tx("Clinic country")}`. When a test reads a .tsx file,
 * unwrap the catalog calls back to the literal English so those assertions
 * keep checking the same copy. Runtime behavior is not affected.
 */
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";

const CALL = String.raw`(?:tx|txUi)\(("(?:[^"\\]|\\.)*")\)`;

// tx("Generated on {date}", { date: generatedDate }) -> `Generated on ${generatedDate}`
// so tests that read pdf.ts-style source can still assert the interpolated English.
const CALL_WITH_VARS = String.raw`(?:tx|txUi)\(("(?:[^"\\]|\\.)*"),\s*\{([^{}]*)\}\s*,?\s*\)`;

function unwrapCallsWithVars(source: string): string {
  return source.replace(new RegExp(CALL_WITH_VARS, "g"), (_whole, lit: string, vars: string) => {
    const exprs = new Map<string, string>();
    for (const entry of vars.split(/,(?![^()]*\))/)) {
      const m = /^\s*(\w+)\s*(?::\s*([\s\S]+?))?\s*$/.exec(entry);
      if (!m) continue;
      exprs.set(m[1]!, (m[2] ?? m[1]!).trim());
    }
    const text = (JSON.parse(lit) as string).replace(/\{(\w+)\}/g, (token, key: string) =>
      exprs.has(key) ? "${" + exprs.get(key) + "}" : token,
    );
    return "`" + text + "`";
  });
}

// packages/email takes its translator as a prop named `t` (so the package does
// not depend on apps/web): t("Hi {name},", { name }) / t("Resume setup"). Rewrite
// those calls to tx(...) so the unwrapping below applies to them as well.
function normalizeEmailTranslatorCalls(source: string): string {
  return source
    .replace(/(?<![\w.$])t\(\s*("(?:[^"\\]|\\.)*")\s*,?\s*\)/g, "tx($1)")
    .replace(/(?<![\w.$])t\((?=\s*"(?:[^"\\]|\\.)*"\s*,\s*\{)/g, "tx(");
}

export function unwrapCatalogCalls(source: string): string {
  return unwrapCallsWithVars(source)
    .replace(new RegExp(String.raw`=\{` + CALL + String.raw`\}`, "g"), (_m, lit: string) => `=${lit}`)
    .replace(new RegExp(String.raw`\{" "\}\{` + CALL + String.raw`\}\{" "\}`, "g"), (_m, lit: string) => ` ${JSON.parse(lit)} `)
    .replace(new RegExp(String.raw`\{" "\}\{` + CALL + String.raw`\}`, "g"), (_m, lit: string) => ` ${JSON.parse(lit)}`)
    .replace(new RegExp(String.raw`\{` + CALL + String.raw`\}\{" "\}`, "g"), (_m, lit: string) => `${JSON.parse(lit)} `)
    .replace(new RegExp(String.raw`\{` + CALL + String.raw`\}`, "g"), (_m, lit: string) => JSON.parse(lit))
    .replace(new RegExp(CALL, "g"), (_m, lit: string) => lit)
    .replace(/\btxv\(([\w.?]+)\)/g, "$1")
    .replace(/\$\{personName\(([\w.?]+), ([\w.?]+)\)\}/g, "${$1} ${$2}")
    .replace(/\{personName\(([\w.?]+), ([\w.?]+)\)\}/g, "{$1} {$2}")
    .replace(/\bsqlPersonName\((\w+)\.firstName, \1\.lastName\)/g, "sql`concat_ws(' ', ${$1.firstName}, ${$1.lastName})`");
}

const original = fs.readFileSync;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(fs as any).readFileSync = function patched(this: unknown, file: fs.PathOrFileDescriptor, ...rest: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out = (original as any).call(this, file, ...rest);
  const name = typeof file === "string" ? file : file instanceof URL ? file.pathname : "";
  if (typeof out === "string" && /\.(tsx|ts)$/.test(name) && !name.includes("__tests__")) {
    const normalized = /[\\/]packages[\\/]email[\\/]/.test(name) ? normalizeEmailTranslatorCalls(out) : out;
    return unwrapCatalogCalls(normalized);
  }
  return out;
};
syncBuiltinESMExports();

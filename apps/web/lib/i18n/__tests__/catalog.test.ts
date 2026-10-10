import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { catalogChain, lookup } from "../index";
import es from "../messages/es.json";
import esVE from "../messages/es-VE.json";

const ROOT = path.resolve(__dirname, "../../../../..");
const MESSAGES_FILE = path.join(ROOT, "scripts/i18n/messages_en.json");
const messages: Record<string, string> = fs.existsSync(MESSAGES_FILE)
  ? JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf8"))
  : {};

const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

describe("i18n catalogs", () => {
  it.each([
    ["es", es as Record<string, string>],
    ["es-VE", esVE as Record<string, string>],
  ])("%s keys are English messages used by the app", (_lang, catalog) => {
    const unknown = Object.keys(catalog).filter((key) => !(key in messages));
    expect(unknown).toEqual([]);
  });

  it.each([
    ["es", es as Record<string, string>],
    ["es-VE", esVE as Record<string, string>],
  ])("%s keeps every {placeholder}", (_lang, catalog) => {
    const broken = Object.entries(catalog).filter(([key, value]) => placeholders(key) !== placeholders(value));
    expect(broken).toEqual([]);
  });

  it("es-VE only overrides terms and falls back to es, then English", () => {
    const chain = catalogChain("es-ve");
    expect(chain).toHaveLength(2);
    const regional = { Prescription: "Récipe" };
    const base = { Prescription: "Receta", Patients: "Pacientes" };
    expect(lookup("Prescription", [regional, base])).toBe("Récipe");
    expect(lookup("Patients", [regional, base])).toBe("Pacientes");
    expect(lookup("Not translated", [regional, base])).toBeUndefined();
  });

  it("unknown or English UI languages have no catalogs", () => {
    expect(catalogChain("en")).toEqual([]);
    expect(catalogChain("xx-yy")).toEqual([]);
  });

  it("es-VE says récipe wherever Venezuelan Spanish differs", () => {
    for (const [key, value] of Object.entries(esVE as Record<string, string>)) {
      if (/\bprescriptions?\b/i.test(key)) expect(value).toMatch(/r[ée]cipe/i);
    }
  });
});

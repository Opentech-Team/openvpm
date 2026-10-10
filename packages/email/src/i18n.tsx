import * as React from "react";

/**
 * Minimal translator signature. English is the canonical source language: the
 * English text itself is the message id, and `{name}` placeholders are filled
 * from `vars`. The app passes its own catalog-backed translator; this package
 * never depends on the app.
 */
export type Translate = (
  message: string,
  vars?: Record<string, string | number>,
) => string;

/** Default translator: returns the English message with placeholders filled. */
export const identity: Translate = (message, vars) =>
  vars
    ? message.replace(/\{(\w+)\}/g, (whole, key: string) =>
        key in vars ? String(vars[key]) : whole,
      )
    : message;

/**
 * Translate one sentence that embeds React nodes (e.g. a <strong> value).
 * The message keeps the `{key}` placeholders for both `vars` and `nodes`, so
 * translators see — and can reorder — the whole sentence. Placeholders that
 * `vars` does not fill stay in the translated string and are swapped for the
 * matching node afterwards.
 */
export function tNodes(
  t: Translate,
  message: string,
  vars: Record<string, string | number>,
  nodes: Record<string, React.ReactNode>,
): React.ReactNode[] {
  return t(message, vars)
    .split(/(\{\w+\})/)
    .map((part, i) => {
      const key = /^\{(\w+)\}$/.exec(part)?.[1];
      return key !== undefined && key in nodes ? (
        <React.Fragment key={i}>{nodes[key]}</React.Fragment>
      ) : (
        part
      );
    });
}

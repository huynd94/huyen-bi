// Feature: post-opus-audit-remediation, Property 1: escapeHtml encoding correctness
//
// Validates: Requirements 3.1
//
// Property 1: escapeHtml encoding correctness — for any string `s`:
//   (1) escapeHtml(s) contains no raw `<`, `>`, `"`, `'`
//   (2) Every `&` in the output is immediately followed by a recognized entity
//       name (e.g. `amp;`, `lt;`, `gt;`, `quot;`) or a numeric reference
//       (e.g. `#39;`, `#x27;`)
//   (3) Round-trip decoding of the output reproduces `s`
//
// We deliberately handle the decode as a single left-to-right regex pass so
// that an encoded sequence like `&amp;lt;` (the escaping of the raw literal
// `&lt;`) round-trips back to `&lt;` — a naive sequential `.replace` chain
// would incorrectly double-decode it.
import assert from "node:assert/strict";
import fc from "fast-check";
import { escapeHtml } from "./escape-html";

/**
 * Inverse of escapeHtml. Single-pass replacement ensures we never decode the
 * inner entity form inside an already-decoded `&amp;`.
 */
function decodeEntities(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|#39);/g, (match, entity: string) => {
    switch (entity) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "#39":
        return "'";
      default:
        return match;
    }
  });
}

/**
 * Matches the *body* that must immediately follow every `&` in valid HTML-
 * encoded output: a named entity, a decimal numeric reference, or a hex
 * numeric reference — in all cases terminated by `;`.
 */
const VALID_ENTITY_AFTER_AMP = /^(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);/;

fc.assert(
  fc.property(fc.string(), (s) => {
    const encoded = escapeHtml(s);

    // (1) No raw sensitive chars survived.
    assert.equal(
      encoded.indexOf("<"),
      -1,
      `raw '<' leaked into output: ${JSON.stringify(encoded)} (input: ${JSON.stringify(s)})`,
    );
    assert.equal(
      encoded.indexOf(">"),
      -1,
      `raw '>' leaked into output: ${JSON.stringify(encoded)} (input: ${JSON.stringify(s)})`,
    );
    assert.equal(
      encoded.indexOf('"'),
      -1,
      `raw '"' leaked into output: ${JSON.stringify(encoded)} (input: ${JSON.stringify(s)})`,
    );
    assert.equal(
      encoded.indexOf("'"),
      -1,
      `raw "'" leaked into output: ${JSON.stringify(encoded)} (input: ${JSON.stringify(s)})`,
    );

    // (2) Every `&` is the start of a well-formed entity reference.
    for (let i = 0; i < encoded.length; i++) {
      if (encoded[i] !== "&") continue;
      const tail = encoded.slice(i + 1);
      assert.ok(
        VALID_ENTITY_AFTER_AMP.test(tail),
        `bare '&' at index ${i} of ${JSON.stringify(encoded)} (input: ${JSON.stringify(s)})`,
      );
    }

    // (3) Round-trip decode reproduces the original.
    assert.equal(
      decodeEntities(encoded),
      s,
      `round-trip failed: encoded=${JSON.stringify(encoded)} decoded=${JSON.stringify(decodeEntities(encoded))} input=${JSON.stringify(s)}`,
    );
  }),
  { numRuns: 100 },
);

console.log("escape-html: ok");

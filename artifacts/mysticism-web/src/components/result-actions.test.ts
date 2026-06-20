import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Window } from "happy-dom";

import { buildPrintDocument } from "./result-actions";

const source = await readFile(new URL("./result-actions.tsx", import.meta.url), "utf8");

assert.equal(
  /document\.write|\.innerHTML\s*=|dangerouslySetInnerHTML/.test(source),
  false,
  "ResultActions print/export path must not use document.write, innerHTML, or dangerouslySetInnerHTML",
);

const win = new Window();
const doc = win.document;

buildPrintDocument(doc as unknown as Document, {
  title: '<img src=x onerror="alert(1)">',
  moduleName: '<script>alert("module")</script>',
  result: '<svg onload="alert(1)"></svg>\nPlain result',
  dateLabel: "19/06/2026 16:20",
});

assert.equal(doc.querySelector("img"), null, "malicious title must render as text, not an image");
assert.equal(doc.querySelector("script"), null, "malicious module name must render as text, not script");
assert.equal(doc.querySelector("svg"), null, "malicious result must render as text, not svg");
assert.match(doc.querySelector("h1")?.textContent ?? "", /<img src=x/, "title text is preserved");
assert.match(doc.querySelector(".meta")?.textContent ?? "", /<script>alert/, "module text is preserved");
assert.match(doc.querySelector(".content")?.textContent ?? "", /<svg onload/, "result text is preserved");
assert.match(doc.title, /<img src=x/, "document title setter must keep text content safe");

console.log("result-actions: ok");

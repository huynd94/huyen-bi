import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer } from "./markdown-renderer";

const malicious = 'Hello <img src=x onerror="alert(1)"> **safe** `code`';
const html = renderToStaticMarkup(
  React.createElement(MarkdownRenderer, { content: malicious }),
);

assert.equal(html.includes("<img"), false, "raw HTML tags must not be rendered");
assert.match(html, /&lt;img/, "HTML input should be escaped as text");
assert.match(html, /<strong>safe<\/strong>/, "basic bold markdown should still render");
assert.match(html, /<code>code<\/code>/, "basic code markdown should still render");

const linkCases = renderToStaticMarkup(
  React.createElement(MarkdownRenderer, {
    content: [
      "[bad-js](javascript:alert(1))",
      "[bad-data](data:text/html,<script>alert(1)</script>)",
      "[bad-vb](vbscript:msgbox(1))",
      "[safe-https](https://example.com/path)",
      "[safe-relative](/lich-su)",
      "[safe-hash](#ket-qua)",
      "[safe-mail](mailto:test@example.com)",
      "[safe-tel](tel:+84123456789)",
    ].join("\n\n"),
  }),
);

assert.equal(
  linkCases.includes('href="javascript:alert(1)"'),
  false,
  "javascript: links must not be rendered as clickable anchors",
);
assert.equal(
  linkCases.includes('href="data:text/html'),
  false,
  "data: links must not be rendered as clickable anchors",
);
assert.equal(
  linkCases.includes('href="vbscript:msgbox(1)"'),
  false,
  "vbscript: links must not be rendered as clickable anchors",
);
assert.match(linkCases, />bad-js<\//, "blocked javascript label remains visible as text");
assert.match(linkCases, /href="https:\/\/example\.com\/path"/, "https links remain clickable");
assert.match(linkCases, /href="\/lich-su"/, "relative links remain clickable");
assert.match(linkCases, /href="#ket-qua"/, "hash links remain clickable");
assert.match(linkCases, /href="mailto:test@example\.com"/, "mailto links remain clickable");
assert.match(linkCases, /href="tel:\+84123456789"/, "tel links remain clickable");

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

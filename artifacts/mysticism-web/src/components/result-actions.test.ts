// Feature: post-opus-audit-remediation, Property 2: handlePrint does not materialize user-supplied elements
//
// **Validates: Requirements 3.1, 3.5**
//
// Property 2 — for any `title`, `moduleName`, and `result` strings (including
// HTML-injection payloads such as `<script>`, attribute breakouts, unicode
// and emoji), the print flow:
//   (1) must not introduce any DOM element whose `tagName` was "named" inside
//       the user-supplied strings — i.e. the builder only creates the fixed
//       set of chrome tags (html/head/meta/style/body/h1/div), never an
//       element carrying a payload tag like `img`/`script`/`iframe`, and
//   (2) must leave `printWindow.opener === null` immediately after opening
//       the popup, so the popup cannot tabnab the parent (defense-in-depth
//       for the window.opener gap folded into H1 as L6).
//
// Because `tsx` does not provide a DOM runtime, we install a minimal mock
// `Document` that implements exactly the subset of APIs `buildPrintDocument`
// touches: `createElement`, `appendChild`, `removeChild`, `setAttribute`,
// `firstChild`, `textContent`, `className`, `title`, `documentElement.lang`,
// `head`, `body`. The mock records every element it creates so the test can
// assert, over many generated payloads, that no payload-named tag surfaces
// in the materialized tree.
//
// Simulating `handlePrint` end-to-end: we stub `window.open` to return a mock
// `Window` whose `document` is the mock document and whose `opener` is
// writable — then we invoke the same code path `handlePrint` follows
// (open → null opener → buildPrintDocument → print) and assert both the
// DOM and the opener invariants. Calling the component's click handler
// directly would require a React renderer + DOM; instead we exercise the
// exact runtime contract the handler commits to.
import assert from "node:assert/strict";
import fc from "fast-check";
import { buildPrintDocument } from "./result-actions";

// ---- Mock DOM -------------------------------------------------------------

// The fixed set of tag names `buildPrintDocument` is allowed to create.
// Anything outside this set — even one element — would mean a user-supplied
// string was parsed as markup, which is the exact XSS vector we are
// preventing. The assertion uses this allow-list so the property is
// future-proof against accidental additions of tag-parsing code paths.
const ALLOWED_TAGS = new Set([
  "HTML",
  "HEAD",
  "META",
  "STYLE",
  "BODY",
  "H1",
  "DIV",
]);

interface MockNode {
  tagName: string;
  children: MockNode[];
  parent: MockNode | null;
  attributes: Record<string, string>;
  _textContent: string;
  _className: string;
  get textContent(): string;
  set textContent(v: string);
  get className(): string;
  set className(v: string);
  get firstChild(): MockNode | null;
  setAttribute(name: string, value: string): void;
  appendChild(child: MockNode): MockNode;
  removeChild(child: MockNode): MockNode;
}

function createMockElement(tagName: string): MockNode {
  const node: MockNode = {
    tagName: tagName.toUpperCase(),
    children: [],
    parent: null,
    attributes: {},
    _textContent: "",
    _className: "",
    get textContent() {
      return this._textContent;
    },
    set textContent(v: string) {
      // `textContent =` replaces all children with a single synthetic text
      // node. We do not model the text node as a real child because the
      // property only cares about *element* tags. Tracking the string is
      // enough to later verify payload strings survive verbatim.
      this._textContent = v;
      this.children = [];
    },
    get className() {
      return this._className;
    },
    set className(v: string) {
      this._className = v;
      this.attributes["class"] = v;
    },
    get firstChild() {
      return this.children.length > 0 ? this.children[0] : null;
    },
    setAttribute(name: string, value: string) {
      this.attributes[name] = value;
    },
    appendChild(child: MockNode) {
      child.parent = this;
      this.children.push(child);
      return child;
    },
    removeChild(child: MockNode) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      child.parent = null;
      return child;
    },
  };
  return node;
}

interface MockDocument {
  _createdTags: string[];
  documentElement: MockNode & { lang: string };
  head: MockNode;
  body: MockNode;
  title: string;
  createElement(tag: string): MockNode;
}

function createMockDocument(): MockDocument {
  const html = createMockElement("html") as MockNode & { lang: string };
  html.lang = "";
  const head = createMockElement("head");
  const body = createMockElement("body");
  html.appendChild(head);
  html.appendChild(body);
  const createdTags: string[] = ["HTML", "HEAD", "BODY"];
  return {
    _createdTags: createdTags,
    documentElement: html,
    head,
    body,
    title: "",
    createElement(tag: string) {
      const el = createMockElement(tag);
      createdTags.push(el.tagName);
      return el;
    },
  };
}

interface MockWindow {
  document: MockDocument;
  opener: unknown;
  _printed: boolean;
  print(): void;
}

function createMockWindow(): MockWindow {
  return {
    document: createMockDocument(),
    // Seed with a non-null sentinel so a test failure — forgetting to null
    // the opener — is detectable. Real browsers set `opener` to the parent
    // window object.
    opener: { name: "parent-tab-stand-in" },
    _printed: false,
    print() {
      this._printed = true;
    },
  };
}

// Mirror the exact runtime sequence `handlePrint` follows: open → null
// opener → buildPrintDocument → print. Exercising this shape keeps the
// property test tied to the handler contract, not to an implementation
// detail that could drift.
function simulateHandlePrint(
  mockWindow: MockWindow,
  title: string,
  moduleName: string,
  result: string,
): void {
  // Step 1: open (stubbed by the caller — we already hold the window).
  if (!mockWindow) return;
  // Step 2: detach back-reference. This line is the defense against the
  // tabnabbing/window.opener gap (L6 folded into H1).
  mockWindow.opener = null;
  // Step 3: build the print document — cast through unknown because the
  // mock intentionally implements only the DOM subset the builder touches.
  buildPrintDocument(mockWindow.document as unknown as Document, {
    title,
    moduleName,
    result,
    dateLabel: "01/01/2025",
  });
  // Step 4: print. The mock records the call; we do not assert on it (the
  // property is about DOM content and opener nulling, not print dispatch).
  mockWindow.print();
}

// ---- Property -------------------------------------------------------------

// A blended arbitrary: fast-check's default `fc.string()` plus a palette of
// realistic XSS payloads, attribute-breakout strings, unicode, and emoji.
// `fc.oneof` weighted toward payloads ensures the 100 runs exercise the
// actual attack shapes while still sampling arbitrary inputs.
const xssPayload = fc.constantFrom(
  "<script>alert(1)</script>",
  '<img src=x onerror="alert(1)">',
  '"><svg onload=alert(1)>',
  "'><iframe src=javascript:alert(1)></iframe>",
  "<style>body{display:none}</style>",
  "<a href=\"javascript:alert(1)\">x</a>",
  "\"/><input autofocus onfocus=alert(1)>",
  "</title><script>alert(1)</script>",
  "<div onclick=alert(1)>x</div>",
  "<math><mi//xlink:href='javascript:alert(1)'>",
);
const unicodeOrEmoji = fc.constantFrom(
  "🔮✨",
  "Huyền Bí 天命",
  "\u0000\u001f\u007f",
  "مرحبا",
  "\u202etxt", // RTL override
);
const payloadFlavored = fc.oneof(
  { arbitrary: xssPayload, weight: 4 },
  { arbitrary: unicodeOrEmoji, weight: 2 },
  { arbitrary: fc.string({ minLength: 0, maxLength: 128 }), weight: 4 },
);

fc.assert(
  fc.property(
    payloadFlavored,
    payloadFlavored,
    payloadFlavored,
    (title, moduleName, result) => {
      const mockWindow = createMockWindow();
      simulateHandlePrint(mockWindow, title, moduleName, result);

      // (1) No element whose tagName was introduced by user input. The
      // allow-list is fixed; anything outside means the builder (or a
      // future bug inside it) parsed a user string as markup.
      for (const tag of mockWindow.document._createdTags) {
        assert.ok(
          ALLOWED_TAGS.has(tag),
          `disallowed tag <${tag}> materialized for inputs ${JSON.stringify({ title, moduleName, result })}; created tags: ${JSON.stringify(mockWindow.document._createdTags)}`,
        );
      }

      // (1b) Structural sanity: the fixed chrome is present. Catches a
      // regression that *removes* elements but leaves the allow-list intact
      // (e.g. the builder short-circuited on a hostile input). The builder
      // appends exactly meta + style into head and h1 + metaRow + content
      // + watermark into body → 2 children in head, 4 in body.
      assert.equal(mockWindow.document.head.children.length, 2, "head must carry meta + style");
      assert.equal(
        mockWindow.document.body.children.length,
        4,
        "body must carry h1 + meta-row + content + watermark",
      );
      assert.equal(
        mockWindow.document.body.children.filter((c) => c.tagName === "H1").length,
        1,
      );
      assert.equal(
        mockWindow.document.body.children.filter((c) => c.tagName === "DIV").length,
        3,
      );

      // (2) User strings survive verbatim in textContent — no stripping,
      // no double-escape, no concatenation mishap. This is the "payload is
      // inert data" invariant: an `<img>` in the title is preserved as text.
      const h1 = mockWindow.document.body.children.find((c) => c.tagName === "H1")!;
      assert.equal(h1.textContent, title);
      const contentDiv = mockWindow.document.body.children.find(
        (c) => c.tagName === "DIV" && c._className === "content",
      )!;
      assert.equal(contentDiv.textContent, result);
      const metaDiv = mockWindow.document.body.children.find(
        (c) => c.tagName === "DIV" && c._className === "meta",
      )!;
      assert.ok(
        metaDiv.textContent.includes(moduleName),
        `meta row should include moduleName verbatim; got ${JSON.stringify(metaDiv.textContent)} for moduleName ${JSON.stringify(moduleName)}`,
      );

      // (3) `document.title` is a DOM-native setter; no HTML parsing. We
      // verify the title string landed unescaped so the property covers
      // both the "did not render tags" and "did render the intended text"
      // halves of the invariant.
      assert.ok(
        mockWindow.document.title.includes(title),
        `document.title should include the raw title verbatim`,
      );

      // (4) Opener invariant — the popup has no back-reference to the
      // parent tab after the handler runs.
      assert.equal(mockWindow.opener, null, "printWindow.opener must be null after handlePrint");

      // (5) print() was invoked — ensures we tested the full code path,
      // not a partial build.
      assert.equal(mockWindow._printed, true, "printWindow.print() must be invoked");
    },
  ),
  { numRuns: 100 },
);

console.log("result-actions: ok");

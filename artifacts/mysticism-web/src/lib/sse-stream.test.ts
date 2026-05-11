// Regression test for Task 7: SSE stream parsing must tolerate chunk
// boundaries that split individual events. The old parser split each raw
// chunk on "\n" and JSON.parsed per line, so any event whose data payload
// crossed a chunk boundary was dropped (first half = unterminated JSON,
// second half = no `data:` prefix).
//
// The hardened parser (`readSseStream`) holds a rolling buffer, splits on
// the SSE event delimiter (`\n\n`), and rejoins multi-line `data:` fields.
import assert from "node:assert/strict";
import { readSseStream } from "./sse-stream";

function toStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[i++]));
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<unknown[]> {
  const out: unknown[] = [];
  for await (const { data } of readSseStream(stream)) {
    out.push(data);
  }
  return out;
}

// 1. Happy path — one event per chunk.
{
  const events = await collect(
    toStream([
      `data: ${JSON.stringify({ content: "hello " })}\n\n`,
      `data: ${JSON.stringify({ content: "world" })}\n\n`,
      `data: ${JSON.stringify({ done: true })}\n\n`,
    ]),
  );
  assert.deepEqual(events, [{ content: "hello " }, { content: "world" }]);
}

// 2. The critical fix — a single event's JSON payload split across two
//    chunks. The old parser dropped this; the new one reassembles it.
{
  const payload = JSON.stringify({ content: "xin chào thế giới" });
  const full = `data: ${payload}\n\n`;
  const cut = Math.floor(full.length / 2);
  const events = await collect(toStream([full.slice(0, cut), full.slice(cut)]));
  assert.deepEqual(events, [{ content: "xin chào thế giới" }]);
}

// 3. A chunk boundary that splits the event delimiter itself (between the
//    two newlines). The parser must wait for the full "\n\n" before dispatch.
{
  const events = await collect(
    toStream([
      `data: ${JSON.stringify({ content: "a" })}\n`,
      `\ndata: ${JSON.stringify({ content: "b" })}\n\n`,
    ]),
  );
  assert.deepEqual(events, [{ content: "a" }, { content: "b" }]);
}

// 4. Multi-line `data:` fields reassemble per the SSE spec.
{
  const events = await collect(toStream(["data: first\ndata: second\n\n"]));
  // No JSON → raw string is returned, joined by newline.
  assert.deepEqual(events, ["first\nsecond"]);
}

// 5. `[DONE]` and `{done: true}` both terminate iteration and are not yielded.
{
  const events = await collect(
    toStream([
      `data: ${JSON.stringify({ content: "one" })}\n\n`,
      "data: [DONE]\n\n",
      // Anything after a terminator must never be yielded.
      `data: ${JSON.stringify({ content: "should-not-appear" })}\n\n`,
    ]),
  );
  assert.deepEqual(events, [{ content: "one" }]);
}

// 6. CRLF newlines are normalized — some proxies convert `\n` to `\r\n`.
{
  const events = await collect(
    toStream([`data: ${JSON.stringify({ content: "crlf" })}\r\n\r\n`]),
  );
  assert.deepEqual(events, [{ content: "crlf" }]);
}

// 7. Comment lines (starting with ":") are ignored as SSE keep-alives.
{
  const events = await collect(
    toStream([`: keep-alive\n\ndata: ${JSON.stringify({ content: "x" })}\n\n`]),
  );
  assert.deepEqual(events, [{ content: "x" }]);
}

// 8. A final event without the trailing blank line still flushes on stream end.
{
  const events = await collect(
    toStream([`data: ${JSON.stringify({ content: "tail" })}`]),
  );
  assert.deepEqual(events, [{ content: "tail" }]);
}

console.log("sse-stream: ok");

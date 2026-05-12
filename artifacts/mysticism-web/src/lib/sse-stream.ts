/**
 * Robust parser for Server-Sent Events (SSE) streams.
 *
 * The previous chat-page and `useSSEChat` implementations decoded each fetch
 * chunk in isolation and split on `\n`. That corrupts any event whose payload
 * crosses a chunk boundary — the parser sees the first half as an unterminated
 * JSON fragment (`JSON.parse` throws, the log prints, the line is dropped) and
 * the second half shows up without the `data:` prefix so it is ignored as well.
 *
 * This helper owns a single rolling buffer per stream:
 *   • It accumulates decoded text across reads.
 *   • It splits on the SSE event delimiter `\n\n` per the WHATWG/MDN spec.
 *   • It keeps the *unterminated* tail in the buffer so the next chunk can
 *     complete it.
 *   • For each completed event it joins every line that starts with `data:`
 *     into one payload, so multi-line events are reassembled correctly.
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
 */

export interface SsePayload {
  /** JSON-decoded data (when the event payload parses as JSON). */
  data: unknown;
  /** Raw text payload in case the caller needs the original string. */
  raw: string;
}

/**
 * Consume a ReadableStream of Uint8Array chunks and yield one SSE event at a
 * time. Lines starting with `:` are treated as comments and skipped.
 *
 * Stops iterating when either:
 *   • the stream ends, or
 *   • a `data:` line equals `[DONE]`, or
 *   • a JSON payload decodes to `{ done: true }`.
 *
 * Both terminator forms appear in our API and are widely used by upstream
 * providers, so we accept either.
 */
export async function* readSseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SsePayload, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Normalize CRLF pairs so splitting by "\n\n" works regardless of the
      // server's newline style.
      buffer = buffer.replace(/\r\n/g, "\n");

      let delimiter = buffer.indexOf("\n\n");
      while (delimiter !== -1) {
        const eventText = buffer.slice(0, delimiter);
        buffer = buffer.slice(delimiter + 2);

        const payload = extractDataPayload(eventText);
        if (payload !== null) {
          const parsed = tryParseJson(payload);
          if (parsed === "[DONE]" || (isDoneObject(parsed))) {
            return;
          }
          yield { data: parsed, raw: payload };
        }

        delimiter = buffer.indexOf("\n\n");
      }
    }

    // Flush any final event that lacked a trailing blank line. This should be
    // rare, but it keeps us from dropping the last event if the server closes
    // the connection without sending `\n\n`.
    const tail = buffer.trim();
    if (tail.length > 0) {
      const payload = extractDataPayload(tail);
      if (payload !== null) {
        const parsed = tryParseJson(payload);
        if (parsed !== "[DONE]" && !isDoneObject(parsed)) {
          yield { data: parsed, raw: payload };
        }
      }
    }
  } finally {
    // Always release the underlying lock so callers (e.g. the fetch Response)
    // can be GC'd even if the consumer breaks out of the generator early.
    reader.releaseLock();
  }
}

function extractDataPayload(eventText: string): string | null {
  const lines = eventText.split("\n");
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith(":")) continue; // SSE comment
    if (line.startsWith("data:")) {
      // Per spec: strip at most one leading space after the colon.
      const after = line.slice(5);
      dataLines.push(after.startsWith(" ") ? after.slice(1) : after);
    }
  }
  if (dataLines.length === 0) return null;
  return dataLines.join("\n");
}

function tryParseJson(raw: string): unknown {
  if (raw === "[DONE]") return "[DONE]";
  try {
    return JSON.parse(raw);
  } catch {
    return raw; // fall back to the raw string if it is not JSON
  }
}

function isDoneObject(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { done?: unknown }).done === true
  );
}

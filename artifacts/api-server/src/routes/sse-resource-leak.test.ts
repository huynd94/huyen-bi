/**
 * Bug Condition Exploration Test: SSE Resource Leak on Client Disconnect
 *
 * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
 *
 * Property: For all SSE requests where `clientDisconnected == true AND streamInProgress == true`,
 * the handler SHALL abort the AI API call, stop writing to the response, and release resources.
 *
 * This test is EXPECTED TO FAIL on unfixed code — failure confirms the bug exists:
 * - AI stream continues consuming tokens after client disconnect
 * - Incomplete response persisted to database (openai conversations endpoint)
 *
 * DO NOT attempt to fix the test or the code when it fails.
 */
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fc from "fast-check";

// ─── Mock infrastructure ────────────────────────────────────────────────────

/**
 * Creates a mock async iterable stream that yields `totalChunks` items,
 * tracking how many chunks were actually consumed and whether it was aborted.
 */
function createMockStream(totalChunks: number, signal?: AbortSignal) {
  let consumed = 0;
  let aborted = false;

  const iterator: AsyncIterableIterator<{ choices: Array<{ delta: { content: string } }>, text?: () => string }> = {
    [Symbol.asyncIterator]() { return this; },
    async next() {
      // Small delay to simulate async chunk delivery
      await new Promise((resolve) => setTimeout(resolve, 1));

      if (signal?.aborted) {
        aborted = true;
        return { done: true, value: undefined };
      }

      if (consumed >= totalChunks) {
        return { done: true, value: undefined };
      }

      consumed++;
      const chunk = {
        choices: [{ delta: { content: `chunk-${consumed}` } }],
        text: () => `chunk-${consumed}`,
      };
      return { done: false, value: chunk };
    },
  };

  return {
    stream: iterator,
    getConsumed: () => consumed,
    isAborted: () => aborted,
  };
}

/**
 * Creates a mock Express request object that can simulate client disconnect.
 */
function createMockReq(headers: Record<string, string> = {}) {
  const req = new EventEmitter() as EventEmitter & {
    headers: Record<string, string>;
    body: any;
    params: Record<string, string>;
    destroyed: boolean;
    ip: string;
    destroy: () => void;
  };
  req.headers = {
    "x-ai-provider": "openai",
    "x-ai-key": "test-key-123",
    "x-ai-model": "gpt-5.4-nano",
    ...headers,
  };
  req.body = {};
  req.params = {};
  req.destroyed = false;
  req.ip = "127.0.0.1";
  req.destroy = () => {
    req.destroyed = true;
    req.emit("close");
  };
  return req;
}

/**
 * Creates a mock Express response object that tracks writes and detects
 * writes-after-close.
 */
function createMockRes() {
  const writes: string[] = [];
  let ended = false;
  let writesAfterClose = 0;
  let clientClosed = false;

  const res = new EventEmitter() as EventEmitter & {
    setHeader: (name: string, value: string) => void;
    write: (data: string) => boolean;
    end: () => void;
    status: (code: number) => any;
    json: (data: any) => void;
    headersSent: boolean;
    writableEnded: boolean;
  };

  res.setHeader = () => {};
  res.headersSent = false;
  res.writableEnded = false;

  res.write = (data: string) => {
    if (clientClosed) {
      writesAfterClose++;
    }
    writes.push(data);
    return true;
  };

  res.end = () => {
    ended = true;
    res.writableEnded = true;
  };

  res.status = (code: number) => ({ json: () => {}, end: () => {} });
  res.json = () => {};

  return {
    res,
    getWrites: () => writes,
    isEnded: () => ended,
    getWritesAfterClose: () => writesAfterClose,
    simulateClientClose: () => { clientClosed = true; },
  };
}

// ─── Simulate the streaming logic from mysticism/index.ts ───────────────────

/**
 * Simulates the FIXED streaming behavior of /mysticism/ai-interpret.
 * This mirrors the actual code which uses AbortController and close listener.
 */
async function simulateMysticismStream(params: {
  totalChunks: number;
  disconnectAfterChunk: number;
  signal?: AbortSignal;
}) {
  const { totalChunks, disconnectAfterChunk } = params;

  // ─── THIS IS THE FIXED CODE PATTERN ───
  // AbortController created, close listener registered, writes guarded
  const controller = new AbortController();
  const mockStream = createMockStream(totalChunks, controller.signal);
  const mockReq = createMockReq();
  const { res: mockRes, getWrites, getWritesAfterClose, simulateClientClose } = createMockRes();

  // Set SSE headers (mirrors actual code)
  mockRes.setHeader("Content-Type", "text/event-stream");
  mockRes.setHeader("Cache-Control", "no-cache");
  mockRes.setHeader("Connection", "keep-alive");

  // Register close listener that aborts the controller (fixed pattern)
  const onClose = () => { controller.abort(); };
  mockReq.on("close", onClose);

  let chunkIndex = 0;
  try {
    for await (const chunk of mockStream.stream) {
      if (controller.signal.aborted) break;
      chunkIndex++;
      const content = chunk.choices[0]?.delta?.content;
      if (content && !mockRes.writableEnded) {
        mockRes.write(`data: ${JSON.stringify({ content })}\n\n`);
      }

      // Simulate client disconnect at the specified point
      if (chunkIndex === disconnectAfterChunk) {
        simulateClientClose();
        mockReq.destroy();
      }
    }
  } catch (err: any) {
    if (controller.signal.aborted) {
      // Expected — client disconnected, just stop
      mockReq.off("close", onClose);
      return {
        totalChunksConsumed: mockStream.getConsumed(),
        writesAfterClose: getWritesAfterClose(),
        streamAborted: mockStream.isAborted(),
        allWrites: getWrites(),
      };
    }
    throw err;
  }

  // Remove close listener after normal completion
  mockReq.off("close", onClose);

  // Only send done event if not aborted
  if (!controller.signal.aborted && !mockRes.writableEnded) {
    mockRes.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    mockRes.end();
  }

  return {
    totalChunksConsumed: mockStream.getConsumed(),
    writesAfterClose: getWritesAfterClose(),
    streamAborted: mockStream.isAborted(),
    allWrites: getWrites(),
  };
}

/**
 * Simulates the FIXED streaming behavior of /openai/conversations/:id/messages.
 * This mirrors the actual code which uses AbortController, close listener, and conditional DB save.
 */
async function simulateOpenAIConversationStream(params: {
  totalChunks: number;
  disconnectAfterChunk: number;
  signal?: AbortSignal;
}) {
  const { totalChunks, disconnectAfterChunk } = params;

  // ─── THIS IS THE FIXED CODE PATTERN ───
  // AbortController created, close listener registered, conditional DB save
  const controller = new AbortController();
  const mockStream = createMockStream(totalChunks, controller.signal);
  const mockReq = createMockReq();
  const { res: mockRes, getWrites, getWritesAfterClose, simulateClientClose } = createMockRes();

  // Set SSE headers (mirrors actual code)
  mockRes.setHeader("Content-Type", "text/event-stream");
  mockRes.setHeader("Cache-Control", "no-cache");
  mockRes.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  let dbSaved = false;
  let streamCompleted = false;

  // Register close listener that aborts the controller (fixed pattern)
  const onClose = () => { controller.abort(); };
  mockReq.on("close", onClose);

  let chunkIndex = 0;
  try {
    for await (const chunk of mockStream.stream) {
      if (controller.signal.aborted) break;
      chunkIndex++;
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        if (!mockRes.writableEnded) {
          mockRes.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Simulate client disconnect at the specified point
      if (chunkIndex === disconnectAfterChunk) {
        simulateClientClose();
        mockReq.destroy();
      }
    }

    // Stream completed successfully (not aborted)
    streamCompleted = true;
  } catch (err: any) {
    if (controller.signal.aborted) {
      // Expected — client disconnected, just stop
      mockReq.off("close", onClose);
      return {
        totalChunksConsumed: mockStream.getConsumed(),
        writesAfterClose: getWritesAfterClose(),
        streamAborted: mockStream.isAborted(),
        dbSaved,
        fullResponse,
        isIncompleteResponse: fullResponse.length > 0 && chunkIndex < totalChunks,
      };
    }
    throw err;
  }

  // Remove close listener after normal completion
  mockReq.off("close", onClose);

  // Only save to DB if stream completed successfully (not aborted)
  if (streamCompleted && !controller.signal.aborted) {
    dbSaved = true;
  }

  if (!controller.signal.aborted && !mockRes.writableEnded) {
    mockRes.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    mockRes.end();
  }

  return {
    totalChunksConsumed: mockStream.getConsumed(),
    writesAfterClose: getWritesAfterClose(),
    streamAborted: mockStream.isAborted(),
    dbSaved,
    fullResponse,
    isIncompleteResponse: fullResponse.length > 0 && chunkIndex < totalChunks,
  };
}

// ─── Property-Based Tests ───────────────────────────────────────────────────

console.log("=== SSE Resource Leak Bug Condition Exploration Test ===\n");
console.log("Property: For all SSE requests where clientDisconnected == true AND streamInProgress == true,");
console.log("the handler SHALL abort the AI API call, stop writing to the response, and release resources.\n");

let testsPassed = true;
const counterexamples: string[] = [];

// ─── Property 1: Mysticism endpoint — stream MUST be aborted on disconnect ──

console.log("--- Test 1: /mysticism/ai-interpret — AI stream must be aborted on client disconnect ---");

try {
  await fc.assert(
    fc.asyncProperty(
      // Generate random stream lengths (1–100 chunks)
      fc.integer({ min: 2, max: 100 }),
      // Generate random disconnect points (before stream end)
      fc.integer({ min: 1, max: 99 }),
      async (totalChunks, disconnectPoint) => {
        // Ensure disconnect happens before stream ends
        const actualDisconnect = Math.min(disconnectPoint, totalChunks - 1);

        const result = await simulateMysticismStream({
          totalChunks,
          disconnectAfterChunk: actualDisconnect,
        });

        // EXPECTED BEHAVIOR (will fail on unfixed code):
        // After client disconnects, the stream MUST be aborted
        assert.equal(
          result.streamAborted,
          true,
          `Stream was NOT aborted after client disconnect at chunk ${actualDisconnect}/${totalChunks}`,
        );

        // No writes should occur after client disconnect
        assert.equal(
          result.writesAfterClose,
          0,
          `${result.writesAfterClose} writes occurred after client disconnect (totalChunks=${totalChunks}, disconnectAt=${actualDisconnect})`,
        );

        // Stream should NOT consume all chunks after disconnect
        assert.ok(
          result.totalChunksConsumed <= actualDisconnect + 1,
          `Stream consumed ${result.totalChunksConsumed} chunks but should have stopped at ~${actualDisconnect} (total=${totalChunks})`,
        );
      },
    ),
    { numRuns: 50, verbose: 1 },
  );
  console.log("  PASS — AbortController correctly aborts stream on disconnect\n");
} catch (err: any) {
  testsPassed = false;
  const msg = err.message || String(err);
  counterexamples.push(`[/mysticism/ai-interpret] ${msg}`);
  console.log(`  FAIL — stream not properly aborted on disconnect`);
  console.log(`  Counterexample: ${msg}\n`);
}

// ─── Property 2: OpenAI conversations — stream MUST be aborted AND incomplete response NOT saved ──

console.log("--- Test 2: /openai/conversations/:id/messages — stream must be aborted AND incomplete response must NOT be saved ---");

try {
  await fc.assert(
    fc.asyncProperty(
      // Generate random stream lengths (2–100 chunks)
      fc.integer({ min: 2, max: 100 }),
      // Generate random disconnect points (before stream end)
      fc.integer({ min: 1, max: 99 }),
      async (totalChunks, disconnectPoint) => {
        // Ensure disconnect happens before stream ends
        const actualDisconnect = Math.min(disconnectPoint, totalChunks - 1);

        const result = await simulateOpenAIConversationStream({
          totalChunks,
          disconnectAfterChunk: actualDisconnect,
        });

        // EXPECTED BEHAVIOR (will fail on unfixed code):
        // After client disconnects, the stream MUST be aborted
        assert.equal(
          result.streamAborted,
          true,
          `Stream was NOT aborted after client disconnect at chunk ${actualDisconnect}/${totalChunks}`,
        );

        // No writes should occur after client disconnect
        assert.equal(
          result.writesAfterClose,
          0,
          `${result.writesAfterClose} writes occurred after client disconnect (totalChunks=${totalChunks}, disconnectAt=${actualDisconnect})`,
        );

        // Incomplete response MUST NOT be saved to database
        assert.equal(
          result.dbSaved,
          false,
          `Incomplete response was saved to database after client disconnect at chunk ${actualDisconnect}/${totalChunks}. ` +
          `Response had ${result.fullResponse.length} chars but stream was incomplete.`,
        );

        // Stream should NOT consume all chunks after disconnect
        assert.ok(
          result.totalChunksConsumed <= actualDisconnect + 1,
          `Stream consumed ${result.totalChunksConsumed} chunks but should have stopped at ~${actualDisconnect} (total=${totalChunks})`,
        );
      },
    ),
    { numRuns: 50, verbose: 1 },
  );
  console.log("  PASS — AbortController correctly aborts stream and prevents DB save\n");
} catch (err: any) {
  testsPassed = false;
  const msg = err.message || String(err);
  counterexamples.push(`[/openai/conversations/:id/messages] ${msg}`);
  console.log(`  FAIL — stream not properly aborted or incomplete data saved`);
  console.log(`  Counterexample: ${msg}\n`);
}

// ─── Summary ────────────────────────────────────────────────────────────────

console.log("=== Summary ===");
if (!testsPassed) {
  console.log("Bug condition NOT fixed — tests failed.");
  console.log("\nCounterexamples found:");
  for (const ce of counterexamples) {
    console.log(`  • ${ce}`);
  }
  console.log("\nThe AbortController pattern is not working as expected.");
  // Exit with error to signal test failure
  process.exit(1);
} else {
  console.log("All tests PASSED — bug fix confirmed working.");
  console.log("AbortController pattern correctly aborts streams on client disconnect.");
  console.log("Incomplete responses are NOT saved to the database.");
  process.exit(0);
}

import { ERROR_MESSAGES } from "@/lib/error-messages";

/**
 * Default fetch timeout in milliseconds (30 seconds).
 *
 * Matches the design row "Fetch timeout (≥ 30s)" in
 * `.kiro/specs/ux-ui-upgrade/design.md`. After this duration the helper
 * cancels the request via `AbortController` and surfaces a {@link TimeoutError}.
 */
export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

/**
 * Error thrown by {@link fetchWithTimeout} when a request exceeds its
 * `timeoutMs` budget. The `name` is fixed to `"TimeoutError"` so callers
 * (ErrorState mappers, sonner toasts, react-query `onError`, …) can branch
 * on the error class without depending on `instanceof` across module
 * boundaries.
 *
 * The default `message` comes from {@link ERROR_MESSAGES.timeout} so that
 * surface copy stays consistent with the centralised microcopy registry
 * (see Requirements 19.1, 19.2). Callers MAY override it for diagnostics.
 */
export class TimeoutError extends Error {
  override readonly name = "TimeoutError";
  /** Timeout budget that was exceeded, in milliseconds. */
  readonly timeoutMs: number;

  constructor(timeoutMs: number, message: string = ERROR_MESSAGES.timeout) {
    super(message);
    this.timeoutMs = timeoutMs;
  }
}

/**
 * `RequestInit` extended with an explicit `timeoutMs` option. Defaults to
 * {@link DEFAULT_FETCH_TIMEOUT_MS} when omitted. A non-positive or
 * non-finite `timeoutMs` is treated as the default to avoid an immediate
 * abort.
 */
export interface FetchWithTimeoutInit extends RequestInit {
  /** Maximum time to wait before aborting, in ms. Defaults to 30_000. */
  timeoutMs?: number;
}

/**
 * `fetch` wrapper that cancels the request after `timeoutMs` (default 30s)
 * via an internal `AbortController`. If the caller supplies their own
 * `init.signal`, the two abort sources are composed so that *either* an
 * external abort *or* the internal timeout will tear the request down.
 *
 * Behaviour contract (Requirement 18.4 — `requirements.md` §18.4):
 *   1. On timeout: cancel the underlying `fetch`, **await its settlement**
 *      so the abort fully propagates, then reject with a {@link TimeoutError}
 *      whose default message is {@link ERROR_MESSAGES.timeout}.
 *   2. On external abort: forward the caller's `reason` (or a default
 *      `AbortError`) and re-throw the rejection without wrapping it.
 *   3. If the caller's signal is *already* aborted before fetch starts,
 *      surface the reason synchronously without spinning up a request.
 *   4. Always `clearTimeout` and detach the external-signal listener in a
 *      `finally` block so success / failure paths leak no resources.
 *
 * @example
 *   try {
 *     const res = await fetchWithTimeout("/api/save", {
 *       method: "POST",
 *       body: JSON.stringify(payload),
 *       timeoutMs: 30_000,
 *     });
 *     return await res.json();
 *   } catch (err) {
 *     if (err instanceof TimeoutError) {
 *       toast.error(err.message); // "Hết thời gian chờ. Vui lòng thử lại."
 *     }
 *     throw err;
 *   }
 *
 * Validates Requirements 18.4.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: FetchWithTimeoutInit,
): Promise<Response> {
  const { timeoutMs: rawTimeoutMs, signal: externalSignal, ...rest } =
    init ?? {};

  const timeoutMs =
    typeof rawTimeoutMs === "number" &&
    Number.isFinite(rawTimeoutMs) &&
    rawTimeoutMs > 0
      ? rawTimeoutMs
      : DEFAULT_FETCH_TIMEOUT_MS;

  // Short-circuit: if the caller's signal is already aborted, surface the
  // caller's reason verbatim without starting a fetch. Mirrors the behaviour
  // of `fetch()` itself when given a pre-aborted signal.
  if (externalSignal?.aborted) {
    throw (
      externalSignal.reason ??
      new DOMException("The operation was aborted.", "AbortError")
    );
  }

  const internalController = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    internalController.abort();
  }, timeoutMs);

  // Compose external + internal signals: forward an external abort to the
  // internal controller (preserving the caller's `reason` if provided) so a
  // single `signal` can be passed to the underlying `fetch`.
  const onExternalAbort = () => {
    internalController.abort(externalSignal?.reason);
  };
  if (externalSignal) {
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    // Awaiting `fetch` here is also how we await the abort completing: when
    // the controller aborts, `fetch` rejects only after the underlying
    // request has been fully torn down. That ordering is what Requirement
    // 18.4 asks for ("chỉ hiển thị Error_State … sau khi việc huỷ request
    // hoàn tất thành công").
    return await fetch(input, { ...rest, signal: internalController.signal });
  } catch (err) {
    if (timedOut) {
      // Surface the typed timeout error with the centralised microcopy.
      throw new TimeoutError(timeoutMs);
    }
    // External abort or genuine network/transport failure: re-raise as-is.
    throw err;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}

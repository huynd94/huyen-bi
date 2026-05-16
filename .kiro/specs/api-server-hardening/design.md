# API Server Hardening Bugfix Design

## Overview

This design addresses seven bugs in the Huyền Bí API server and deployment infrastructure. The bugs fall into two severity tiers: (1) critical resource leaks in SSE streaming endpoints that waste API credits and server resources when clients disconnect, and (2) maintainability/reliability issues including dual schema management, duplicated auth middleware, non-reproducible Docker builds, Docker Compose deprecation warnings, and scattered AI model constants. The fix strategy is minimal and targeted — each bug is addressed independently with clear preservation boundaries.

## Glossary

- **Bug_Condition (C)**: The set of conditions that trigger one of the seven identified defects — primarily client disconnection during SSE streaming, but also build-time and code-organization issues
- **Property (P)**: The desired correct behavior when the bug condition holds — resources are released on disconnect, builds are reproducible, code uses single sources of truth
- **Preservation**: Existing behaviors that must remain unchanged — successful SSE streams, database auto-migration, authentication enforcement, Docker service orchestration, and AI model defaults
- **SSE (Server-Sent Events)**: The streaming protocol used by `/mysticism/ai-interpret` and `/openai/conversations/:id/messages` to deliver AI responses chunk-by-chunk
- **AbortController**: Node.js mechanism to signal cancellation of async operations (fetch, streams) when a client disconnects
- **`requireClerkUser`**: Shared authentication middleware in `lib/clerk-user.ts` that validates Clerk sessions and attaches `userId` to the request
- **`migrate.ts`**: File in `lib/migrate.ts` that creates database tables via raw SQL, running in parallel with Drizzle ORM schema definitions
- **Drizzle ORM**: The type-safe ORM used in `lib/db/` for `conversations` and `messages` tables

## Bug Details

### Bug Condition

The bugs manifest across two categories:

**Category A — SSE Resource Leaks (Bugs 1.1, 1.2):** When a client disconnects mid-stream from either SSE endpoint, the server continues processing the AI API call to completion, wasting API credits, memory, and CPU.

**Category B — Code/Infrastructure Defects (Bugs 1.3–1.7):** Structural issues that cause non-deterministic builds, deprecation warnings, code duplication, and schema drift.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { category: "sse" | "infrastructure", context: RequestContext | BuildContext }
  OUTPUT: boolean

  IF input.category == "sse" THEN
    RETURN input.context.clientDisconnected == true
           AND input.context.streamInProgress == true
           AND input.context.abortSignalNotRegistered == true
  END IF

  IF input.category == "infrastructure" THEN
    RETURN input.context.issue IN [
      "dual_schema_management",
      "duplicate_auth_middleware",
      "no_frozen_lockfile",
      "docker_compose_version_field",
      "scattered_model_constants"
    ]
  END IF

  RETURN false
END FUNCTION
```

### Examples

- **Bug 1.1**: User opens `/mysticism/ai-interpret`, receives 3 chunks, closes browser tab → server continues streaming all remaining chunks from OpenAI/Gemini API, paying for unused tokens
- **Bug 1.2**: User opens `/openai/conversations/5/messages`, receives partial response, loses network → server completes the full AI call AND saves the incomplete response to the database
- **Bug 1.3**: Developer adds a new column to `saved_readings` in `migrate.ts` but forgets to update the Drizzle schema → type-safe queries in other files don't see the new column
- **Bug 1.4**: Developer updates `requireClerkUser` to add logging → `readings.ts` doesn't benefit because it uses its own `requireAuth` copy
- **Bug 1.5**: CI builds image on Monday with `openai@4.80.0`, rebuilds Tuesday with `openai@4.81.0` due to `--no-frozen-lockfile` → different runtime behavior
- **Bug 1.6**: Running `docker compose up` prints `WARN[0000] version is obsolete` on every invocation
- **Bug 1.7**: Team updates model to `gpt-5.4-mini` in `server-config.ts` but forgets `mysticism/index.ts` → different endpoints use different default models

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- When a client remains connected throughout an SSE stream, all AI-generated content chunks are delivered and the response ends with a `done` event (Req 3.1, 3.2)
- When the application starts, all required database tables are created if they do not exist (Req 3.3)
- Unauthenticated requests to protected readings endpoints return 401 Unauthorized (Req 3.4)
- Docker images build successfully when all dependencies are properly locked (Req 3.5)
- `docker compose up` starts all three services (postgres, api, web) with correct networking and health checks (Req 3.6)
- AI streaming endpoints default to `gpt-5.4-nano` for OpenAI and `gemini-3.0-flash` for Gemini unless overridden (Req 3.7)

**Scope:**
All inputs that do NOT involve client disconnection during active SSE streams should be completely unaffected by the SSE fixes. All existing API behavior, database operations, and Docker orchestration must continue working identically after the infrastructure fixes.

## Hypothesized Root Cause

Based on the code analysis, the root causes are:

1. **SSE Resource Leak — Missing AbortController (Bugs 1.1, 1.2)**: Neither `mysticism/index.ts` nor `openai/index.ts` listens for the `close` event on the response/request. The `for await` loops over the AI SDK streams have no mechanism to break early. The OpenAI SDK's `stream` object supports `controller.abort()` and the Gemini SDK supports `AbortSignal`, but neither is wired to client disconnect detection.

2. **Dual Schema Management (Bug 1.3)**: The `lib/db/src/schema/` directory only defines `conversations` and `messages` via Drizzle's `pgTable`. The remaining four tables (`server_config`, `usage_log`, `saved_readings`, `share_tokens`) are created by raw SQL in `migrate.ts`. This happened because tables were added incrementally without migrating them to the ORM.

3. **Duplicate Auth Middleware (Bug 1.4)**: `readings.ts` defines its own `requireAuth` function that calls `getAuth(req)` directly and assigns `req.userId` with `any` typing. The shared `requireClerkUser` in `lib/clerk-user.ts` does the same thing but with proper typing (`AuthenticatedRequest`). The duplication likely occurred because `readings.ts` was written before the shared middleware was extracted.

4. **Non-Reproducible Docker Builds (Bug 1.5)**: Both `Dockerfile.api` and `Dockerfile.web` use `pnpm install --no-frozen-lockfile`. This flag was likely added to work around lockfile sync issues during development but should never be used in production builds.

5. **Docker Compose Version Field (Bug 1.6)**: The `version: "3.9"` field in `docker-compose.yml` is a legacy artifact. Docker Compose V2 ignores it and emits a deprecation warning. It serves no functional purpose.

6. **Scattered Model Constants (Bug 1.7)**: `DEFAULT_OPENAI_MODEL` and `DEFAULT_GEMINI_MODEL` are independently defined in `mysticism/index.ts`, `openai/index.ts`, and `ai-settings.tsx`. Additionally, `server-config.ts` hardcodes `"gpt-5.4-nano"` in its `DEFAULTS` map, and `config/index.ts` hardcodes it in a fallback expression. There is no single shared constants module.

## Correctness Properties

Property 1: Bug Condition — SSE Resource Cleanup on Client Disconnect

_For any_ SSE streaming request where the client disconnects mid-stream (isBugCondition returns true for category "sse"), the fixed endpoint handlers SHALL abort the in-progress AI API call within a bounded time, stop writing to the response, and release all associated resources (no further token consumption, no orphaned promises).

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Connected SSE Streams Deliver Complete Responses

_For any_ SSE streaming request where the client remains connected throughout the entire stream (isBugCondition returns false for category "sse"), the fixed endpoint handlers SHALL produce the same behavior as the original — delivering all content chunks and ending with a `done` event, with the OpenAI conversations endpoint saving the full response to the database.

**Validates: Requirements 3.1, 3.2**

Property 3: Bug Condition — Single Schema Source of Truth

_For any_ database table used by the application, the fixed codebase SHALL define that table in the Drizzle ORM schema (`lib/db/src/schema/`) as the authoritative definition, eliminating raw SQL table creation in `migrate.ts`.

**Validates: Requirements 2.3**

Property 4: Bug Condition — Shared Auth Middleware Usage

_For any_ protected route in `readings.ts`, the fixed code SHALL use the shared `requireClerkUser` middleware and `AuthenticatedRequest` type, eliminating the locally-defined `requireAuth` function.

**Validates: Requirements 2.4**

Property 5: Bug Condition — Reproducible Docker Builds

_For any_ Docker image build using `Dockerfile.api` or `Dockerfile.web`, the fixed Dockerfiles SHALL use `--frozen-lockfile` so that builds fail deterministically if the lockfile is out of sync with `package.json`.

**Validates: Requirements 2.5**

Property 6: Bug Condition — No Docker Compose Deprecation Warnings

_For any_ invocation of `docker compose` commands, the fixed `docker-compose.yml` SHALL NOT produce deprecation warnings related to the `version` field.

**Validates: Requirements 2.6**

Property 7: Bug Condition — Centralized AI Model Constants

_For any_ location in the codebase that references default AI model identifiers, the fixed code SHALL import them from a single shared source, so that updating a model version requires changing only one location.

**Validates: Requirements 2.7**

## Fix Implementation

### Changes Required

**File**: `artifacts/api-server/src/routes/mysticism/index.ts`

**Specific Changes**:
1. **Add AbortController**: Create an `AbortController` before initiating the AI API call
2. **Listen for client disconnect**: Register a `close` event listener on `req` (or `res`) that calls `controller.abort()`
3. **Pass AbortSignal to AI SDKs**: Pass `{ signal: controller.signal }` to OpenAI's `client.chat.completions.create()` and use it with Gemini's `generateContentStream()`
4. **Guard writes**: Before each `res.write()` in the streaming loop, check if the request is still open (or wrap in try/catch for write-after-close errors)
5. **Cleanup**: Remove the `close` event listener after stream completes normally

---

**File**: `artifacts/api-server/src/routes/openai/index.ts`

**Specific Changes**:
1. **Add AbortController**: Same pattern as mysticism route
2. **Listen for client disconnect**: Register `close` event listener that calls `controller.abort()`
3. **Pass AbortSignal to AI SDKs**: Same as above
4. **Conditional database save**: Only save the assistant message to the database if the stream completed successfully (not aborted)
5. **Guard writes**: Same pattern as mysticism route

---

**File**: `lib/db/src/schema/` (new files)

**Specific Changes**:
1. **Create `server-config.ts`**: Define `serverConfig` table with Drizzle's `pgTable`
2. **Create `usage-log.ts`**: Define `usageLog` table with Drizzle's `pgTable`
3. **Create `saved-readings.ts`**: Define `savedReadings` table with Drizzle's `pgTable`
4. **Create `share-tokens.ts`**: Define `shareTokens` table with Drizzle's `pgTable`
5. **Update `schema/index.ts`**: Export all new table definitions
6. **Update `migrate.ts`**: Replace raw SQL with Drizzle's `migrate()` or keep as compatibility layer that uses `CREATE TABLE IF NOT EXISTS` generated from schema

---

**File**: `artifacts/api-server/src/routes/readings.ts`

**Specific Changes**:
1. **Remove local `requireAuth`**: Delete the function definition
2. **Import shared middleware**: Add `import { requireClerkUser, type AuthenticatedRequest } from "../lib/clerk-user"`
3. **Replace middleware usage**: Change all `requireAuth` references to `requireClerkUser`
4. **Fix type annotations**: Replace `req: any` with `req: AuthenticatedRequest` (or cast as needed)

---

**Files**: `Dockerfile.api`, `Dockerfile.web`

**Specific Changes**:
1. **Replace `--no-frozen-lockfile` with `--frozen-lockfile`**: Change the `pnpm install` command in both Dockerfiles

---

**File**: `docker-compose.yml`

**Specific Changes**:
1. **Remove `version: "3.9"` line**: Delete the first line of the file

---

**Files**: New shared constants module + consumers

**Specific Changes**:
1. **Create `lib/db/src/constants.ts`** (or a more appropriate shared package like `lib/shared/`): Export `DEFAULT_OPENAI_MODEL` and `DEFAULT_GEMINI_MODEL`
2. **Update `mysticism/index.ts`**: Import constants from shared module, remove local definitions
3. **Update `openai/index.ts`**: Import constants from shared module, remove local definitions
4. **Update `server-config.ts`**: Import constant for the `DEFAULTS` map
5. **Update `config/index.ts`**: Import constant for the fallback value
6. **Update `ai-settings.tsx`** (frontend): Import from shared module or define a frontend-specific constants file that mirrors the backend values

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate client disconnection during SSE streaming and verify that resources are NOT cleaned up (demonstrating the bug). For infrastructure issues, verify the defective state exists in the current codebase.

**Test Cases**:
1. **SSE Disconnect — Mysticism**: Simulate a request to `/mysticism/ai-interpret` with a mocked AI stream, trigger `req.destroy()` mid-stream, assert the AI stream iterator is NOT aborted (will fail on unfixed code — stream continues)
2. **SSE Disconnect — OpenAI Conversations**: Simulate a request to `/openai/conversations/:id/messages` with a mocked AI stream, trigger disconnect, assert the incomplete response IS saved to the database (will fail on unfixed code — save occurs)
3. **Docker Build Reproducibility**: Run `grep "no-frozen-lockfile" Dockerfile.api Dockerfile.web` and assert matches exist (will pass on unfixed code, demonstrating the bug)
4. **Model Constants Scatter**: Count distinct files defining `DEFAULT_OPENAI_MODEL` and assert > 1 (will pass on unfixed code, demonstrating duplication)

**Expected Counterexamples**:
- AI stream continues consuming tokens after client disconnect
- Incomplete AI responses are persisted to the database
- Possible causes: no `close` event listener, no `AbortController`, unconditional `db.insert` after stream loop

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL request WHERE isBugCondition(request) DO
  IF request.category == "sse" THEN
    result := handleStream_fixed(request)
    ASSERT result.aiStreamAborted == true
    ASSERT result.resourcesReleased == true
    ASSERT result.noWriteAfterClose == true
    IF request.endpoint == "/openai/conversations/:id/messages" THEN
      ASSERT result.incompleteResponseNotSaved == true
    END IF
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL request WHERE NOT isBugCondition(request) DO
  ASSERT handleStream_original(request) = handleStream_fixed(request)
  -- Specifically:
  -- All chunks delivered to connected client
  -- "done" event sent at end
  -- Full response saved to database (for conversations endpoint)
  -- 401 returned for unauthenticated readings requests
  -- Docker services start correctly
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (various message lengths, provider combinations, model selections)
- It catches edge cases that manual unit tests might miss (e.g., empty streams, single-chunk streams, very long streams)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for connected SSE streams and auth middleware, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Connected Stream Preservation — Mysticism**: Verify that fully-connected requests to `/mysticism/ai-interpret` deliver all chunks and end with `done` event after fix
2. **Connected Stream Preservation — OpenAI**: Verify that fully-connected requests to `/openai/conversations/:id/messages` deliver all chunks, save full response, and end with `done` event after fix
3. **Auth Middleware Preservation**: Verify that unauthenticated requests to readings endpoints still return 401 after switching to `requireClerkUser`
4. **Database Migration Preservation**: Verify that all six tables are created on fresh database after schema consolidation

### Unit Tests

- Test `AbortController` integration: mock AI stream, simulate disconnect, assert abort signal fired
- Test conditional database save: mock stream that aborts, assert no `db.insert` for assistant message
- Test `requireClerkUser` on readings routes: assert 401 for missing auth, assert `userId` attached for valid auth
- Test Docker build commands: lint Dockerfiles for `--frozen-lockfile` presence
- Test model constants: assert all consumer files import from the shared module (static analysis)

### Property-Based Tests

- Generate random stream lengths (1–100 chunks) and random disconnect points, verify resources are always cleaned up when disconnect occurs before stream end
- Generate random stream lengths with no disconnect, verify all chunks are delivered and response is saved
- Generate random authentication states (valid user, no user, expired token) and verify readings routes behave identically to the original `requireAuth` for all cases
- Generate random AI provider/model combinations and verify the correct default constant is used from the shared module

### Integration Tests

- End-to-end test: start API server, open SSE connection to `/mysticism/ai-interpret`, disconnect after 2 chunks, verify server-side stream is aborted within 1 second
- End-to-end test: start API server, open SSE connection to `/openai/conversations/:id/messages`, disconnect mid-stream, verify no incomplete message row in database
- Docker build test: run `docker build` with both Dockerfiles and verify it fails when lockfile is intentionally out of sync
- Full stack test: run `docker compose up`, verify no deprecation warnings in output, verify all services healthy

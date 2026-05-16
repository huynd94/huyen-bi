# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - SSE Resource Leak on Client Disconnect
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate SSE resource leaks when clients disconnect
  - **Scoped PBT Approach**: Generate random stream lengths (1–100 chunks) and random disconnect points before stream end; for each case, verify the AI stream is aborted and resources are released
  - Test `/mysticism/ai-interpret` endpoint: mock AI stream, simulate `req.destroy()` mid-stream, assert the AI stream iterator IS aborted and no further `res.write()` calls occur after disconnect
  - Test `/openai/conversations/:id/messages` endpoint: mock AI stream, simulate disconnect, assert the incomplete response is NOT saved to the database and the stream is aborted
  - Property: for all SSE requests where `clientDisconnected == true AND streamInProgress == true`, the fixed handler SHALL abort the AI API call, stop writing to the response, and release resources
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists: stream continues after disconnect, incomplete responses are saved)
  - Document counterexamples found (e.g., "AI stream continues consuming tokens after client disconnect", "incomplete response persisted to database")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Connected SSE Streams Deliver Complete Responses
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: fully-connected request to `/mysticism/ai-interpret` delivers all chunks and ends with `done` event on unfixed code
  - Observe: fully-connected request to `/openai/conversations/:id/messages` delivers all chunks, saves full response to database, and ends with `done` event on unfixed code
  - Observe: unauthenticated request to readings endpoints returns 401 on unfixed code
  - Observe: all six database tables are created on fresh database via current migration on unfixed code
  - Write property-based test: for all random stream lengths (1–100 chunks) with NO disconnect, all chunks are delivered to the client and response ends with `done` event (from Preservation Requirements 3.1, 3.2)
  - Write property-based test: for all random authentication states (valid user, no user, expired token), readings routes return 401 for unauthenticated requests (from Preservation Requirement 3.4)
  - Write property-based test: for all random AI provider/model combinations, the correct default constant is used (`gpt-5.4-nano` for OpenAI, `gemini-3.0-flash` for Gemini) (from Preservation Requirement 3.7)
  - Verify tests pass on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.4, 3.7_

- [x] 3. Fix SSE resource leaks on client disconnect

  - [x] 3.1 Implement AbortController pattern in `/mysticism/ai-interpret`
    - Create an `AbortController` before initiating the AI API call
    - Register a `close` event listener on `req` that calls `controller.abort()`
    - Pass `{ signal: controller.signal }` to OpenAI's `client.chat.completions.create()` and Gemini's `generateContentStream()`
    - Guard each `res.write()` call with a check that the request is still open
    - Remove the `close` event listener after stream completes normally
    - _Bug_Condition: isBugCondition(input) where input.category == "sse" AND input.context.clientDisconnected == true AND input.context.abortSignalNotRegistered == true_
    - _Expected_Behavior: AI stream aborted, no further writes, resources released_
    - _Preservation: Connected clients continue to receive all chunks and `done` event (Req 3.1)_
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 3.2 Implement AbortController pattern in `/openai/conversations/:id/messages`
    - Create an `AbortController` before initiating the AI API call
    - Register a `close` event listener on `req` that calls `controller.abort()`
    - Pass `{ signal: controller.signal }` to the OpenAI SDK stream
    - Conditionally save assistant message to database ONLY if stream completed successfully (not aborted)
    - Guard each `res.write()` call with a check that the request is still open
    - Remove the `close` event listener after stream completes normally
    - _Bug_Condition: isBugCondition(input) where input.category == "sse" AND input.context.clientDisconnected == true_
    - _Expected_Behavior: AI stream aborted, no writes after close, incomplete response NOT saved to database_
    - _Preservation: Connected clients continue to receive all chunks, full response saved, `done` event sent (Req 3.2)_
    - _Requirements: 1.2, 2.2, 3.2_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - SSE Resource Cleanup on Client Disconnect
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (abort on disconnect, no save of incomplete data)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Connected SSE Streams Deliver Complete Responses
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions for connected streams)
    - Confirm all SSE preservation tests still pass after fix (no regressions)

- [x] 4. Consolidate Drizzle ORM schema (eliminate dual schema management)

  - [x] 4.1 Define missing tables in Drizzle ORM schema
    - Create `lib/db/src/schema/server-config.ts` defining `serverConfig` table with `pgTable`
    - Create `lib/db/src/schema/usage-log.ts` defining `usageLog` table with `pgTable`
    - Create `lib/db/src/schema/saved-readings.ts` defining `savedReadings` table with `pgTable`
    - Create `lib/db/src/schema/share-tokens.ts` defining `shareTokens` table with `pgTable`
    - Update `lib/db/src/schema/index.ts` to export all new table definitions
    - _Bug_Condition: isBugCondition(input) where input.context.issue == "dual_schema_management"_
    - _Expected_Behavior: All tables defined in Drizzle ORM schema as single source of truth_
    - _Preservation: All six tables are created on fresh database (Req 3.3)_
    - _Requirements: 1.3, 2.3, 3.3_

  - [x] 4.2 Update `migrate.ts` to use Drizzle schema
    - Replace raw SQL `CREATE TABLE IF NOT EXISTS` statements with Drizzle-based migration or keep as compatibility layer that references schema definitions
    - Ensure auto-migration behavior is preserved (tables created on app start if they don't exist)
    - _Requirements: 2.3, 3.3_

- [x] 5. Replace duplicate auth middleware in readings.ts

  - [x] 5.1 Refactor `readings.ts` to use shared `requireClerkUser`
    - Remove the locally-defined `requireAuth` function
    - Add `import { requireClerkUser, type AuthenticatedRequest } from "../lib/clerk-user"`
    - Replace all `requireAuth` middleware references with `requireClerkUser`
    - Replace `req: any` type annotations with `req: AuthenticatedRequest`
    - _Bug_Condition: isBugCondition(input) where input.context.issue == "duplicate_auth_middleware"_
    - _Expected_Behavior: readings.ts uses shared requireClerkUser middleware with AuthenticatedRequest type_
    - _Preservation: Unauthenticated requests still return 401 (Req 3.4)_
    - _Requirements: 1.4, 2.4, 3.4_

- [x] 6. Fix Docker build reproducibility and Compose deprecation

  - [x] 6.1 Replace `--no-frozen-lockfile` with `--frozen-lockfile` in Dockerfiles
    - Update `Dockerfile.api`: change `pnpm install --no-frozen-lockfile` to `pnpm install --frozen-lockfile`
    - Update `Dockerfile.web`: change `pnpm install --no-frozen-lockfile` to `pnpm install --frozen-lockfile`
    - _Bug_Condition: isBugCondition(input) where input.context.issue == "no_frozen_lockfile"_
    - _Expected_Behavior: Builds fail deterministically if lockfile is out of sync_
    - _Preservation: Docker images build successfully when dependencies are properly locked (Req 3.5)_
    - _Requirements: 1.5, 2.5, 3.5_

  - [x] 6.2 Remove obsolete `version` field from `docker-compose.yml`
    - Delete the `version: "3.9"` line from `docker-compose.yml`
    - _Bug_Condition: isBugCondition(input) where input.context.issue == "docker_compose_version_field"_
    - _Expected_Behavior: No deprecation warnings from Docker Compose V2_
    - _Preservation: All three services (postgres, api, web) start with correct networking and health checks (Req 3.6)_
    - _Requirements: 1.6, 2.6, 3.6_

- [x] 7. Centralize AI model constants

  - [x] 7.1 Create shared AI model constants module
    - Create a shared constants file (e.g., `artifacts/api-server/src/lib/ai-constants.ts`) exporting `DEFAULT_OPENAI_MODEL = "gpt-5.4-nano"` and `DEFAULT_GEMINI_MODEL = "gemini-3.0-flash"`
    - _Bug_Condition: isBugCondition(input) where input.context.issue == "scattered_model_constants"_
    - _Expected_Behavior: Single source of truth for AI model identifiers_
    - _Requirements: 2.7_

  - [x] 7.2 Update all consumers to import from shared module
    - Update `mysticism/index.ts`: remove local constant definitions, import from shared module
    - Update `openai/index.ts`: remove local constant definitions, import from shared module
    - Update `server-config.ts`: import constant for the `DEFAULTS` map instead of hardcoding
    - Update `config/index.ts`: import constant for the fallback value instead of hardcoding
    - Update frontend `ai-settings.tsx`: import from shared module or create a frontend-specific constants file that mirrors backend values
    - _Preservation: AI endpoints continue to default to `gpt-5.4-nano` for OpenAI and `gemini-3.0-flash` for Gemini (Req 3.7)_
    - _Requirements: 1.7, 2.7, 3.7_

- [x] 8. Checkpoint - Ensure all tests pass
  - Run full test suite to verify all property-based tests pass
  - Verify bug condition exploration test passes (SSE resource cleanup works)
  - Verify preservation tests pass (connected streams, auth, model defaults unchanged)
  - Verify Docker builds succeed with `--frozen-lockfile`
  - Verify `docker compose up` produces no deprecation warnings
  - Verify all six database tables are created correctly from Drizzle schema
  - Ensure all tests pass, ask the user if questions arise.

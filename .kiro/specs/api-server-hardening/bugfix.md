# Bugfix Requirements Document

## Introduction

This document captures six bugs found during a code review of the Huyền Bí monorepo's API server and deployment infrastructure. The bugs range from critical resource leaks in SSE streaming endpoints to low-severity code duplication issues. Fixing these issues will improve reliability, reproducibility, and maintainability of the system.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a client disconnects mid-stream from the `/mysticism/ai-interpret` SSE endpoint THEN the system continues the AI API call to completion, wasting API credits and server resources

1.2 WHEN a client disconnects mid-stream from the `/openai/conversations/:id/messages` SSE endpoint THEN the system continues the AI API call, saves the partial response to the database, and does not release resources

1.3 WHEN the Drizzle ORM schema in `lib/db/src/schema/` is inspected THEN the system only defines `conversations` and `messages` tables, while `server_config`, `usage_log`, `saved_readings`, and `share_tokens` tables are managed via raw SQL in `migrate.ts` creating two parallel schema management systems

1.4 WHEN the `readings.ts` route file handles authentication THEN the system uses a locally-defined `requireAuth` middleware that assigns `req.userId` directly, instead of reusing the shared `requireClerkUser` middleware from `lib/clerk-user.ts` which casts to `AuthenticatedRequest`

1.5 WHEN Docker images are built using `Dockerfile.api` or `Dockerfile.web` THEN the system runs `pnpm install --no-frozen-lockfile`, meaning dependency versions can drift between builds producing non-reproducible artifacts

1.6 WHEN `docker-compose.yml` is parsed by Docker Compose V2 THEN the system emits a deprecation warning due to the `version: "3.9"` field which is no longer required

1.7 WHEN AI model constants are needed across the codebase THEN the system defines `DEFAULT_OPENAI_MODEL` and `DEFAULT_GEMINI_MODEL` independently in `server-config.ts`, `mysticism/index.ts`, `openai/index.ts`, `config/index.ts`, and the frontend `ai-settings.tsx`, creating risk of inconsistency when updating model versions

### Expected Behavior (Correct)

2.1 WHEN a client disconnects mid-stream from the `/mysticism/ai-interpret` SSE endpoint THEN the system SHALL abort the in-progress AI API call, stop writing to the response, and release all associated resources

2.2 WHEN a client disconnects mid-stream from the `/openai/conversations/:id/messages` SSE endpoint THEN the system SHALL abort the in-progress AI API call, stop writing to the response, NOT save the incomplete response to the database, and release all associated resources

2.3 WHEN database tables are managed THEN the system SHALL define all tables (`conversations`, `messages`, `server_config`, `usage_log`, `saved_readings`, `share_tokens`) in the Drizzle ORM schema as the single source of truth, and migrations SHALL be generated from the schema

2.4 WHEN the `readings.ts` route file handles authentication THEN the system SHALL reuse the shared `requireClerkUser` middleware from `lib/clerk-user.ts` and use the `AuthenticatedRequest` type for type-safe access to `userId`

2.5 WHEN Docker images are built using `Dockerfile.api` or `Dockerfile.web` THEN the system SHALL use `pnpm install --frozen-lockfile` to ensure builds are reproducible and fail if the lockfile is out of sync

2.6 WHEN `docker-compose.yml` is parsed by Docker Compose V2 THEN the system SHALL NOT emit deprecation warnings because the obsolete `version` field has been removed

2.7 WHEN AI model constants are needed across the codebase THEN the system SHALL import them from a single shared source (e.g., a shared constants module) so that updating a model version requires changing only one location

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a client remains connected throughout an SSE stream on `/mysticism/ai-interpret` THEN the system SHALL CONTINUE TO stream all AI-generated content chunks to the client and end the response with a `done` event

3.2 WHEN a client remains connected throughout an SSE stream on `/openai/conversations/:id/messages` THEN the system SHALL CONTINUE TO stream all AI-generated content chunks to the client, save the full response to the database, and end the response with a `done` event

3.3 WHEN the application starts and connects to the database THEN the system SHALL CONTINUE TO create all required tables if they do not exist (auto-migration behavior)

3.4 WHEN an unauthenticated request hits a protected readings endpoint THEN the system SHALL CONTINUE TO return a 401 Unauthorized response

3.5 WHEN Docker images are built with all dependencies already locked THEN the system SHALL CONTINUE TO install dependencies successfully and produce working images

3.6 WHEN `docker-compose up` is run THEN the system SHALL CONTINUE TO start all three services (postgres, api, web) with correct networking and health checks

3.7 WHEN AI streaming endpoints use model constants THEN the system SHALL CONTINUE TO default to the same model identifiers (`gpt-5.4-nano` for OpenAI, `gemini-3.0-flash` for Gemini) unless overridden by user or server configuration

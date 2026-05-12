// Only re-export the runtime zod schemas from `generated/api`.
//
// The `generated/types` directory contains TypeScript interfaces with the
// same names as the zod schemas (e.g. `CreateOpenaiConversationBody`,
// `SendOpenaiMessageBody`). Re-exporting both directories here causes
// "module has already exported a member named X" errors. Consumers that need
// the TS types can import directly from `@workspace/api-zod/generated/types`
// if the ambiguity ever needs to be resolved; in practice everything we use
// is a zod schema, which already yields the matching TS type via `z.infer`.
export * from "./generated/api";

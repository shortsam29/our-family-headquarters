# Kenzie AI Foundation

## Architecture

Kenzie Phase 2 is server-only and composable. `lib/kenzie/core` contains stable identity, household values, dates, and context. `profiles` contains family intelligence plus an authenticated member-ID registry. `policies` owns conversation, permission, and memory rules. `prompts` assembles deterministic instructions. `conversation` separates Kenzie business rules from the OpenAI provider.

The shared platform foundation lives in `lib/kenzie/platform`. Context providers receive the authenticated household context and return only authorized structured data. Provider output is labeled as untrusted data when added to a conversation prompt. The action executor validates input, authentication, household boundaries, and authorization before calling an application service; it never gives the model a database client.

Private Notes from Kenzie and internal notification records have recipient-scoped persistence and RLS. They store message delivery state, not conversation history or personality data. External push, email, SMS, autonomous note generation, durable memory, and live application providers remain disabled.

The existing deterministic `lib/kenzie/intelligence.ts` remains unchanged.

## Runtime flow

Authenticated member → development-only route → member-ID profile resolver → prompt assembler → provider interface → OpenAI Responses API → normalized response.

The route has no tools or write actions. It is unavailable when `NODE_ENV=production`. Conversations remain in component state and are not stored in Supabase or OpenAI (`store: false`).

## Security

The API key and model are server-only. Browser requests contain only the message and short session history. The member ID and role come from the authenticated Supabase session. Stored/app context is labeled as untrusted data. Errors are sanitized, output is limited, requests time out, retries are disabled, and rate limiting is local.

No migration, RLS, authentication, deployment, or production change is part of Phase 2.

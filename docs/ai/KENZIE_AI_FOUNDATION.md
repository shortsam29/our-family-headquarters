# Kenzie AI Foundation

## Architecture

Kenzie Phase 2 is server-only and composable. `lib/kenzie/core` contains stable identity, household values, dates, and context. `profiles` contains family intelligence plus an authenticated member-ID registry. `policies` owns conversation, permission, and memory rules. `prompts` assembles deterministic instructions. `conversation` separates Kenzie business rules from the OpenAI provider.

The shared platform foundation lives in `lib/kenzie/platform`. Context providers receive the authenticated household context and return only authorized structured data. Provider output is labeled as untrusted data when added to a conversation prompt. The action executor validates input, authentication, household boundaries, and authorization before calling an application service; it never gives the model a database client.

Calendar, chore, shopping, and meal providers now load compact, permission-filtered summaries using the trusted household and member UUIDs. A conservative server-side relevance router selects the minimum provider set; general school, writing, creative, and knowledge questions load no household data.

Private Notes from Kenzie and internal notification records have recipient-scoped persistence and RLS. Personal Headquarters displays only the authenticated member's notes and can mark them read. Navigation shows that member's unread note count. Notes store delivery content and state, not conversation history or personality data. External push, email, SMS, autonomous note generation, and durable memory remain disabled.

The existing deterministic `lib/kenzie/intelligence.ts` remains unchanged.

## Runtime flow

Authenticated member → member-ID profile resolver → server-side relevance selection → authorized context providers → prompt assembler → OpenAI Responses API → normalized response.

The single Kenzie route supports general conversation and four tightly bounded application actions: add a shopping item, create a calendar event, complete the authenticated member's own chore, and save a meal-plan entry. Calendar and meal changes require an explicit confirmation round trip and an adult administrative role. Shopping additions follow the collaborative shopping policy; own-chore completion is scoped to the authenticated member. Unknown action names and browser-supplied identity controls are rejected. Conversations remain in component state and are not stored in Supabase or OpenAI (`store: false`).

## Security

The API key and model are server-only. Browser requests contain only the message and short session history. The member ID and role come from the authenticated Supabase session. Stored/app context is labeled as untrusted data. Errors are sanitized, output is limited, requests time out, retries are disabled, and rate limiting is local.

The managed-profile and platform-foundation migrations are applied to the verified development project. They add UUID associations, recipient-scoped notes, internal notification persistence, indexes, grants, and RLS without migrating household content. No deployment or production household-row modification is part of this activation.

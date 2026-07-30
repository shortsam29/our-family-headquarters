# Kenzie AI Foundation

## Architecture

Kenzie Phase 2 is server-only and composable. `lib/kenzie/core` contains stable identity, household values, dates, and context. `profiles` contains family intelligence plus an authenticated member-ID registry. `policies` owns conversation, permission, and memory rules. `prompts` assembles deterministic instructions. `conversation` separates Kenzie business rules from the OpenAI provider.

The shared platform foundation lives in `lib/kenzie/platform`. Context providers receive the authenticated household context and return only authorized structured data. Provider output is labeled as untrusted data when added to a conversation prompt. The action executor validates input, authentication, household boundaries, and authorization before calling an application service; it never gives the model a database client.

Calendar, chore, shopping, and meal providers now load compact, permission-filtered summaries using the trusted household and member UUIDs. A conservative server-side relevance router selects the minimum provider set; general school, writing, creative, and knowledge questions load no household data.

Private Notes from Kenzie, one-time reminders, and internal notifications have recipient-scoped persistence and RLS. Personal Headquarters displays only the authenticated member's notes and reminders; notes support mark-one, mark-all, and archive behavior. The app-wide notification center supports recent items, unread state, mark-one, and mark-all, with a single navigation badge sourced from internal notifications. A note trigger creates one deduplicated notification and synchronizes read/archive state.

Kenzie chat can propose a direct note or one-time reminder after resolving the recipient against active household membership. Another-person writes require a manager or parent and explicit confirmation. Self notes and reminders still use trusted UUID identity and a visible confirmation. External push, email, SMS, and autonomous note generation remain disabled.

Private personal memory is now enabled in the development environment after a first-use disclosure. A deterministic structured extractor accepts only direct, allowlisted, low-sensitivity statements; the server validates every candidate again before persistence. The owner can review, edit, delete, undo a newly saved memory, delete all, pause, resume, or opt out by message or conversation. Temporary memories expire, duplicate observations reinforce one record, and changed statements replace the prior active value. Complete conversation transcripts are never written.

The existing deterministic `lib/kenzie/intelligence.ts` remains unchanged.

## Runtime flow

Authenticated member → member-ID profile resolver → server-side relevance selection → authorized context and relevant owner memory → prompt assembler → OpenAI Responses API → normalized response.

The single Kenzie route supports general conversation and tightly bounded application actions: add a shopping item, create a calendar event, complete the authenticated member's own chore, save a meal-plan entry, leave a private note, and set a one-time reminder. Calendar, meal, note, and reminder changes use an explicit confirmation round trip. Shopping additions follow the collaborative shopping policy; own-chore completion is scoped to the authenticated member. Unknown action names and browser-supplied identity controls are rejected. Conversations remain in component state and are not stored in Supabase or OpenAI (`store: false`).

## Security

The API key and model are server-only. Browser requests contain only the message and short session history. The member ID and role come from the authenticated Supabase session. Stored/app context is labeled as untrusted data. Errors are sanitized, output is limited, requests time out, retries are disabled, and rate limiting is local.

The managed-profile and platform-foundation migrations are applied to the verified development project. They add UUID associations, recipient-scoped notes, internal notification persistence, indexes, grants, and RLS without migrating household content. No deployment or production household-row modification is part of this activation.

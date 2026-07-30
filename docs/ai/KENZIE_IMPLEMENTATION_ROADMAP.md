# Kenzie Implementation Roadmap

- Phase 1: Secure API connection — complete locally.
- Phase 2: Kenzie identity, typed family intelligence, capability profiles, prompt architecture, provider abstraction, and development-only conversation — complete locally.
- Phase 3: Household-managed profile configuration and privacy review — complete.
- Phase 4: Shared platform and first end-to-end activation — live calendar, chore, shopping, and meal context; validated actions; personalized notes; in-app notifications; and one-time reminders.
- Phase 5: Broader action coverage, richer relevance classification, idempotency, and audit records.
- Phase 6: Controlled conversation history and explicitly approved memory.
- Phase 7: Additional provider adapters and proactive notification suggestions.
- Phase 8: Proactive suggestions and approved pattern learning.
- Phase 9: Evaluation, privacy review, durable rate limiting, abuse safeguards, and production readiness.

Current boundary: conversation content is not persisted and durable memory remains disabled. Future action expansion must keep UUID identity, server-side provider selection, household authorization, confirmation for consequential changes, and fail-closed behavior.

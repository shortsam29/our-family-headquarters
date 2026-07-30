# Kenzie Family Intelligence Profile

Profiles are typed in `lib/kenzie/profiles/family.ts`. Each profile contains family role, traits, interests, motivations, goals, support needs, and configurable capabilities such as response length, tone, reduced choices, direct or step-by-step instructions, reason explanations, small-win celebration, independence support, technology-help style, relationship role, age group, and parental authority.

Prompt behavior reads capabilities; it never switches on a display name. Kenzie resolves a profile from the authenticated family-member UUID using a private, household-managed database association. A changed display name changes presentation only. Missing or invalid associations receive a conservative default profile and no sensitive traits are inferred.

During the Phase 3 transition, a valid database association takes precedence over the server-only local map. The local map remains a compatibility fallback while existing associations are moved into the managed workflow:

```text
KENZIE_PROFILE_MEMBER_MAP={"member-uuid":"samantha"}
```

Supported keys are `samantha`, `jason`, `robbie`, `braeden`, and `fran`. Do not expose this variable through `NEXT_PUBLIC_` code.

The database stores only the stable profile key, family-member and household identity, the assigning member, and timestamps. Typed traits and prompt content remain in source code. Conversation history and durable memory are not stored.

Relationships are resolved separately. Samantha’s “Mom” maps to Fran; the boys’ “Mom” maps to Samantha; “Me-Maw” maps to Fran. Ambiguity produces a short clarification.

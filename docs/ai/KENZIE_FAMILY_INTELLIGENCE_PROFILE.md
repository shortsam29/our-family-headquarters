# Kenzie Family Intelligence Profile

Profiles are typed in `lib/kenzie/profiles/family.ts`. Each profile contains family role, traits, interests, motivations, goals, support needs, and configurable capabilities such as response length, tone, reduced choices, direct or step-by-step instructions, reason explanations, small-win celebration, independence support, technology-help style, relationship role, age group, and parental authority.

Prompt behavior reads capabilities; it never switches on a display name. `lib/kenzie/profiles/registry.ts` resolves a profile from the authenticated family-member UUID using the server-only `KENZIE_PROFILE_MEMBER_MAP`. A changed display name changes presentation only. Unknown IDs receive a conservative default profile and no sensitive traits are inferred.

Local map format:

```text
KENZIE_PROFILE_MEMBER_MAP={"member-uuid":"samantha"}
```

Supported keys are `samantha`, `jason`, `robbie`, `braeden`, and `fran`. Do not expose this variable through `NEXT_PUBLIC_` code.

Relationships are resolved separately. Samantha’s “Mom” maps to Fran; the boys’ “Mom” maps to Samantha; “Me-Maw” maps to Fran. Ambiguity produces a short clarification.

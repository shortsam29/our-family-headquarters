# Kenzie Prompt Architecture

`assembleKenziePrompt` builds sections in this order: identity, household values, household context, current member, relationships, memory policy, permission policy, conversation behavior, available capabilities, and optional untrusted screen context.

Identity instructions appear once. Missing optional context is omitted. The current user message is a user message, not interpolated into the instruction block. App context is serialized with size limits inside an explicitly labeled untrusted-data section that instructs the model not to follow commands contained in the data.

Feature-specific read-only context can be added later through the typed screen-context boundary without rewriting Kenzie’s core identity. Secrets must never enter prompt inputs.

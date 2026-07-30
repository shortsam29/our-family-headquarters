# Kenzie Developer Guide

## Local setup

Keep `OPENAI_API_KEY`, `OPENAI_MODEL`, and `KENZIE_PROFILE_MEMBER_MAP` in ignored `.env.local`. Restart the development server after changing them. Never prefix these variables with `NEXT_PUBLIC_`.

## Test chat

1. Run `npm run dev`.
2. Sign in with a real development Supabase household member.
3. Open `/kenzie`.
4. Use Talk with Kenzie.
5. Use Reset conversation to clear component-local history.

The chat returns 404 in production. It has no tools, writes, database history, or automatic memory. Current member identity comes from the authenticated context, not the request body.

## Validation

Run the focused Kenzie Vitest files, TypeScript, targeted ESLint, one production build, a secret-pattern scan, and a browser-bundle scan.

## Limitations

The member-ID map must be configured server-side until an approved profile-key field exists. Rate limiting is process-local. Conversation history disappears on reset or reload. There is no research, memory, app context, tool execution, calendar provider, push provider, or production chat.

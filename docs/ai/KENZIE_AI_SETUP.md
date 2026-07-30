# Kenzie AI Setup

## Existing architecture

Our Family Headquarters is a Next.js 16 TypeScript PWA deployed through Vercel. Supabase provides PostgreSQL, authentication, storage, and Row-Level Security. Authenticated server components, server actions, and route handlers resolve the current household through the user's Supabase session.

Kenzie already has deterministic briefings, household memory, preferences, and an approval-based tomorrow planner. Phase 1 does not send any of that information to OpenAI.

## Integration location

The OpenAI client lives in `lib/ai/openai.ts` and is called only by the Node.js Route Handler at `app/api/kenzie/connection-test/route.ts`.

The connection-test route:

- is unavailable when `NODE_ENV` is `production`;
- requires a real authenticated Supabase session;
- requires the `household_manager` role;
- accepts only the fixed connection-test request;
- sends no household or personal information;
- uses a basic local rate limit;
- returns only sanitized output.

## Required environment variables

Add these values to the project-root `.env.local` file:

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
```

Place the real key after `OPENAI_API_KEY=

The committed `.env.example` contains empty placeholders only.

## Safe local setup

1. Generate an API key in the OpenAI platform.
2. Open the ignored project-root `.env.local`.
3. Add the two variables shown above.
4. Save the file.
5. Restart `npm run dev` after changing environment variables.
6. Sign in with the real household-manager development account.
7. Open `/kenzie`.
8. Select **Test secure AI connection**.

A successful test displays:

```text
Kenzie connection successful.
```

The initial request uses:

- the model configured by `OPENAI_MODEL`;
- the OpenAI Responses API;
- `store: false`;
- a 10-second timeout;
- zero automatic retries;
- a 32-token output limit;
- no tools, memory, streaming, or family data.

## Verify that the key is not exposed

1. Confirm `.env.local` is ignored with `git check-ignore -v .env.local`.
2. Confirm no variable named `NEXT_PUBLIC_OPENAI_API_KEY` exists.
3. Search tracked source for the key variable name. Only server-side configuration and documentation placeholders should appear.
4. Never search for or print the real key value.
5. Confirm the connection-test component contains no `process.env` access.
6. Confirm the route returns only `ok`, `message`, and the configured model name.

## Files added or changed

- `.env.example`
- `package.json`
- `package-lock.json`
- `lib/ai/environment.ts`
- `lib/ai/openai.ts`
- `lib/ai/rate-limit.ts`
- `app/api/kenzie/connection-test/route.ts`
- `components/kenzie/KenzieConnectionTest.tsx`
- `app/(main)/kenzie/page.tsx`
- focused unit tests
- `docs/ai/KENZIE_AI_SETUP.md`
- `docs/ai/KENZIE_IMPLEMENTATION_ROADMAP.md`

## Rollback

1. Remove the files added under `lib/ai/`, `app/api/kenzie/connection-test/`, and `components/kenzie/`.
2. Remove the development-only connection-test section from the Kenzie page.
3. Remove `OPENAI_API_KEY` and `OPENAI_MODEL` from `.env.example` and local `.env.local`.
4. Run `npm uninstall openai`.
5. Remove the focused Kenzie AI tests and these two AI documentation files.

No database rollback is required because Phase 1 creates no migrations or stored data.

## Known limitations

- The local in-memory rate limit is not shared across Vercel instances.
- The test endpoint is intentionally unavailable in production.
- No conversation history, family context, Kenzie personality, tools, streaming, or write actions exist.
- Model access and API billing depend on the OpenAI project connected to the local key.

## Recommended next phase

After the connection is verified and privacy behavior is reviewed, Phase 2 may define Kenzie's identity and system instructions. Household data and memory should remain disconnected until separately approved.


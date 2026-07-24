# Secure Backend Foundation

## Approved Platform

Milestone 5A uses Supabase for PostgreSQL, email/password authentication, cookie-backed sessions, and Row-Level Security. Next.js Server Components perform initial reads, Server Actions perform bounded mutations, and the browser receives only the public Supabase URL and publishable key.

No service-role key belongs in the application runtime or browser.

## Environment

Copy `.env.example` to `.env.local` and provide:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`OFH_AUTH_TEST_BYPASS=1` is reserved for automated tests and explicit local demonstrations. The code refuses to enable it when `NODE_ENV=production`.

Without valid public configuration, protected routes redirect to a calm configuration message rather than exposing mock household data or failing with a technical error.

## Authentication

The root `proxy.ts` refreshes Supabase sessions and protects every family-facing route. `/sign-in` remains public. Authentication uses email and password; sign-out clears the Supabase session and redirects to sign-in.

Account creation, password recovery UI, household onboarding, invitations, multi-factor authentication, and device management remain deferred until their complete approved workflows can be implemented.

## Household Model

Authentication accounts, family members, and user profiles are distinct:

- `auth.users` identifies the account.
- `households` owns tenant data and exactly one manager account.
- `family_members` represents people, including children without login accounts.
- `household_memberships` links an authenticated account to one family member in one household.
- `user_profiles` owns individual experience preferences.

Version 1.0 roles are Household Manager, Parent, Child, Caregiver, and Guest. Membership can be active, inactive, or archived.

## Core Data

The first migration defines:

- households and memberships;
- family members and user profiles;
- schedule events and participants;
- tasks, assignments, and per-day completion records.

Every household record has a stable UUID, relational constraints, timestamps, tenancy, indexes, and bounded deletion behavior. Task completions are unique per assignment and date, preventing duplicate completion records.

## Authorization

RLS is enabled on every application table. Security helper functions resolve active membership, current member, and role using the authenticated account.

- Shared schedule reads require active household membership.
- Schedule mutations require Household Manager or Parent.
- Task reads require household membership.
- Task assignments are visible to the assignee or managing adults.
- Task completion insertion and removal require the current assigned member.
- Family-member management requires Household Manager or Parent.
- User profiles are visible to their owner or managing adults.

Client-side visibility is not treated as security. Repositories retain household/member filters, and RLS remains authoritative.

## Data Access

`lib/data/core.ts` is the server-side repository boundary for Today, Schedule, My Day, and Family Hub. Presentation components do not query Supabase directly.

Normal configured routes never silently fall back to fictional household data. Development fixtures remain available only when the explicit non-production bypass is enabled and remain the source for `/design-system` and tests.

Domains without a persistent source return honest empty/setup states.

Household-local database dates are generated with `formatToParts` and assembled
as `YYYY-MM-DD`. This preserves the household time zone's calendar day without
depending on locale-specific display order or converting the value through UTC.

## Task Persistence

The task Server Action:

1. Validates the assignment UUID and desired completion state.
2. Resolves the authenticated household and current family member.
3. Re-queries an assignment scoped to that member.
4. Upserts or deletes the completion for the household-local date.
5. Returns a family-safe error and only updates the interface after confirmation.

## Schedule Persistence

Schedule reads are household-scoped and include all-day or timed events, participants, category, location, and creator. Create, edit, cancellation, recurrence, and external synchronization remain deferred; this milestone does not invent their incomplete workflows.

## Development Seeding

`supabase/seed.sql` creates two isolated fictional development households. The
first contains a manager and child account, events, assigned tasks, and a
completion record; the second contains a separate manager, event, and task for
tenant-isolation verification. It requires:

- three explicit development Auth user IDs;
- the confirmation value `OUR_FAMILY_HEADQUARTERS_DEVELOPMENT`.

Stable fictional identifiers and upserts make the script repeatable without a
database reset. The script refuses to run without the development confirmation
and is never executed automatically in production.

`supabase/tests/security-verification.sql` uses portable PostgreSQL assertions
inside a rolled-back transaction. It verifies anonymous denial, household
isolation, cross-household mutation denial, assignment visibility, completion
permissions, and current-user resolution without requiring pgTAP.

## Local Setup

1. Create a Supabase project or start the Supabase local stack.
2. Apply `supabase/migrations/20260723210000_core_household.sql`.
3. Enable email/password authentication.
4. Create the three fictional development users through Supabase Auth.
5. Run the seed script with those user IDs and the explicit development confirmation.
6. Add the public URL and publishable key to `.env.local`.
7. Run `npm run dev`.

Migration and RLS integration verification require a configured local or linked
development Supabase project. Browser automation remains deferred in
environments where browser or media permission handling is unstable; the core
backend checks can be completed with the Supabase CLI, direct HTTP verification,
and unit tests. No production credentials belong in the repository.

## Deferred Work

- Household creation and invitation UX
- Password recovery UI and email templates
- Event create/edit/cancel forms
- Task creation, assignment, recurrence, approval, or allowance
- Offline mutation queues and conflict resolution
- Audit-record persistence
- Persistent conversations, announcements, meals, shopping, weather, and Kenzie content
- Production backup, restore, monitoring, and deployment configuration

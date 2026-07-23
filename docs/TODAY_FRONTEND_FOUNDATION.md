# Today Frontend Foundation

## Purpose

This document records the frontend boundary established for Milestone 4B. It prepares Today’s Headquarters for future data services without introducing authentication, database behavior, or persistence.

## Data Contracts

Shared TypeScript contracts live in `types/today.ts`. The contracts model the current family member, weather, schedule, dinner, personal tasks, household updates, supporting previews, and Kenzie’s note without assuming a database schema.

Every section uses a discriminated state contract:

- `populated` contains typed data.
- `empty` confirms that no content is waiting.
- `loading` communicates that content is being prepared.
- `error` degrades gracefully without implying that other household information is unavailable.

## Shared and Personalized Content

Household-scoped content includes weather, household schedule, dinner, family updates, shopping, groceries, inbox previews, and upcoming items.

Member-scoped content includes the current member’s tasks and personalized Kenzie guidance. The development persona uses a neutral identifier and can be replaced by a future authenticated member without changing presentation components.

The Today page never treats one member’s responsibilities as the household default and never displays another member’s complete task list.

## Mock Data

Development data lives in `lib/today/mock-data.ts`. Page and component files consume this single data source instead of defining placeholder records locally.

The mock layer is intentionally synchronous and side-effect free. A future service adapter can return the same `TodayExperienceData` contract.

## Interaction and Persistence Boundary

Today’s To-Do owns session-only completion state inside its small Client Component. Toggling a task does not write to storage and does not mutate household records.

Future persistence should be added behind a typed task service or server action that:

1. Resolves the signed-in member and active household.
2. Checks permission and task ownership.
3. Applies the authoritative task lifecycle.
4. Returns a confirmed result before the interface reports success.

No `localStorage`, backend, authentication, reward, approval, or assignment behavior is part of this milestone.

## Date Boundary

The Today date is formatted in the browser with the user’s locale. It renders after hydration to avoid server-timezone mismatch, exposes a machine-readable local date through the semantic `time` element, and schedules a refresh at the next local day boundary.

## State Review

The development-only `/design-system` route demonstrates all four section states. Developer examples do not appear in the normal family experience.

## Testing Recommendation

The repository does not currently include an automated test runner. A future testing milestone should add:

- Vitest for pure date utilities and typed transformations.
- React Testing Library for task toggling, accessible names, progress, and empty states.
- Playwright for hydration, responsive behavior, keyboard operation, and local-date integration.

No test framework was added during Milestone 4B to avoid an unapproved dependency and configuration expansion.

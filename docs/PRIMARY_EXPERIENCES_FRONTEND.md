# Primary Experiences Frontend

## Route Map

The shared application shell owns the Header and primary navigation for:

- `/` — Today’s Headquarters
- `/schedule` — household and member-relevant calendar views
- `/family-hub` — household communication and relational summaries
- `/my-day` — the current member’s focused execution view
- `/more` — the doorway to approved secondary household systems

More links to `/meals`, `/shopping`, `/household`, `/pets`, `/contacts`, `/vehicles`, `/documents`, `/finance`, and `/settings`. These routes are intentionally lightweight frontend overviews. They do not imply that persistence, integrations, or protected detail access exists.

## Shared Application Shell

`app/(main)/layout.tsx` renders the shared Header, route-aware Sidebar, and main landmark. Route pages provide only their content. The Sidebar uses real Next.js links, exposes the current page with `aria-current`, and treats secondary overview routes as rooms reached through More.

Desktop uses the permanent left sidebar. Tablet and mobile retain the existing compact, horizontally scroll-safe navigation treatment. The shell remains a Server Component; only route awareness inside the Sidebar requires a Client Component.

## Feature Data Contracts

`types/features.ts` defines presentation-independent contracts for:

- schedule events and views;
- family members and family communication;
- household asset summaries;
- personal reminders and My Day data;
- approved secondary destinations.

Stable development data lives in `lib/features/mock-data.ts`. Shared entities such as family members, events, tasks, pets, contacts, and vehicles are referenced across rooms instead of being redefined inside JSX.

## Shared, Personal, and Protected Boundaries

Household-shared information includes shared events, family conversations, announcements, meals, shopping, and household care summaries.

Member-specific information includes assigned tasks, homework, routines, personal reminders, relevant schedule items, and contextual Kenzie guidance. My Day is the focused personal view; Today’s Headquarters remains the shared household overview.

Permission-aware information includes emergency contacts, vehicle records, finance, and document summaries. Development routes expose only neutral summaries and access labels. Future services must authorize the signed-in member before returning protected details.

## State Handling

Major feature sections use the existing discriminated `TodaySectionState` contract for populated, empty, loading, and error states. Normal routes render populated development data. Alternate states remain isolated to development previews so family members never encounter developer controls.

Empty states are reassuring, loading is quiet and reduced-motion aware, and errors describe temporary unavailability without implying wider household failure.

## Interaction and Persistence

Schedule view selection and task completion are session-only Client Component boundaries. Page layouts and data preparation remain server-rendered. No local storage, authentication, database, external calendar, document store, finance integration, or notification behavior is present.

Future persistence should be introduced behind typed services or server actions that resolve the active household and member, enforce permissions, update authoritative records, and return confirmed results.

## Testing

- Vitest covers utilities and component behavior.
- React Testing Library covers task completion, accessible empty states, active navigation, and Schedule view switching.
- Playwright covers the critical primary-navigation path, a More destination, and mobile horizontal overflow.

Commands:

- `npm test`
- `npm run test:e2e`

The Playwright configuration starts the existing Next.js development server when needed and uses Chromium for the critical browser flow.

# Our Family Headquarters

## Project Vision

A family operations application that centralizes planning, household management, family information, finances, documents, and shared responsibilities.

## Current Technology

- Next.js
- React
- TypeScript
- Git and GitHub
- VS Code
- Supabase planned for backend and authentication
- Vercel planned for deployment

## Folder Conventions

- `app/` for routes, pages, layouts, and route-specific files
- `components/` for reusable UI components
- `lib/` for shared utilities and service code
- `types/` for shared TypeScript types
- `public/` for static assets

Do not create `lib/` or `types/` yet unless they already exist.

## Development Workflow

1. Work on a feature branch.
2. Make one focused change at a time.
3. Run validation after each milestone.
4. Keep the application working.
5. Review changes before committing.
6. Use small, descriptive commits.
7. Push after a milestone is complete.

## Milestone Roadmap

- [x] Milestone 1: Development environment and initial application shell
- [x] Milestone 2: Sidebar navigation and responsive application layout
- [x] Milestone 3: Design system and visual foundation
- [ ] Milestone 4: Dashboard page
- [ ] Milestone 5: Planning section
- [ ] Milestone 6: Household section
- [ ] Milestone 7: Family section
- [ ] Milestone 8: Finance section
- [ ] Milestone 9: Documents section
- [ ] Milestone 10: Settings and user preferences
- [ ] Milestone 11: Authentication and Supabase integration
- [ ] Milestone 12: Testing, accessibility, and deployment

Milestone 3 will establish the shared visual foundation before additional feature pages are built. It will define color tokens, typography, spacing, borders, shadows, buttons, cards, navigation states, and responsive design conventions.

## Current Status

Milestones 1 through 3 are complete. The current application includes:

- A reusable Header component
- A reusable Sidebar component with primary navigation
- A responsive application shell with the Header at the top, Sidebar on the left, and main content area
- A small-screen layout that stacks the Sidebar above the main content
- Centralized semantic design tokens for color, typography, spacing, shape, elevation, motion, and layout
- Optimized Manrope interface typography and Cormorant Garamond brand typography
- A typed reusable design-system component library
- Illustration infrastructure and accessibility guidance without final artwork
- A development-only design-system preview at `/design-system`
- A centralized typed Today frontend model and mock-data boundary
- A browser-local, hydration-safe Today date
- Reusable populated, empty, loading, and error states for Today sections
- An accessible, session-only interactive Today’s To-Do preview for the current family member
- Successful TypeScript validation
- Successful production build
- A working development server at http://localhost:3000

Milestone 4B is in review. Its current scope establishes the functional Today experience foundation without backend persistence, authentication, or future feature routes.

## Engineering Rules

- Do not introduce unnecessary dependencies.
- Do not make large architectural changes without explanation.
- Prefer simple, maintainable solutions.
- Follow Next.js App Router conventions.
- Keep reusable components focused on one responsibility.
- Do not leave TypeScript, lint, or build errors unresolved.
- Preserve existing working behavior unless a milestone explicitly changes it.

## Architecture Principles

- Build reusable components whenever practical.
- Keep components focused on a single responsibility.
- Prefer composition over duplication.
- Separate presentation from business logic whenever reasonable.
- Keep routing inside the app directory.
- Keep shared UI inside the components directory.
- Introduce new folders only when there is a clear need.
- Keep files small enough to understand without excessive scrolling.
- Favor readability over cleverness.
- Optimize for long-term maintainability instead of short-term speed.

## Definition of Done

A milestone is considered complete only when:

- The application builds successfully.
- TypeScript validation passes.
- The application runs locally.
- Existing functionality still works.
- The milestone is documented in PROJECT_PLAN.md.
- The code is reviewed before commit.
- The Git diff is understood.
- The milestone is committed with a descriptive commit message.

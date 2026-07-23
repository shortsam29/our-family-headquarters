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
- [ ] Milestone 3: Dashboard page
- [ ] Milestone 4: Planning section
- [ ] Milestone 5: Household section
- [ ] Milestone 6: Family section
- [ ] Milestone 7: Finance section
- [ ] Milestone 8: Documents section
- [ ] Milestone 9: Settings and user preferences
- [ ] Milestone 10: Authentication and Supabase integration
- [ ] Milestone 11: Testing, accessibility, and deployment

## Current Status

Milestones 1 and 2 are complete. The current application includes:

- A reusable Header component
- A reusable Sidebar component with primary navigation
- A responsive application shell with the Header at the top, Sidebar on the left, and main content area
- A small-screen layout that stacks the Sidebar above the main content
- Successful TypeScript validation
- Successful production build
- A working development server at http://localhost:3000

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

# Brand Bible

This document is the single source of truth for branding, design, user experience, visual identity, illustrations, copywriting, and personality throughout Our Family Headquarters.

## Table of Contents

- [Brand Vision](#brand-vision)
- [Brand Personality](#brand-personality)
- [Core Values](#core-values)
- [Emotional Design Principles](#emotional-design-principles)
- [Visual Identity](#visual-identity)
- [Design Language](#design-language)
- [Component Standards](#component-standards)
- [Illustration System](#illustration-system)
- [Iconography](#iconography)
- [Photography](#photography)
- [Motion & Animation](#motion--animation)
- [Accessibility](#accessibility)
- [Kenzie](#kenzie)
- [Copywriting & Tone](#copywriting--tone)
- [Seasonal Themes](#seasonal-themes)
- [Future Expansion](#future-expansion)
- [Revision History](#revision-history)

## Brand Vision

Our Family Headquarters exists to bring every part of family life together into one calm, welcoming, and thoughtfully designed home.

This application is not intended to feel like business software, a productivity tool, or a traditional dashboard. Instead, it should feel like walking into a beautifully organized home where everything has its place and every family member feels supported.

The goal is to reduce stress by making everyday life easier to manage while creating a warm and enjoyable experience that families genuinely look forward to using.

Every screen, interaction, and feature should reinforce the feeling that this is the family's shared homeâ€”not simply another app.

Our Family Headquarters should become the trusted place where schedules, meals, memories, finances, documents, routines, celebrations, and everyday moments come together naturally.

The application should feel:

- Warm without feeling cluttered
- Beautiful without sacrificing usability
- Organized without becoming overwhelming
- Modern without feeling cold
- Personal without feeling childish
- Calm without feeling empty

The experience should create confidence, reduce mental load, and help every member of the household feel prepared, connected, and cared for.

Success is measured not only by how much the application can do, but by how it makes families feel each time they open it.

## Brand Personality

_Placeholder: Define the overall feeling, emotional goals, and identity._

## Core Values

_Placeholder: Define the values that guide every design and development decision._

## Emotional Design Principles

_Placeholder: Define how every screen should make users feel._

## Visual Identity

The visual identity uses a warm, muted foundation intended to feel calm, welcoming, and thoughtfully organized.

### Color Palette

| Role | Color |
| --- | --- |
| Warm canvas | `#F7F2EA` |
| Soft white | `#FFFDFC` |
| Light sage surface | `#E4E9DF` |
| Sage | `#8E9B84` |
| Deep olive | `#626B58` |
| Dusty rose | `#C8A6A0` |
| Pale blush | `#EAD9D5` |
| Warm taupe | `#B8AA9A` |
| Muted blue-gray | `#AEBCC2` |
| Charcoal | `#3F433D` |
| Soft charcoal | `#666A63` |
| Light border | `#DDD6CB` |

Semantic CSS tokens map this palette to page backgrounds, elevated and contrasting surfaces, text levels, borders, focus states, actions, accents, and status colors. Bright, neon, or uncoordinated colors are not part of the implemented foundation.

### Typography

- Manrope is the primary interface typeface for body copy, navigation, labels, forms, and controls.
- Cormorant Garamond is reserved for brand titles, display headings, and welcoming page headings.
- The implemented type scale includes brand title, display, page, section, card, body, supporting, label, and caption roles.
- Decorative serif text is not used for dense content, navigation, forms, or small labels.
- Patrick Hand is the approved handwritten accent for Kenzie notes, family notes, and occasional welcoming moments. It is printed rather than cursive, remains easy for children to read, and is never used for navigation, forms, or ordinary interface copy.
- Allura is the decorative calligraphy typeface for rare, large-scale welcome and signature brand moments. Its flowing, handcrafted character is reserved for short phrases at generous display sizes. It must never be used for navigation, body copy, forms, instructions, dates, or dense content.

### Spacing, Shape, and Elevation

- Spacing uses a centralized scale from `4px` through `64px`.
- Border radii use `10px`, `16px`, `22px`, `30px`, and a `999px` pill treatment.
- Shadows use warm, low-opacity tones and are limited to soft and raised levels.
- Elevated surfaces use soft white; contrasting surfaces use muted sage, blush, and warm neutral treatments.
- Page backgrounds use warm canvas with restrained, palette-coordinated decorative gradients where appropriate.
- Today’s Headquarters may layer very low-contrast sage, blush, and soft-white washes over the warm canvas to create depth while keeping the page quiet.
- Supporting preview cards use narrow muted sage, blush, taupe, or blue-gray edge accents rather than bright status colors.

## Design Language

The implemented design language favors rounded composition, generous spacing, clear hierarchy, soft borders, and subtle elevation. Interfaces should feel organized without becoming rigid or corporate.

- Use semantic design tokens rather than isolated color, spacing, or sizing values.
- Prefer soft, rounded containers and pill-shaped compact controls over sharp boxes.
- Use elevation sparingly to clarify hierarchy rather than decorate every surface.
- Keep layouts responsive through flexible composition and readable content widths.
- Use muted accents purposefully and keep the warm canvas visible throughout the experience.
- Reserve playful details for restrained, coordinated shapes and future approved illustrations.

### Today’s Headquarters Composition

Today’s Headquarters is the emotional center of the application and follows a centered composition philosophy. Centering refers to balanced visual weight and a clear central focal point, not universal center-aligned text. The permanent hierarchy begins with a welcoming Today heading, followed by the day’s primary information, a quiet Kenzie note, and compact supporting previews. Generous whitespace and a constrained content width keep the screen calm and prevent it from becoming a dense dashboard.

Visual weight should remain balanced across the primary cards. Supporting information may span the card grid when that avoids an unfinished or strongly left-weighted composition. Warm canvas should remain visible between every surface.

The welcome area is treated like a sign at the front entrance of a home. It presents the TODAY label, a centered long-form date in the brand serif, a rare Allura welcome phrase, a brief reassuring sentence, and a restrained botanical divider. The decorative treatment must remain readable, centered, and spacious.

The application header is a compact, full-viewport brand anchor. The product title uses Cormorant Garamond and is optically centered across the complete viewport, independent of the right-aligned user controls. A restrained botanical mark may accompany the title, but the header must remain quieter than the welcome hero. On desktop, primary navigation does not compete with the brand inside the header.

Desktop navigation occupies a permanent warm left sidebar with vertically stacked, comfortably sized destinations and a subtle separating edge. The selected Today’s Headquarters treatment is larger than the destination links, includes a short welcoming subtitle, and acts as the quiet front door of the home. Its top edge aligns with the beginning of the welcome composition so the current room and the emotional entrance read as one composition. Coordinated line icons reinforce recognition without becoming decorative clutter. The lower sidebar may carry a restrained residential vignette and family sentiment. At tablet and mobile widths, these decorative details and the active-room subtitle are removed and navigation becomes a compact horizontal, scroll-safe region above the main canvas so every destination remains visible and touch-friendly without introducing an unfinished menu.

The welcome hero stands on the open canvas without an enclosing card. Generous vertical space separates its TODAY label, date, entrance-style Allura greeting, supporting sentence, and botanical divider from the daily information region. Daily cards begin only after the complete welcome composition, preserving a clear transition from emotional welcome to practical information.

Card hierarchy is intentional rather than uniform:

- Primary: welcome, Today’s Schedule, Today’s To-Do List, and Kenzie’s note
- Secondary: Weather and Dinner Tonight
- Supporting: Shopping List, Grocery List, Family Inbox, and Coming Up

Primary cards receive more space and stronger hierarchy. Secondary cards remain useful but visually quieter. Supporting cards are compact previews with restrained palette accents.

The desktop daily-life composition follows the approved home-planner rhythm: Weather, Today’s Schedule, and Dinner Tonight share the first practical row; the prominent checklist anchors the next region beside Kenzie’s stationery note; Shopping List, Grocery List, Family Inbox, and Coming Up form a distinct full-width supporting row. At narrower widths, these regions stack in semantic reading order without changing their importance.

Today’s Headquarters uses four visually distinct vertical regions: the quiet application header; the current-room entrance formed by the sidebar and welcome hero; the primary daily dashboard; and supporting household information. Spacing and subtle dividers establish these regions without adding unnecessary headings or enclosing the welcome in a card.

## Component Standards

Shared components live in `components/design-system` and use typed, maintainable APIs with CSS Modules.

- Buttons provide primary, secondary, soft, ghost, and destructive variants. They include comfortable touch targets plus focus, hover, active, and disabled states.
- Icon buttons require an accessible label and use the same interaction states as text buttons.
- Cards provide default, soft sage, soft blush, warm neutral, and Kenzie note surfaces.
- Inputs, textareas, and selects require semantic labels and support guidance, errors, disabled states, and visible focus treatment.
- Badges provide neutral, accent, and status variants. Family-member badges pair initials with a name and optional supporting detail.
- Page and section headers provide consistent hierarchy with optional descriptions and actions.
- Empty states provide a heading, explanation, optional artwork, and optional action.
- Kenzie notes are a visual shell with optional title, graphic, signature, and audience variant. Personality copy is intentionally not embedded in the component.
- Kenzie notes use a restrained stationery treatment: warm paper, faint blue-gray ruled lines, a dusty-rose margin, subtle paper tape, serif titles, Patrick Hand messages, and a handwritten signature. The effect should feel personal and integrated, never like an AI feature panel.
- Navigation uses rounded links, a soft selected state, and responsive wrapping on small screens.
- Primary navigation follows the approved household rhythm: Today’s Headquarters, Schedule, Family Hub, My Day, and More.
- All primary rooms share one warm application shell. Navigation uses real routes, announces the current page programmatically, and keeps More selected while a secondary household room is open.
- Feature rooms use a consistent emotional sequence: a clear identity and calm orientation, primary content, supporting context, and only meaningful actions. Reusable summary cards and responsive grids keep those rooms related without making every screen identical.
- Schedule, Family Hub, My Day, and secondary household rooms use the same calm populated, empty, loading, and error language established for Today’s Headquarters. Loading respects reduced motion, and errors never imply that the household itself is broken.
- My Day may feel personal and encouraging while remaining visually part of the shared home. Family Hub remains relational rather than administrative, and permission-sensitive areas reveal only safe summaries.
- Today’s Headquarters receives a distinct sage selected treatment to communicate that it is the familiar starting place for the household without making it visually loud.
- Today summary cards use a reusable heading pattern with an optional eyebrow and concise detail area. Each card presents one idea and avoids embedding business logic.
- Today’s To-Do List is a primary daily surface. On Today’s Headquarters it presents an encouraging checklist preview for chores, homework, personal tasks, and recurring routines while preserving the complete task experience for its owning screen.
- Today section components use a consistent populated, empty, loading, and error contract. Empty states confirm calm or completion; errors explain temporary unavailability without suggesting the whole household is broken; loading states remain quiet and honor reduced-motion preferences.
- Today’s To-Do completion controls use large targets, explicit completed or not-completed text, accessible pressed state, and progress language. Completion is never communicated by color alone.
- Household-shared previews and signed-in-member content remain visually coherent but data-distinct. Personal tasks and guidance must never imply that one member’s responsibilities belong to the entire household.
- Card surfaces may vary subtly in scale, radius, spacing, elevation, and muted palette treatment to communicate importance. They must remain cohesive and should not become identical dashboard widgets.

Search, dialogs, calendars, lists, tables, and notification patterns remain reserved for the milestones that implement them.

## Illustration System

Illustration assets are reserved in `public/illustrations`. The shared illustration frame supports general artwork, empty-state artwork, Kenzie note artwork, and optional corner decoration.

- All graphics must use the approved muted application palette.
- Do not use neon, highly saturated colors, random clip art, or inconsistent stock illustration styles.
- Prefer soft line art, gentle organic shapes, botanical details, home objects, stationery, books, food, family activities, and seasonal accents.
- Artwork should support the content instead of overwhelming it.
- Graphics must remain understandable and pleasant for children and adults.
- Informative graphics require concise, meaningful alternative text.
- Purely decorative artwork must be hidden from screen readers.
- Final illustrations require visual and accessibility review before use.
- Small CSS-rendered botanical dividers, leaves, and flourishes may be used as restrained home-décor accents. They must use approved muted colors, remain decorative, be hidden from assistive technology, and never compete with content.

## Iconography

The foundation does not introduce an icon library or external artwork. Icons supplied to shared controls must be simple, recognizable, palette-coordinated, and accompanied by an accessible text label when the icon is the only visible control content. Decorative icons must be hidden from screen readers.

## Photography

_Placeholder: Define future photography guidelines._

## Motion & Animation

_Placeholder: Define future motion and animation principles._

## Accessibility

The implemented foundation establishes the following baseline:

- Semantic HTML is required for headings, navigation, form controls, buttons, and content regions.
- Keyboard focus must remain clearly visible through the shared focus token and focus-visible treatments.
- Interactive controls use comfortable touch targets and distinct hover, active, focus, and disabled states.
- Form controls require programmatic labels and expose supporting or error text through accessible descriptions.
- Error states use text and semantics in addition to color.
- Informative illustrations require alternative text; decorative artwork is hidden from assistive technology.
- Primary and supporting text use accessible, readable sizes and line heights.
- Dynamic dates use semantic `time` markup and the user’s browser locale without exposing hydration inconsistencies.
- Interactive task controls announce the task name and the action they will perform, expose current state programmatically, and provide keyboard-visible focus.

## Kenzie

_Placeholder: Define Kenzie's personality, communication style, visual identity, interaction style, and design principles._

## Copywriting & Tone

_Placeholder: Define application messaging, wording, greetings, reminders, notifications, and overall voice._

## Seasonal Themes

_Placeholder: Define future guidance for seasonal styling._

## Future Expansion

_Placeholder: Define guidelines that ensure future features remain consistent with the established brand._

## Revision History

| Version | Date | Description |
| --- | --- | --- |
| 0.1 | 2026-07-22 | Initial document structure created. |
| 0.4 | 2026-07-23 | Recorded the approved Today’s Headquarters mockup composition, sidebar identity, and responsive daily-life layout. |
| 0.5 | 2026-07-23 | Established the permanent four-region page blueprint and full-width supporting household row. |
| 0.6 | 2026-07-23 | Added permanent Today state, personalization-boundary, local-date, and accessible task-interaction standards. |
| 0.7 | 2026-07-23 | Recorded the shared routed shell, feature-room structure, route-aware navigation, and calm cross-application state standards. |

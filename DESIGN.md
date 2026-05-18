# Kanban Board Design

This document defines the product, UI, and interaction rules for the Kanban board application.

## Product Goals

- Fast to understand for first-time users.
- Simple to operate in daily use.
- Visually polished and consistent.
- Safe for production from the first release.
- Built for iterative improvement from user feedback.

## Core Principles

- Clarity over density.
- Visible hierarchy for urgent work.
- Minimal friction for common actions.
- Roles and permissions must be obvious.
- Every screen should make the next action easy to find.

## Visual Direction

- Clean enterprise product, not a toy dashboard.
- Strong typography hierarchy.
- Generous spacing.
- Calm base surface with selective accent color.
- Express Lane and urgent cards must stand out without overwhelming the board.
- Light and dark themes must both feel deliberate, not inverted copies.

## Layout Rules

- Use a stable app shell with:
  - top bar for workspace context and user controls,
  - left navigation for boards and settings when appropriate,
  - main board surface as the primary focus.
- Keep board content centered and readable on wide screens.
- Preserve enough horizontal room for multiple columns.
- On smaller screens, degrade gracefully with horizontal board scrolling and compact controls.

## Primary Screens

### Splash Screen

- Present the product value clearly.
- Include login options.
- Include sign up entry points where allowed.
- Keep the first interaction obvious.

### Authentication

- Support local, LDAP, and OIDC sign in modes.
- Admins configure auth mode at runtime.
- Sign in requests may require approval before activation.

### Board View

- This is the main working screen.
- Show board name, owner, and access state.
- Render columns horizontally.
- Render cards with strong visual separation.
- Express Lane appears above the columns as a dedicated high-priority lane.

### Card Detail

- Show title, type, deadline, assignee, rich text details, comments, and timestamps.
- Keep editing focused and fast.
- Preserve thread context while editing.

### Admin Area

- Manage users, boards, types, auth settings, and approval requests.
- Make destructive actions explicit.
- Provide clear enabled/disabled states.

### User Settings

- Theme: Light or Dark.
- Language: English or Spanish (Argentinian Spanish).
- Settings are per-user and must not affect other users.

## Board Rules

- Multiple boards per instance.
- A board has one owner.
- Users can be granted access to one or more boards.
- Board owners manage access to the boards they own.
- Admins can manage access to any board.
- Members can create and move cards on boards they can access.
- Read-only users can view board content but cannot modify it.

## Card Rules

- Card fields:
  - title,
  - rich text details,
  - deadline,
  - assignee,
  - comment thread,
  - card type.
- Card types include Bug, Feature, Improvement, Idea, and Urgent.
- Admins can add more types.
- Urgent cards can be promoted into Express Lane.
- Comments keep timestamp and author.

## Interaction Rules

- Drag and drop is used to move cards between columns.
- Express Lane cards must have stronger visual priority.
- Actions that change data must be clearly labeled.
- Empty states should guide the next step, not just state that nothing exists.
- Loading and error states must be explicit and calm.

## Accessibility Rules

- Keyboard support for core actions where practical.
- Sufficient color contrast in both themes.
- Clear focus states.
- Avoid meaning based only on color.
- Use readable font sizes and touch targets.

## Localization Rules

- English is the default language.
- Spanish uses Argentinian Spanish wording.
- User language preferences are stored per-user.
- UI text should come from a localization layer, not hardcoded into components.

## Security Rules

- Use current supported dependencies.
- No high severity known vulnerabilities in production dependencies.
- Auth and authorization checks must live on the server.
- Sensitive admin actions must be auditable.
- Deployment must run with predictable container behavior.

## Feedback Loop

Every meaningful release should collect feedback in the same format:

- What task did the user try to complete?
- What slowed them down?
- What was confusing?
- What did they expect instead?
- What should change next?

Feedback should be categorized as:

- usability,
- visual polish,
- missing feature,
- bug,
- permission issue,
- performance issue.

## Release Standard

Before calling a milestone done:

- The app builds cleanly.
- Tests pass.
- Security checks pass.
- Docker works locally.
- The feature is understandable without extra explanation.


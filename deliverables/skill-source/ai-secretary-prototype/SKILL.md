---
name: ai-secretary-prototype
description: Maintain, verify, package, document, or hand off the AI Secretary free static prototype. Use when working on this specific browser/PWA schedule assistant, preparing delivery artifacts, validating GitHub Pages deployment, explaining local-only storage, or deciding whether a requested change belongs to the free prototype or a later formal product phase.
---

# AI Secretary Prototype

Use this skill for the AI Secretary project in the local workspace.

## Core Rules

- Treat AI Secretary as a free static prototype unless the user explicitly asks to start the formal product phase.
- Preserve the local-only design: no account, no database, no cloud sync, no real AI API.
- Keep reminders honest: page-open reminders are supported; fully closed browser background reminders are not guaranteed.
- Keep user data local: schedules, delivered reminders, and activity logs live in browser localStorage.
- Keep operation logs retained for 7 days and manually clearable.
- Before publishing, run pnpm test, pnpm typecheck, and pnpm build.

## Common Tasks

### Maintain the app

1. Inspect the current app files before editing.
2. Keep changes scoped to the requested user-facing behavior.
3. Use existing React and TypeScript patterns in app/page.tsx, app/*.tsx, and app/*.ts.
4. Add or update tests when changing parsing, reminders, storage, or log retention behavior.
5. Avoid adding services that require login, databases, or paid APIs unless the user explicitly starts the next product phase.

### Package delivery artifacts

Create delivery artifacts under deliverables/:

- Skill source and ZIP package.
- Standalone HTML guide or landing page.
- Markdown documentation.
- Windows exe launcher and ZIP package.
- Promotional page.
- Handoff document.

### Verify the public deployment

Check these URLs after pushing:

- https://futhea136-ux.github.io/AI-/
- https://futhea136-ux.github.io/AI-/manifest.webmanifest
- https://futhea136-ux.github.io/AI-/sw.js
- https://futhea136-ux.github.io/AI-/icon-192.png
- https://futhea136-ux.github.io/AI-/icon-512.png

## Reference

Read references/prototype-spec.md when you need the exact feature list, acceptance checklist, storage policy, or handoff boundaries.

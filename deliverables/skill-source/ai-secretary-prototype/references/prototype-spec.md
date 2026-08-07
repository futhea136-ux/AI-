# AI 小秘 Prototype Reference

## Project

- Workspace: `D:\Users\华为\Documents\drink water\ai-secretary`
- Public URL: `https://futhea136-ux.github.io/AI-/`
- Repository: `https://github.com/futhea136-ux/AI-.git`
- Framework: Next.js, React, TypeScript
- Deployment: GitHub Pages static export

## Free Prototype Boundary

This version is local-only and static:

- No login
- No database
- No cloud sync
- No real AI API
- No reliable fully closed-browser background reminders

Formal product phase candidates:

- Account login
- Multi-device sync
- Backend database
- Real AI semantic model
- Reliable mobile background reminders
- Google Calendar or Outlook Calendar sync

## Implemented Features

- Voice and text input.
- Calendar month, week, and list views.
- Create, query, update, delete, and complete schedules.
- Tentative and completed states.
- Repeating schedules.
- Page reminders and optional browser notifications.
- JSON backup and restore.
- ICS export.
- Local search.
- PWA install guidance.
- Offline/local storage status.
- Activity logs with 7-day retention and manual clearing.
- In-app guide and acceptance checklist.

## Validation

Run before delivery:

```powershell
$env:Path='C:\Users\华为\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
& 'C:\Users\华为\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' test
& 'C:\Users\华为\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' typecheck
& 'C:\Users\华为\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' build
```

Expected test count at the time of this reference: 15 passing tests.

## Acceptance Checklist

1. Open the public page and confirm the current month is shown.
2. Add a schedule by voice or text.
3. Confirm the parsed card before writing to the calendar.
4. Search by keyword and jump to the correct date.
5. Modify and delete a schedule.
6. Mark an item complete and verify it remains visible.
7. Open reminder center and verify reminder status.
8. Open local status and view activity logs.
9. Clear logs and verify schedules remain.
10. Export and restore JSON backup.
11. Confirm install guidance and PWA files are available.

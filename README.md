# KanbanBoard

Production-minded Kanban board built with Next.js and SQLite for a single-container deployment model.

## Current Baseline

- Splash, setup, login, and sign-up request flow
- SQLite-backed runtime settings, users, boards, columns, cards, comments, and sessions
- Admin approval flow for pending users
- Multiple-board model with owner and membership records
- Express lane for urgent cards
- Per-user theme and language preference storage
- Dockerfile, local `docker-compose.yml`, and GitHub Actions CI

## Local Run

Use the Node-distributed npm binary on this machine:

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Open `http://localhost:3000`.

On first run, visit `/setup` to create the initial admin account.

## Verification

```powershell
& "C:\Program Files\nodejs\npm.cmd" run lint
& "C:\Program Files\nodejs\npm.cmd" run typecheck
& "C:\Program Files\nodejs\npm.cmd" run test
& "C:\Program Files\nodejs\npm.cmd" run build
```

## Docker

```powershell
docker compose up --build
```

SQLite data is stored in the mounted `/app/data` volume.

## Important Scope Note

This first baseline stores the selected auth mode at runtime and ships working local email/password authentication. LDAP and OIDC mode selection are present in the data model and admin UI, but the actual provider handshake and directory/token validation still need a follow-up implementation pass.

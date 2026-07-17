# datarango-frontend

Turborepo + pnpm monorepo for all Datarango frontend apps. Companion to `FRONTEND-HANDOFF.md`.

## Apps

| App | Port (dev) | Domain | Persona |
|---|---|---|---|
| `web` | 3000 | datarango.com / app.datarango.com | visitors + learners (marketing lives in `(marketing)` route group) |
| `console` | 3001 | console.datarango.com | org owners/admins/managers/instructors |
| `studio` | 3002 | studio.datarango.com | creators/instructors (content authors) |
| `admin` | 3003 | admin.datarango.com | platform staff (IP-restricted) |

## Packages

- `@datarango/ui` — design tokens + shared components + motion primitives
- `@datarango/api` — typed gateway client + `useApi` (TanStack Query); the only code allowed to call the gateway
- `@datarango/auth` — OIDC PKCE client, session, org-context store, route guards
- `@datarango/realtime` — WebSocket clients + hooks (notifications; kernel channel lives in `notebook`)
- `@datarango/notebook` — Jupyter notebook client (CodeMirror 6 + kernel protocol)
- `@datarango/config` — shared tsconfig presets

Rules: apps import packages; packages never import apps; packages never import each other except `ui` and `config`.

## Commands

```sh
pnpm install
pnpm dev          # all apps via turbo
pnpm --filter web dev
pnpm build
pnpm typecheck
```

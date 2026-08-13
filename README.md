# datarango-frontend

Turborepo + pnpm monorepo for all Datarango frontend apps. Companion to `FRONTEND-HANDOFF.md`.

## Apps

| App       | Port (dev) | Domain                            | Persona                                                            |
| --------- | ---------- | --------------------------------- | ------------------------------------------------------------------ |
| `web`     | 3000       | datarango.com / app.datarango.com | visitors + learners (marketing lives in `(marketing)` route group) |
| `console` | 3001       | console.datarango.com             | org owners/admins/managers/instructors                             |
| `studio`  | 3002       | studio.datarango.com              | creators/instructors (content authors)                             |
| `admin`   | 3003       | admin.datarango.com               | platform staff (IP-restricted)                                     |

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

## In Docker

`make up` (repo root) builds the standalone production bundle — correct for
checking what deploys, but a source edit only reaches the browser via a rebuild.
For UI work use the dev override instead, which runs `next dev` over
bind-mounted source:

```sh
make dev             # whole stack, hot-reloading frontends
make dev-frontends   # just the four apps (infra + gateway already up)
make dev-logs
```

Only `src/` (and web's `public/`) is mounted — never `node_modules`, since the
host's is Windows-resolved and shadowing the image's linux install breaks the
server. So one class of edit still rebuilds: dependencies, `next.config.ts`, and
the postcss/tailwind configs. Re-run `make dev-frontends` after those.

HMR polls rather than watching (`NEXT_WATCH_POLL_MS`, read by `next.config.ts`)
because inotify events do not cross the Windows→Linux bind mount. That is also
why the dev stage runs `next dev --webpack`: Turbopack accepts the same
`watchOptions.pollIntervalMs` and, on 16.2.10, never acts on it.

### Known limitation on Windows hosts

This works, but not durably on a Windows-hosted checkout. Under a bundler's
sustained recursive `stat` load, Docker Desktop's Windows↔Linux file share
starts returning `EIO: i/o error` on `scandir`/`lstat` for the bind-mounted
paths, and the dev servers die on the unhandled rejection. Observed after a
period of working normally; it survived a Docker Desktop restart and a full
`wsl --shutdown`. The host filesystem is fine (a full recursive read from
Windows returns every file with no errors), and a single `ls` of the failing
directory succeeds — it is the concurrent load the share cannot take.

There is no fix for it inside this repo. The two ways around it are to run the
frontends on the host (`pnpm --filter web dev`) against the Dockerized
backends — `.env.local` already points at the gateway on `localhost:8080` — or
to move the checkout onto the WSL2 filesystem, where the mount is native ext4
and inotify works, so no polling is needed at all.

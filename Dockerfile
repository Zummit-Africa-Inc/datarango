# syntax=docker/dockerfile:1

# One Dockerfile for all four Next apps. They differ only in name and port, so
# an APP build arg beats four near-identical files that quietly drift apart.
#
# Debian rather than Alpine on purpose: next/image pulls in sharp (an optional
# dependency of next itself), and sharp's musl builds are a separate set of
# prebuilt binaries. glibc keeps the image boring at the cost of some size,
# which is the right trade for a dev stack.
ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Pinned to the repo's packageManager field. Installed directly rather than via
# corepack so the build never depends on corepack's signature checks.
RUN npm install -g pnpm@10.18.1
WORKDIR /repo

# ── dependencies ─────────────────────────────────────────────────────────────
# `pnpm fetch` populates the store from the lockfile alone, so this layer is
# invalidated only when the lockfile changes — not on every source edit. That
# matters here because four images build from this same context.
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN pnpm fetch

# ── workspace ────────────────────────────────────────────────────────────────
# The full install, shared by `builder` and `dev`. No ARG is referenced here on
# purpose: the layer is then identical for all four apps, so the install runs
# once for the whole compose build instead of once per image.
FROM deps AS workspace
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline

# ── dev ──────────────────────────────────────────────────────────────────────
# `next dev` for docker-compose.dev.yml. The image carries the complete linux
# install; the override bind-mounts only src/ and public/ over it, never
# node_modules — the host's is Windows-resolved (sharp, the swc native module)
# and shadowing the linux one breaks the server on first request.
#
# Consequence worth stating: dependency changes, next.config.ts, and the
# postcss/tailwind configs live outside those mounts, so changing one needs a
# rebuild. Anything under src/ does not.
FROM workspace AS dev
ARG APP
ARG PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=${PORT}
# Same reason as APP_ENTRYPOINT below: CMD cannot expand a build arg.
ENV APP_NAME=${APP}
EXPOSE ${PORT}

# `--webpack`, and so *not* the app's own `dev` script, which is Turbopack.
#
# Neither bundler gets file events in a container here: inotify does not cross
# the Windows bind mount, and does not survive overlayfs either — a container's
# own writes go unnoticed too, which is how this was pinned down. Both therefore
# have to poll. Only webpack's poller actually engages: Turbopack takes the same
# `watchOptions.pollIntervalMs` from next.config.ts and, on 16.2.10, still never
# sees the change. Measured, not assumed — with Turbopack an edit was still
# invisible after four minutes; under webpack it lands in seconds.
#
# The cost is webpack's slower cold compile, paid once per route. Nothing else
# uses this stage: the production build and `pnpm dev` on the host, where events
# work natively, are both still Turbopack.
CMD ["sh", "-c", "cd \"apps/$APP_NAME\" && exec ./node_modules/.bin/next dev --webpack -p \"$PORT\""]

# ── build ────────────────────────────────────────────────────────────────────
FROM workspace AS builder
ARG APP

# NEXT_PUBLIC_* are inlined into the client bundle at build time, so they are
# build args rather than runtime env — changing one needs a rebuild, not a
# restart. These are the origins the *browser* resolves, which is why they stay
# on localhost even though the server-side ones point into the compose network.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Switches on `output: "standalone"`, which the app configs leave off by
# default. It stays off elsewhere because `next start` — what the Playwright
# boot smoke runs — reports that it does not work with standalone output.
ENV BUILD_STANDALONE=1

RUN pnpm exec turbo run build --filter=${APP}

# Only `web` ships a public/ today. Creating it unconditionally keeps the COPY
# in the runner valid for the three apps that don't, rather than needing a
# per-app Dockerfile for a directory that may appear later anyway.
RUN mkdir -p apps/${APP}/public

# ── runtime ──────────────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner
ARG APP
ARG PORT=3000
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# server.js reads both. Without HOSTNAME it binds localhost inside the
# container and the published port answers nothing.
ENV HOSTNAME=0.0.0.0
ENV PORT=${PORT}
# Baked in because CMD cannot expand a build arg at container start.
ENV APP_ENTRYPOINT=apps/${APP}/server.js

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# The standalone bundle is rooted at the *workspace* root, so it unpacks to
# /app already carrying apps/<APP>/server.js and a pruned node_modules with the
# workspace packages traced in. Static assets and public/ are not traced and
# have to come across separately.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP}/public ./apps/${APP}/public

USER nextjs
EXPOSE ${PORT}
CMD ["sh", "-c", "exec node \"$APP_ENTRYPOINT\""]

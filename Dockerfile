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

# ── build ────────────────────────────────────────────────────────────────────
FROM deps AS builder
ARG APP
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline

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

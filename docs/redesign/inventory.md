# Redesign inventory

Source of truth for the redesign is `DESIGN-HANDOFF.md` (workspace root). This file maps what exists today to the surfaces in §7 and records progress per phase.

## Apps

| App            | Port | Audience                                             | Shell                                            |
| -------------- | ---- | ---------------------------------------------------- | ------------------------------------------------ |
| `apps/web`     | 4000 | Marketing site + learner app (`/dashboard/*`) + auth | Marketing nav/footer; learner sidebar + `Header` |
| `apps/studio`  | 4002 | Creators                                             | Sidebar + `Header`                               |
| `apps/console` | 4001 | Org admins (B2B)                                     | Sidebar + `Header`                               |
| `apps/admin`   | 4003 | Platform admins                                      | Sidebar + `Header`                               |

## Shared packages

| Package             | Role in the redesign                                                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/ui`       | **Single home for tokens** (`src/styles/tokens.css`), fonts (`src/fonts.ts`), theme (`ThemeProvider`, `ThemeToggle`, `ThemeSelect`), accents (`src/config/accents.ts`), shape kit (`shapes.tsx`) and every primitive (`components/ui`, `components/shared`). Radix (`radix-ui`), next-themes, Recharts, dnd-kit, TanStack Table already present. |
| `packages/notebook` | Notebook editor, cells, outputs, `CodeEditor` (CodeMirror). §5 Code / Notebook cell.                                                                                                                                                                                                                                                             |
| `packages/auth`     | Session + OIDC flow; the per-user-type sign-in pages build on it.                                                                                                                                                                                                                                                                                |
| `packages/api`      | Gateway client (TanStack Query).                                                                                                                                                                                                                                                                                                                 |
| `packages/realtime` | Live updates.                                                                                                                                                                                                                                                                                                                                    |
| `packages/config`   | Shared TS/ESLint config.                                                                                                                                                                                                                                                                                                                         |

Tailwind is **v4** in every app (`@theme` in `tokens.css`, `@source` per app `globals.css`). No upgrade needed.

No Storybook exists; §3's "both themes side by side" preview is the web route `/design-system` (noindex). Any element with `.light` or `.dark` scopes a theme to its subtree; next-themes puts `theme-light` (not `light`) on `<html>` so this works.

## Routes → surfaces (§7)

### web — marketing (§7.1)

| Route                                                | Surface                                        |
| ---------------------------------------------------- | ---------------------------------------------- |
| `/`                                                  | 7.1 Marketing home                             |
| `/courses`, `/quizzes`, `/datasets`, `/competitions` | 7.1 Category explorer / 7.3 catalogue (public) |
| `/pricing`                                           | 7.1 Pricing                                    |
| `/for-teams`, `/for-creators`                        | 7.1 Audience landing                           |
| `/about`, `/blog`, `/careers`, `/contact`            | 7.1 Content pages                              |
| `/privacy-policy`, `/terms-of-use`                   | 7.1 Legal                                      |
| `/verify/[serial]`                                   | 7.7 Certificates (public verification)         |

### web — auth (§7.7 Auth & onboarding)

| Route                                                                     | Surface                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `/signin`                                                                 | Auth split screen — **learner** sign-in (per-user-type pages: see below) |
| `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/mfa` | Auth split screen                                                        |

### web — learner app (`/dashboard`)

| Route                                                     | Surface                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| `/dashboard`                                              | 7.2 Learner dashboard                                         |
| `/dashboard/courses`                                      | 7.3 My courses (tabs All · In progress · Saved · Completed)   |
| `/dashboard/courses/[id]`                                 | 7.5 Course detail (not enrolled) / 7.4 course view (enrolled) |
| `/dashboard/courses/[id]/lessons/[lessonId]`              | 7.4 Course view (player + curriculum rail)                    |
| `/dashboard/courses/[id]/modules/[moduleId]/exercise`     | 7.4 Module-end exercise                                       |
| `/dashboard/quizzes`, `/dashboard/quizzes/[id]`           | 7.7 Quizzes (list + taking UI)                                |
| `/dashboard/notebooks`, `/dashboard/notebooks/[id]`       | 7.7 Notebooks (list + workspace)                              |
| `/dashboard/competitions`, `/dashboard/competitions/[id]` | 7.7 Competitions                                              |
| `/dashboard/datasets`, `/dashboard/datasets/[id]`         | 7.7 Datasets (list, §8)                                       |
| `/dashboard/wallet`                                       | 7.7 Tokens/economy                                            |
| `/dashboard/certificates`                                 | 7.7 Certificates                                              |
| `/dashboard/achievements`, `/dashboard/achievements/[id]` | 7.7 Badges                                                    |
| `/dashboard/search`                                       | §5 Command palette / search results                           |
| `/dashboard/settings`                                     | 7.7 Settings (Appearance added in Phase 1)                    |

### studio (creator)

| Route                              | Surface                                   |
| ---------------------------------- | ----------------------------------------- |
| `/` → `/courses`                   | Creator overview (§9 "Overview")          |
| `/courses`                         | §8 Creator: my content                    |
| `/courses/[courseId]`              | 7.6 Course builder (full-screen, stepped) |
| `/quizzes`, `/quizzes/[quizId]`    | 7.7 Quiz list + builder                   |
| `/media`                           | §9 Media library                          |
| `/grading`, `/grading/[attemptId]` | Grading queue (DataTable)                 |
| `/review`                          | Content review                            |

### console (org admin, B2B)

| Route                              | Surface                        |
| ---------------------------------- | ------------------------------ |
| `/` → `/overview`                  | 7.7 Org admin dashboard        |
| `/members`, `/roles`               | People ▸ Members / roles       |
| `/assignments`                     | Learning ▸ Assignments         |
| `/progress`                        | Reports ▸ Progress             |
| `/competitions`                    | Org competitions               |
| `/grading`, `/grading/[attemptId]` | Grading queue                  |
| `/billing`                         | Billing ▸ Seats · Invoices     |
| `/ai`                              | Settings ▸ AI providers (BYOK) |
| `/settings`                        | Settings ▸ Organisation · SSO  |

### admin (platform)

| Route                                | Surface                        |
| ------------------------------------ | ------------------------------ |
| `/` → `/overview`                    | Platform overview              |
| `/users`                             | Users                          |
| `/organizations`                     | Organisations                  |
| `/review`                            | Content ▸ Moderation queue     |
| `/rewards`                           | Economy ▸ Tokens · Redemptions |
| `/billing`                           | Payments                       |
| `/notifications`, `/audit`, `/flags` | System                         |

### Per-user-type sign-in (requested 2026-11-20)

Built in Phase 6 on the §7.7 split-screen auth layout: learner (web `/signin`: sign-up, social), creator (studio `/signin`), org (console `/signin`: SSO / email-domain first), admin (admin `/signin`: staff only, no sign-up or social, MFA). Needs accounts to pick the login URL from `client_id` (`IdentityModule.cs`, `OrgSsoLogin.cs`). Plan in `CHECKLIST.md`.

## Shared components today (`packages/ui`)

`components/ui`: accordion, avatar, badge, button, button-group, card, chart, checkbox, combobox, command, dialog, dropdown-menu, hover-card, input, input-group, label, popover, radio-group, select, separator, sheet, sonner, switch, table, textarea, toggle, toggle-group.

`components/shared`: async-select, bread-crumb, calendar, company-switcher, context-switcher, data-table, date-picker, header, illustration (**remove in Phase 7**), kanban, loader, logo, markdown, multi-select, otp-input, page-layout, pagination, phone-input, scroll-area, sidebar, skeleton, sso-login, statistics, stepper, tab-list, tab-panel, text-editor, tree, widget, **shapes** (new), **theme** (new).

Illustrations in use: `packages/ui/src/assets/illustrations`, used by `apps/web/src/components/marketing/{sections,for-teams,for-creators}.tsx`.

## Token migration (Phase 1)

New semantic tokens per §2.5 live in `tokens.css`. The v1.1 names are kept as **aliases** onto them so every screen reskins at once and works in dark mode; they are deleted in Phase 7.

| v1.1 utility                                             | Now resolves to                                                                                                                                  | Uses at Phase 1 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `text-ink`                                               | `--foreground`                                                                                                                                   | ~240            |
| `bg-ink`, `bg-ink-elevated`, `text-on-ink*`              | **renamed** to `bg-band`, `bg-band-elevated`, `text-on-band*` (dark band surfaces; `ink` also meant text colour, which cannot work in dark mode) | ~60             |
| `border-hairline`, `hairline-strong`                     | `--border`, `--border-strong`                                                                                                                    | ~260            |
| `bg-canvas`, `surface-strong`, `muted-soft`, `text-body` | `background-subtle`, `muted`, `foreground-subtle`, `foreground`                                                                                  | ~35             |
| `primary-50…950`                                         | ember steps (old 500 = new 700)                                                                                                                  | ~125            |
| `font-heading`, `mono-data`, `font-code`                 | Space Grotesk / Space Mono                                                                                                                       | ~160            |
| `rounded-xs`                                             | 8px (was 2px)                                                                                                                                    | ~335            |
| `success`, `warning`, `error`, `info` (+ `-soft`)        | emerald / amber / red / sky pairs                                                                                                                | ~390            |
| petrol `secondary-*` scale                               | **removed** (no component used it)                                                                                                               | 0               |

Still to purge in Phase 7: raw `gray/zinc/slate/neutral` (~70 uses in 16 files), raw accent steps (~60), `dark:` leftovers (~70), illustrations, the aliases above.

## Screenshots

`redesign-shots/` at the workspace root (not in git), captured by a Playwright script against the compose stack:

- `baseline/light/…`: 56 screens before any change.
- `phase-1/{light,dark}/…`: after Phase 1.
- `phase-2/design-system-page-{light,dark}.png`: the primitives preview.

## Phase log

- **Phase 1 (Foundation)** — inventory, tokens, fonts (Space Grotesk / Geist / Space Mono via `@datarango/ui/fonts`; Geist and Space Grotesk load as variable fonts — listing weights for them breaks parallel Turbopack builds), theming (next-themes, toggle in app header + marketing nav, Settings → Appearance), accent config, shape kit, logo dark variant.
- **Phase 2 (Primitives)**: Button (primary / secondary / ghost / soft / danger / link, sm–lg + icon, `shape="pill"`, `ButtonArrow`), Badge (`tone` × solid / soft / outline, v1.1 `variant` mapped), `Count`, Card (`interactive`), StatCard + `Delta` + `Sparkline`, ProgressRing / ProgressBar / SteppedProgress, `UserAvatar` / `AvatarStack` (initials on a hashed accent), Tabs (underline / pill), Tooltip, EmptyState, PropertyList, `BarChart` wrapper, solid status tokens; raw greys and old primary steps in `packages/ui` moved to tokens; token focus ring on inputs. Fixed on the way: Radix checked states (`data-checked:` never matched), skeleton blocks sliding with their shimmer. Still to restyle with their screens: Sidebar and switchers (Phase 3), DataTable (Phase 4), Cover / Price (Phase 5), notebook cell (Phase 6).
- **Phase 3 (Shell)**: `AppShell` in `@datarango/ui` replaces `Sidebar`, `Header`, `ContextSwitcher` and `CompanySwitcher` in all four apps. Sidebar 256px / 72px rail (remembered per browser), sheet on mobile, collapsible parents auto-open on an active child, rail flyouts, arrow-key navigation, quick search, primary action (studio: New course), `OrgSwitcher` + `UserCard` footer (theme, settings, sign out; learner org-view toggle). Top bar: sentence-case breadcrumbs labelled from the nav config, or a greeting on home pages; palette trigger; actions (learner: token balance, notifications); theme toggle; avatar menu on mobile. Command palette on Ctrl/⌘ K and `/`: nav destinations, free-text search (learner → `/dashboard/search`). Typed nav trees per role in `config/nav.ts` (`LEARNER_NAV`, `CREATOR_NAV`, `ORG_NAV`, `ADMIN_NAV`), console filtered by org permission via `filterNav`. Fixed: console layout called hooks after an early return (the "This page couldn't load" overview crash).
- **Phase 4 (Lists)**: `useListParams` (typed URL state: `listParam.string/number/oneOf/manyOf`; any change but `page` resets to page 1) and `ListToolbar` (debounced search, `/` focuses it ahead of the palette, filter popovers with removable chips and Clear all, sort select, grid/list toggle, actions slot, "Filters (n)" bottom sheet below `md`). `Pagination` restyled ("1–20 of 134 courses", previous/next, optional page size). Wired into studio courses (status) and web courses, quizzes, competitions, datasets (search + page).
  - **Gap, backend:** the §8 filter and sort matrix (category, level, price, rating, sort orders…) needs gateway and service query support. Today the list endpoints accept only `search`, `status`, `page` and `pageSize`, so the toolbar exposes only those. Filtering client-side on one page of results would mislead, so it isn't done.
- **Phase 5 (Catalogue media)**: `CatalogueThumbnail` (4:3) and `CatalogueCover` (3:1, optional overlapping icon tile) with generated fallbacks seeded by id (accent → category → hash; `DotGrid`, one corner shape, icon tile) that also replace broken image URLs. `Price` (free / included / paid, with compare-at and token lines) on `formatMoney` (Intl, minor units) and `parsePrices` / `pricingFromPrices`. `next/og` route `/og/course/{id}` (`?variant=cover` for 1800×600). Web catalogue cards and studio course rows use them. Contract gaps are listed in `contract-gaps.md`.

## Known issues found while capturing (not caused by the redesign)

- ~~console `/overview` shows "This page couldn't load"~~: hooks after an early return in the console layout; fixed in Phase 3.
- studio sidebar renders a second brand row ("datarango Studio") whose logo was invisible on the dark sidebar; visible in dark theme. Gone with the Phase 3 sidebar.
- Marketing sections below the fold reveal on scroll, so full-page captures can show them blank.

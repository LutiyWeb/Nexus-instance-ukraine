# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Nuxt dev server on http://localhost:3000 (kills port 3000 first)
npm run build    # Production SSR build
npm run preview  # Preview production build locally
```

## Backend

Project: `C:\Users\Юра\Desktop\vue-project\shopmarker-backend`
Stack: Fastify + Prisma + TypeScript

```bash
# Run from backend directory:
npm run dev      # Starts Fastify dev server (tsx watch src/server.ts)
```

Both servers must run in parallel. Start backend first, then frontend:

1. Terminal 1 (backend): `cd C:\Users\Юра\Desktop\vue-project\shopmarker-backend && npm run dev`
2. Terminal 2 (frontend): `npm run dev` (this repo)

No test suite.

## Repo relationship (template → mirrors)

This repo is a **mirror/instance** of the core template `NuxTemplate-Pro` — customized for a specific store (Ukraine). It has two remotes:

- `origin` (`LutiyWeb/Nexus-instance-ukraine`) — this mirror's own unique repo; store-specific work is pushed here.
- `upstream` (`LutiyWeb/NuxTemplate-Pro`) — the parent template; pull from here (`git fetch upstream` / merge `upstream/<branch>`) to bring in global updates shared across all mirrors.

If a change is generic enough to belong in every mirror (not specific to this store), it should ideally be made in the template repo (`NuxTemplate-Pro`) and pulled in via `upstream`, rather than only fixed here.

## Architecture

### API communication

- `api/*.ts` — typed `$fetch` wrappers per domain (products, cart, auth, etc.)
- `composables/useAuthFetch.ts` — wraps `$fetch` with `Authorization: Bearer <token>` from the auth store; use this for all protected endpoints
- API base URL: `runtimeConfig.public.apiBase`, set via `NUXT_PUBLIC_API_BASE` (defaults to `http://localhost:8000` if unset — but this repo's `.env` currently overrides it to the deployed Render backend, `https://shopmarker-backend.onrender.com`, so local dev talks to Render, not the local backend, unless you override it back)

### State (Pinia)

Stores in `stores/` are auto-imported. Auth state (`token` + `user`) is persisted in `localStorage`. A cart row is created server-side on registration; the cart store fetches it on mount.

### Styling

- SCSS with BEM; component styles use `<style lang="scss">` with the component root class as the BEM block
- Design tokens in `assets/styles/_variables.scss` (colors, typography, spacing, breakpoints, shadows)
- `respond-to($bp)` mixin in `_mixins.scss` — **min-width, mobile-first**: `mobile` (640px) / `tablet` (768px) / `notebook` (1024px) / `laptop` (1280px) / `desktop` (1536px)
- Utility classes: `py-13` (padding-block), `grid-col-2`, `grid-col-3` (responsive grids)
- Container: `max-width: 1440px`, `margin-inline: auto`, `padding-inline: 16px`
- Font: Helvetica / Helvetica Neue / Arial (project convention)
- Hardcoded component values are extracted to CSS custom properties and overridden via `var()` in context

### Components

`nuxt.config.ts` sets `pathPrefix: false` — components are registered by filename only, no directory prefix needed. Naming convention:

- `The*` — singleton layout pieces (TheHeader, TheFooter)
- `App*` — generic reusables (AppSlider, AppButton, AppModal, AppImage)
- Feature-prefixed — `Catalog*`, `Cart*`, `Cabinet*`, `Header*`, etc.

`AppSlider` wraps Swiper via a scoped slot: `#default="{ slide }"` receives each item from the `:slides` prop array.

### Layouts

- `layouts/default.vue` — standard page shell with TheHeader + TheFooter
- `layouts/empty.vue` — no chrome (used for auth/error flows)

### Middleware

- `middleware/auth.ts` — redirects unauthenticated users to `/`
- `middleware/dev-only.ts` — restricts `/ui/*` routes to development mode

### Figma-to-code rules

When implementing sections from Figma:

- **Text alignment**: set `text-align` on the **parent** container, not on individual `h2`/`p` children — it inherits down and keeps the markup clean.
- **Gaps from Figma API**: always calculate gaps between items from `absoluteBoundingBox` coordinates: `gap = x2 - (x1 + width1)`. Never assume edge-to-edge.
- **Text styles to extract**: always log `textAlignHorizontal` alongside `fontSize`, `fontFamily`, `fontWeight`, `lineHeightPx`, `letterSpacing`.
- **Images**: fetch via Figma Images API (`/v1/images/{fileKey}?ids=...&format=png&scale=2`), download with `curl -L` into `public/images/`. API key is in `.mcp.json`.
- **Fonts**: Montserrat (headings) and Open Sans (body) are connected via Google Fonts in `nuxt.config.ts → app.head.link`. New fonts go there too.

### UI library

PrimeVue is registered selectively via `nuxt.config.ts` (`primevue.components.include`). Prefer the custom wrappers in `components/ui/` (`AppButton`, `AppInputText`, `AppPasswordInput`) over raw PrimeVue components — they enforce the design system.

---

## Vue/SCSS layout rules

Strict layout-architecture rules (stream vs. z-axis, rigid columns, BEM planning breakdown, CSS quality checklist, breakpoints, z-index tokens, etc.) live in **`.claude/agents/markup.md`** — invoke the `markup` agent for any `.vue` template/style work so those rules load with full detail instead of sitting here always-on. `.claude/agents/reviewer.md` checks diffs against the same rule set.

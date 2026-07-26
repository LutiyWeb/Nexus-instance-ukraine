# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Nuxt dev server on http://localhost:3000 (kills port 3000 first)
npm run build    # Production SSR build
npm run preview  # Preview production build locally
```

## Backend

Separate repo: `d:/projects/shopmarker-backend` (sibling of this one). Fastify + Prisma + TypeScript, serves `:8000`.

```bash
# Run from the backend directory:
npm run dev              # Fastify dev server (tsx watch src/server.ts)
npm run typecheck        # tsc --noEmit — the backend's only static gate
npm run prisma:studio    # Inspect the DB
npm run db:seed          # Reseed
```

Both servers run in parallel — start the backend first, then `npm run dev` here.

Swagger UI is mounted on the backend, so the live API contract is available at its origin rather than in this repo. Check it before hand-writing a request shape in `contracts/`.

No test suite in either repo. `npm run build` and `npm run lint` are the only verification gates here.

## Architecture

### API communication

- `contracts/*.ts` — typed `$fetch` wrappers per domain (products, cart, auth, etc.). Named `contracts/`, **not** `api/` — Vercel auto-detects a root `api/` folder as Serverless Functions and breaks the build. Don't rename it back.
- `composables/useAuthFetch.ts` — wraps `$fetch` with `Authorization: Bearer <token>` from the auth store; use this for all protected endpoints
- API base URL: `runtimeConfig.public.apiBase` (defaults to `http://localhost:8000`)

### State (Pinia)

Stores in `stores/` are auto-imported. Auth state (`token` + `user`) is persisted in `localStorage`. A cart row is created server-side on registration; the cart store fetches it on mount.

### Styling

- SCSS with BEM; component styles use `<style lang="scss">` with the component root class as the BEM block
- Design tokens in `assets/styles/_variables.scss` (colors, typography, spacing, breakpoints, shadows)
- `respond-to($bp)` mixin in `_mixins.scss` — **min-width, mobile-first**: `sm` (640px) / `md` (768px) / `lg` (1024px) / `xl` (1280px) / `2xl` (1536px)
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

### Layouts & middleware

`default` layout is the standard shell; `empty` is chrome-less, for auth/error flows. `auth` middleware bounces unauthenticated users to `/`; `dev-only` gates the `/ui/*` kit to dev mode.

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

# AI Assistant Role: Senior Frontend Layout Architect

Operate in strict architectural planning mode. Before generating any Vue/SCSS for a section, follow these principles and output a planning breakdown.

## GLOBAL LAYOUT GUIDELINES (APPLY ALWAYS):

1. **Stream vs. Z-Axis Separation**:
   - All meaningful content (text, buttons, media) MUST stay in the natural HTML flow. `position: absolute` on content elements is forbidden.
   - `position: absolute` is allowed ONLY for decorative layers (background shapes, blobs, textures) that do not affect neighboring block geometry.

2. **Complex Geometry & Overflow Isolation**:
   - If UI elements visually protrude beyond section background boundaries, `overflow: hidden` on that container is forbidden.
   - Handle overflows via `calc()` in `background-size` or absolutely positioned decorative layers.

3. **Rigid Column Framework**:
   - In multi-column layouts, column proportions MUST be locked at the parent level via `flex: 0 0 Xpx` or `grid-template-columns`.
   - Dynamic content in one column must never be able to deform the adjacent column.

4. **Safe Text Content Architecture**:
   - Text offer blocks: Flex container, `flex-direction: column`, spacing via `gap` only.
   - All paragraphs and descriptions MUST have a hard `max-width`.
   - Decorative underlines/separators tied to text → `::after`/`::before` pseudo-element with `padding` on the text node.

5. **Taboos on Hardcoded Heights & Inline Styles**:
   - `height` on text-holding containers is forbidden. Use `padding` or `min-height`.
   - Inline styles (`style="..."`) are forbidden.

6. **Design Tokens, Typography & Mixins**:
   - All colors via `var(--color-*)`. Hardcoded HEX/RGB in component selectors is forbidden.
   - Use `px` for sizes and spacings (pixel-perfect Figma match).
   - Never duplicate font property sets across classes — use `@include` typography mixins. Check for existing mixins before creating new ones.

## RESPONSE FORMAT:

Before any code, output a planning breakdown:

1. **Step 1 — Layer & Z-Axis Analysis**: Which elements stay in flow, which go `position: absolute` as decorative layers, and why.

2. **Step 2 — Layout Plan with Reasoning**: For each container:
   - Technique (Grid or Flex) and **why** — e.g., "Grid for the two-column split because proportions must be rigidly locked; Flex for the text block because items stack vertically."
   - Column locking: exact values and reasoning.
   - Spacing tool: `gap` vs `padding` vs `margin` — and **why** each.
   - `max-width` on text elements.

3. **Step 3 — Naming Plan**: Full BEM breakdown:
   - Block name (e.g., `.hero-banner`)
   - Every element (`__media`, `__content`, `__title`, `__decoration`)
   - Modifiers (`--dark`, `--wide`) if applicable

4. **Step 4 — Typography & Tokens**: Which `var(--color-*)` tokens and `@include` mixins will be used.

5. **Step 5 — Code**: Clean Vue SFC with `<style lang="scss">`. No inline styles, no hardcoded values.

---

## CSS CODE QUALITY RULES (APPLY ALWAYS):

1. **Pseudo-elements for decorative DOM nodes**: Any element that exists purely for decoration (background shapes, dividers, separator lines, visual accents — no semantic content) MUST be implemented as a `::before`/`::after` pseudo-element on its nearest semantic parent, not as a separate HTML element. Extra DOM nodes for decoration pollute the markup without semantic value.

2. **Check globals before writing component styles**: Before writing a property in a component, verify it is not already set in the global reset (`main.scss`). Globally defined rules must not be repeated per-component. Known global defaults (as of current `main.scss`):
   - `img { display: block; max-width: 100%; }` — never repeat these on `img` inside components
   - `button { border: none; padding: 0; cursor: pointer; background: none; }` — never repeat on button elements
   - `*, *::before, *::after { box-sizing: border-box; }`

3. **Horizontal offsets belong on the container**: When multiple sibling children share the same left/right indent, set `padding-inline` on the parent container — all children inherit the boundary automatically. Do NOT apply `margin-left` to each child individually. Exception: a design-specific offset that applies only to one particular child element (e.g., `margin-left` on a single image for a Figma-precise placement) stays on that child, not the container.

4. **CSS custom properties for component-specific colors**: Hardcoded `rgb()`/HEX values that are unique to a component (not in `_variables.scss`) MUST be extracted to CSS custom properties defined at the component root class (e.g., `--hero-accent: rgb(241, 209, 82)`). Use `var(--...)` everywhere inside the component. This enables per-context overrides without touching component internals.

5. **Explicit breakpoints per component**: Every component must have styles explicitly written for all breakpoints it uses (`sm`, `md`, `lg`, `xl`). Never rely on implicit inheritance between breakpoints — missing a middle breakpoint causes tablet layout breaks.

6. **`<img>` width + height attributes required**: Always set `width` and `height` HTML attributes on every `<img>`, even if CSS controls the visual size. Without them the browser can't reserve space before the image loads — causes layout shift (CLS).

7. **Interactive states are mandatory**: Every clickable element must have `:hover`, `:focus-visible`, and `:active` styles defined at the time of initial implementation, not later.

8. **Animations via `transform`/`opacity` only**: Never animate `top`, `left`, `width`, `height`, or `margin` — these trigger reflow on every frame. Only `transform` and `opacity` are GPU-composited.

9. **`z-index` via CSS custom properties only**: All z-index values must be defined as custom properties at the `:root` level in `_variables.scss` (e.g., `--z-header: 100`, `--z-modal: 200`). No hardcoded integers in component styles.

10. **HTML semantics**: One `<h1>` per page. Use `<section>`, `<article>`, `<nav>`, `<main>` where appropriate. Never use `<div>` as a button or `<a>` without `href`.

11. **No dead CSS — write only what produces a visible effect**: Before adding any CSS property, verify it has a real effect given the current DOM structure. Specifically:
    - Layout properties (`display: flex`, `flex-direction`, `gap`, `align-items`, `justify-content`) on a container with a **single child** are meaningless — omit them.
    - Never write a property that is already the browser default (`overflow: visible`, `width: auto`, `display: block` on a `div`).
    - If removing a property would produce zero visual difference, it does not belong in the codebase.

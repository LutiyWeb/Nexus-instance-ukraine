# TODOs

Lives here (frontend repo) rather than in `shopmarker-backend` because this is
where the actual work happens. Backend-flagged items below are notes for
whoever picks up backend work — not something implemented from this repo.

Reviewed again 2026-07-31: the optimistic lock is done. The remaining three are
deliberately still open — unsubscribe needs a schema change plus a public
opt-out route, and both Storage items need a scheduler the project does not
have yet (no cron, no worker process).

## Deferred from `/review` (2026-07-18) — backend

### Questions module

- ~~**Optimistic lock on admin `PATCH /api/admin/questions/:id`.**~~ Done
  2026-07-31. `updateMany({ where: { id, answer: existing.answer } })` guards the
  write on the value read at the start of the request; `count === 0` returns 409.
  Because `updateMany` cannot return relations, the response row is re-read.

- **Consent / unsubscribe link in `sendQuestionAnswerEmail`.** Users who set
  `notifyByEmail=true` months ago may not recognize the answer email as expected.
  Add a footer explaining why they received it and a way to opt out. For now the
  address they registered with is used verbatim; if they later change their email
  via `PATCH /users/me`, notifications go to the current address (fine, but
  document it).

### Storage cleanup

- **Cron cleanup for orphan Storage files.** Best-effort cleanup on transaction
  rollback covers the happy failure path. For process crashes between upload and
  cleanup, add a scheduled task: `SELECT path FROM product_question_images` and
  the equivalent for banner tables, then list-and-diff against the bucket, then
  delete files older than 24h that aren't referenced. Same for `favorite_lists`
  photos if we ever add them.

- **Cleanup files when a banner or question is deleted.** Right now `DELETE
/api/admin/banners/main/:id` and `DELETE /api/admin/questions/:id` drop DB
  rows but leave the referenced files in Storage. Same cron above would collect
  these, but a synchronous cleanup on delete would be cleaner.

## Frontend — checkout validation UX (deferred 2026-07-30)

- **Field error text shifts layout.** `errors.npCityRef` / `errors.npWarehouseRef` (and
  the other inline field errors) render in normal flow below the input, pushing
  everything after them down when they appear. Should be positioned so appearing/
  disappearing doesn't reflow the rest of the form (e.g. reserved space or
  absolutely positioned relative to the field wrapper).

- **Stale error doesn't clear when the field becomes valid.** `errors.value` is only
  reset at the top of `submit()`. If a submit attempt fails validation (e.g. no
  city selected) and the user then picks a valid city/warehouse, the old error
  message ("Оберіть місто зі списку" / "Оберіть відділення зі списку") stays
  visible under the now-filled field until the next submit call. Should clear
  the specific error reactively once that field has a valid value (e.g. a
  `watch` on `selectedCity`/`selectedWarehouse`, or re-validate on change).

## Data — Ukrainian re-import (deferred 2026-08-10) — backend

- ~~**Today's Hubber test import (~800 products, 8 vendor categories) is in
  Russian.**~~ Done 2026-08-10. Old test products hard-deleted, re-imported
  with `language: 'uk-UA'`.
- ~~**Rename two local categories to Ukrainian**: `Часы` → `Годинники`,
  `Наушники` → `Навушники`.~~ Done 2026-08-10 via one-off DB update.

## Search page — skeleton grid doesn't match real product-card grid (deferred 2026-08-11)

- **At 1440px, `search-page__grid` shows only 4 cards per row (5th wraps to a
  new row)**, both for the `:loading="true"` skeleton state and for real
  results — they share the same `.search-page__grid` class in
  `pages/search.vue`, so whatever column count applies affects both equally.
  Elsewhere in the app (e.g. the homepage "Всі товари" product carousel),
  cards line up 6-per-row at the same viewport width. Bring
  `search-page__grid`'s column breakpoints in line with that reference so
  search results (and their loading skeletons) match the product-card grid
  used everywhere else instead of looking sparser/different.

## Homepage banners — stale/mismatched content (deferred 2026-08-11)

- **special_1 banner text doesn't match its linked product.** Headline reads
  "Навушники тижня — Marshall Major V" but `link_url` points to product 1484,
  which is a "Чохол на AirPods" (a case, not headphones) — miscategorized
  under `naushnyky` alongside real headphones. All three homepage banners
  (main + special_1 + special_2) had `link_url`s pointing at products deleted
  in the Ukrainian re-import above; they were patched with a one-off script
  that grabbed the top in-stock product per category without checking the
  product actually matches the banner's own headline. Main banner (Doogee
  copy → Xiaomi phone, product 1583) and special_2 (Kospet copy → Glory Tank
  X5 watch, product 1278) have the same "right category, wrong specific
  model" mismatch but are less jarring — lower priority unless flagged.
  Fix: pick a real headphones product (not a case) for special_1 via
  `/admin/banners`, or a follow-up one-off script that filters by title
  instead of just category.

## Homepage — "Лідери продажів" removed (deferred 2026-08-16) — backend

- **The old "Хіти продажів" slider on the homepage was fake** — it read from
  the same unsorted `store.products` array as "Всі товари", just sliced to a
  different length, so it always showed the exact same items under a
  misleading label. Removed from `pages/index.vue` rather than leave a lie on
  the page.
- **No real signal to bring it back with yet.** `Product` has no sales-count
  field; ranking by actual sales means aggregating `order_items` (sum/count
  per product, probably over a rolling window), which doesn't exist as a
  query today — and the store doesn't have enough real order volume yet for
  that ranking to mean anything.
- Also capped what "Всі товари"/"Новинки" can show: `priceMax=20000` on the
  homepage fetch, plus a client-side `diversifyByCategory` cap (max 2 per
  category) so one Hubber import batch (e.g. a run of near-identical screen
  protectors) can't fill the whole slider.
- Fix: once there's real order history, add a backend-side bestseller
  ranking (new `sortBy` value or dedicated endpoint) and bring the section
  back ordered by that instead of raw insert order.

## Stale static banner images resurface when live products fail to load (deferred 2026-08-18)

- **Observed while the backend/DB was unreachable**: instead of a clean
  loading/empty/error state, some product-image slots fell back to old
  headphones photos (Marshall, Beats-style) that used to be hardcoded static
  banner content from before the catalogue was dynamic. Not yet identified
  which component holds onto this old fallback — needs investigation (likely
  a stale default/placeholder image reference, or cached old banner data,
  left in a component that renders product images).
- Fix: find and remove the leftover static fallback so a failed fetch shows
  a real loading/error state instead of resurrecting old placeholder content.

## ~~Auth broken (reported 2026-08-21)~~ — Fixed 2026-08-21

- Root cause: `nuxt.config.ts` hardcoded hCaptcha's public test sitekey for
  any non-production `NODE_ENV`, and that test key stopped rendering a
  working checkbox (showed its own "used for testing" error instead), so
  `captchaToken` never got set and login/register were both stuck on
  "Пройдіть перевірку капчі".
- Fix: local `.env` now sets `NUXT_PUBLIC_HCAPTCHA_SITE_KEY` (the real
  sitekey, same one used on Vercel prod); `nuxt.config.ts` now uses that
  env var regardless of `NODE_ENV`, falling back to the public test key
  only when unset. Verified working end-to-end locally.

## Product page "Perks" block — hardcoded claims, one legally wrong (deferred 2026-08-21)

**Де:** `pages/product/[id].vue:580-593`, the three-line block next to the buy
button (`Truck`/`Shield`/`Package` icons).

- ~~**"Повернення протягом 30 днів" contradicted Ukrainian consumer law.**~~
  Fixed 2026-08-21 → now says 14 днів, matching Закон України «Про захист
  прав споживачів» ст. 9 (non-food goods of proper quality: 14-day return
  right). If the store ever wants to voluntarily offer more than the legal
  minimum, that's a deliberate policy change, not a typo fix.
- **"Гарантія 12 місяців" is a blanket claim not backed by real per-product
  data — open, needs a decision.** The per-product warranty shown in the
  Характеристики tab (e.g. "24 міс." on some products) is NOT a dedicated
  field — it's whatever raw key/value pair Hubber happens to include in that
  product's `options` (`product.value?.specs` in `pages/product/[id].vue:327`,
  just `Object.entries()`, no normalization, no guaranteed presence). Backend
  has no dedicated warranty field either (checked, nothing found). So the
  Perks-block "12 місяців" is neither the real per-product value nor
  confirmed accurate for every product — currently just a placeholder that
  happens to look like real data next to the buy button.
  - Option A: only show this perk when the product's own specs actually
    contain a warranty-shaped key, using that exact value; omit the perk
    otherwise rather than show a number that may not apply.
  - Option B: if there's a genuine store-wide minimum-warranty policy (e.g.
    "мінімум 12 місяців від магазину незалежно від виробника"), keep a fixed
    claim — but that needs to be a conscious business decision, not a leftover.
  - Not decided as of 2026-08-21 — user wasn't sure yet, asked to leave open.
- **"Безкоштовна доставка від 1 500 ₴" has no backing config anywhere** —
  pure placeholder number, not tied to any real shipping-threshold setting.
  Deliberately deprioritized by the user (2026-08-21): "подумаем, как это
  правильно сделать" — revisit once there's an actual delivery-pricing policy
  to wire it to.

## ~~Catalog — scroll to top on pagination (added 2026-11-20)~~ — Done 2026-11-20

- ~~**Clicking a pagination page leaves the viewport at the bottom of the catalog.**~~
  Fixed in `components/catalog/CatalogView.vue` (`onPageUpdate` now scrolls to top).

## ~~Header — widen desktop search bar by 20% (added 2026-11-20)~~ — Done 2026-11-20

- ~~**Increase `.the-header__search` width on desktop by 20%.**~~
  Fixed in `components/layout/TheHeader.vue` (`max-width: 336px` at `notebook`).

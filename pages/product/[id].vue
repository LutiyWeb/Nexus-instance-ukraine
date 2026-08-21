<script setup lang="ts">
import { Star, Package, Shield, Truck } from 'lucide-vue-next'
import DOMPurify from 'isomorphic-dompurify'
import type { Product } from '~/types/product'

const route = useRoute()
const cartStore = useCartStore()
const wishlistsStore = useWishlistsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const productsStore = useProductsStore()
const categoriesStore = useCategoriesStore()

const config = useRuntimeConfig()

// Render's free-tier backend can cold-start for up to ~1min. A short
// server-side timeout keeps SSR from hanging into Vercel's function
// timeout; the client retry below (onMounted) has no such limit and can
// wait it out.
const backendTimeout = process.server ? 6000 : 90000

const {
  data: productData,
  pending,
  error,
  refresh: refreshProduct,
} = useAsyncData(
  () => `product-${route.params.id}`,
  () =>
    $fetch<{ data: Product }>(`${config.public.apiBase}/api/products/${route.params.id}`, {
      timeout: backendTimeout,
    }),
)

const product = computed(() => productData.value?.data ?? null)
const loading = computed(() => pending.value)

interface ReviewsSummary {
  total: number
  avg: number | null
}

const {
  data: reviewsData,
  error: reviewsError,
  refresh: refreshReviews,
} = useAsyncData(
  () => `product-reviews-summary-${route.params.id}`,
  () =>
    $fetch<{ summary: ReviewsSummary }>(
      `${config.public.apiBase}/api/products/${route.params.id}/reviews`,
      { query: { limit: 1 }, timeout: backendTimeout },
    ),
)
const reviewsSummary = computed(() => reviewsData.value?.summary ?? null)

onMounted(() => {
  if (error.value) refreshProduct()
  if (reviewsError.value) refreshReviews()
})

// Vendor descriptions arrive as HTML; sanitize before v-html to strip anything
// that could execute (script tags, event handlers) while keeping formatting.
const sanitizedDescription = computed(() => DOMPurify.sanitize(product.value?.description ?? ''))
// Meta tags must be plain text — strip all markup rather than leaking raw HTML
// into <meta description> / OG tags.
const plainDescription = computed(() =>
  DOMPurify.sanitize(product.value?.description ?? '', { ALLOWED_TAGS: [] }).trim(),
)

// Vendor descriptions can run to a couple thousand characters (spec dumps,
// bullet lists) with no shorter variant available from the source — collapse
// tall ones behind a toggle instead of always rendering the full block.
const DESC_COLLAPSE_HEIGHT = 220
const descRef = ref<HTMLElement | null>(null)
const isDescExpanded = ref(false)
const canCollapseDesc = ref(false)

function measureDescOverflow() {
  const el = descRef.value
  canCollapseDesc.value = !!el && el.scrollHeight > DESC_COLLAPSE_HEIGHT + 1
}

// Navigating between two products reuses this page's component instance
// (same route, different :id), so onMounted never runs again — and the
// description block itself sits behind v-if="loading" / v-else-if="product",
// so it unmounts and remounts around the loading skeleton on every product
// switch. A plain nextTick-after-watch can fire before that remount's content
// has actually settled, which is why this worked on a hard refresh (fresh
// mount) but not on client-side navigation. A ResizeObserver reacts to the
// element's real rendered size instead of guessing when that happens, so it's
// correct on first mount, after every navigation, and if the content
// reflows later (e.g. a slow-loading image inside the vendor HTML).
let descResizeObserver: ResizeObserver | null = null
watch(descRef, (el) => {
  descResizeObserver?.disconnect()
  descResizeObserver = null
  if (!el) return
  measureDescOverflow()
  descResizeObserver = new ResizeObserver(() => measureDescOverflow())
  descResizeObserver.observe(el)
})
onUnmounted(() => descResizeObserver?.disconnect())

watch(
  () => product.value?.id,
  () => {
    isDescExpanded.value = false
  },
)

onMounted(() => {
  if (!productsStore.products.length) productsStore.fetchProducts({ limit: 24 })
  if (!categoriesStore.categories.length) categoriesStore.fetchCategories()
})

// PROTOTYPE DATA — "related to this product" is currently just other items
// from the catalog, not a real relation. Swap for real data once the backend
// exposes it (see ProductRecommendations for context).
const relatedPool = computed(() => productsStore.products.filter((p) => p.id !== product.value?.id))
const recommendedProducts = computed(() => relatedPool.value.slice(0, 8))

// Cross-sell rules for the "Вигідний комплект" widget: which accessory
// subcategories make sense to pair with a given product category. Only
// pairings with a real, defensible relationship are listed — Годинники and
// Laptops have no accessory subcategory that actually fits them yet.
const BUNDLE_ACCESSORY_CATEGORIES: Record<string, string[]> = {
  smartphones: ['chohly-dlya-telefoniv', 'zaryadni-prystroi', 'powerbanky'],
  naushnyky: ['zaryadni-prystroi', 'powerbanky'],
}

const accessoryCategorySlugs = computed(
  () => BUNDLE_ACCESSORY_CATEGORIES[product.value?.categorySlug ?? ''] ?? [],
)

// Phone cases are model/brand-specific — unlike chargers and powerbanks,
// which fit anything with a USB port, a case only makes sense as a bundle
// item if it actually fits the phone. Vendor data has no structured "fits
// phone X" field, but case specs do carry a free-text compatibility value
// (key spelled either "Сумісність" or "Совместимость...") we can match
// against the phone's brand — e.g. "AGM H6" matches brand "AGM". This is
// brand-level, not exact-model, matching: that's the ceiling of what the
// vendor data supports.
const CASE_CATEGORY_SLUG = 'chohly-dlya-telefoniv'

function findCompatibilityText(specs: Record<string, string> | null | undefined) {
  if (!specs) return null
  const key = Object.keys(specs).find((k) => /сумісність|совместимост/i.test(k))
  return key ? specs[key] : null
}

function isCompatibleCase(caseProduct: Product, phoneBrand: string | null) {
  const compat = findCompatibilityText(caseProduct.specs)
  if (!compat) return false
  if (/універсальн|универсальн/i.test(compat)) return true
  if (!phoneBrand) return false
  const brandAliases =
    phoneBrand.toLowerCase() === 'apple' ? ['iphone', 'apple'] : [phoneBrand.toLowerCase()]
  return brandAliases.some((alias) => compat.toLowerCase().includes(alias))
}

// Fetched per category (not one combined query) so a category with fewer
// in-stock items can't get crowded out of a shared result window and silently
// disappear from the tab list. Cases are fetched from a larger pool since
// most of it gets filtered out by brand compatibility.
const bundleAccessoryProductsBySlug = ref<Record<string, Product[]>>({})

watch(
  () => [product.value?.id, accessoryCategorySlugs.value.join(',')] as const,
  async ([, slugsKey]) => {
    if (!slugsKey) {
      bundleAccessoryProductsBySlug.value = {}
      return
    }
    const phoneBrand = product.value?.brand ?? null
    const results = await Promise.all(
      accessoryCategorySlugs.value.map((slug) =>
        $fetch<{ data: Product[] }>(`${config.public.apiBase}/api/products/`, {
          query: { categories: slug, limit: slug === CASE_CATEGORY_SLUG ? 100 : 8 },
        }),
      ),
    )
    bundleAccessoryProductsBySlug.value = Object.fromEntries(
      accessoryCategorySlugs.value.map((slug, i) => {
        let items = results[i].data.filter((p) => p.id !== product.value?.id)
        if (slug === CASE_CATEGORY_SLUG) {
          items = items.filter((p) => isCompatibleCase(p, phoneBrand)).slice(0, 8)
        }
        return [slug, items]
      }),
    )
  },
  { immediate: true },
)

const accessoriesParentCategory = computed(() =>
  categoriesStore.categories.find((c) => c.slug === 'accessories'),
)

const bundleAccessoryGroups = computed(() =>
  accessoryCategorySlugs.value
    .map((slug) => ({
      slug,
      name:
        accessoriesParentCategory.value?.subcategories?.find((s) => s.slug === slug)?.name ?? slug,
      products: bundleAccessoryProductsBySlug.value[slug] ?? [],
    }))
    .filter((group) => group.products.length > 0),
)

useSeoMeta({
  title: () => (product.value ? `${product.value.title} — Honey Store` : 'Товар'),
  description: () => plainDescription.value,
  ogTitle: () => product.value?.title ?? '',
  ogDescription: () => plainDescription.value,
  ogImage: () => product.value?.thumbnail ?? '',
  ogUrl: () => `${config.public.siteUrl}${route.path}`,
  twitterCard: 'summary_large_image',
})
useCanonical()

useJsonLd(() => {
  const p = product.value
  if (!p) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    description: plainDescription.value,
    sku: p.sku ?? undefined,
    image: p.images.length ? p.images : p.thumbnail ? [p.thumbnail] : undefined,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    aggregateRating:
      reviewsSummary.value && reviewsSummary.value.total > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: reviewsSummary.value.avg ?? p.rating,
            reviewCount: reviewsSummary.value.total,
          }
        : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'UAH',
      price: p.price,
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${config.public.siteUrl}${route.path}`,
    },
  }
})

const allImages = computed(() => {
  const p = product.value
  if (!p) return []
  return [p.thumbnail, ...p.images].filter(Boolean) as string[]
})

const isFav = computed(() => (product.value ? wishlistsStore.has(product.value.id) : false))
const isInCart = computed(() => (product.value ? cartStore.has(product.value.id) : false))
const cartQty = computed(
  () => cartStore.items.find((e) => e.product.id === product.value?.id)?.qty ?? 0,
)

const originalPrice = computed(() => {
  const p = product.value
  if (!p?.price || !p.discountPercentage) return null
  return Math.round(p.price / (1 - p.discountPercentage / 100))
})

// TODO: replace with real dynamic spec set once backend defines per-category fields
//
// Vendor imports frequently leave sku/rating empty, so each box falls back to
// something that's actually always available rather than a bare dash:
// artikul falls back to the product id, rating falls back to the live
// reviews summary (real aggregate) and finally to "no reviews yet".
const quickSpecs = computed(() => {
  const p = product.value
  const reviews = reviewsSummary.value

  return [
    { label: 'Бренд', value: p?.brand ?? 'Не вказано' },
    { label: 'Артикул', value: p?.sku ?? (p ? `#${p.id}` : '—') },
    {
      label: 'Рейтинг',
      value:
        reviews && reviews.total > 0 && reviews.avg
          ? `${reviews.avg.toFixed(1)} (${reviews.total})`
          : 'Немає відгуків',
    },
  ]
})

// Only used when the product has no real vendor specs at all (older imports
// that predate the specs field) — generic info in place of an empty tab.
const fallbackSpecs = computed(() => [
  { label: 'Бренд', value: product.value?.brand ?? 'Не вказано' },
  { label: 'Категорія', value: product.value?.category ?? '—' },
  { label: 'Рейтинг', value: String(product.value?.rating ?? '—') },
  { label: 'В наявності', value: `${product.value?.stock ?? 0} шт.` },
  {
    label: 'Знижка',
    value: product.value?.discountPercentage
      ? `${Math.round(product.value.discountPercentage)}%`
      : 'Немає',
  },
  { label: 'Артикул', value: product.value?.sku ?? '—' },
  { label: 'Гарантія', value: '12 місяців' },
])

// Vendor spec labels arrive in whatever language that product happened to be
// imported in (mostly Russian so far) — match both spellings rather than
// assume one. Order here is display priority, not matched order.
const PRIORITY_SPEC_KEYWORDS = [
  ['процесор', 'процессор'],
  ["оперативна пам'ять", 'оперативная память'],
  ["вбудована пам'ять", 'встроенная память'],
  ['діагональ екрана', 'диагональ экрана'],
  ['основна камера', 'основная камера'],
  ['ємність акумулятора', 'емкость аккумулятора'],
]
const MAX_TOP_SPECS = 6

function toSpec([label, value]: [string, string]) {
  return { label, value }
}

const specEntries = computed(() => Object.entries(product.value?.specs ?? {}))
const hasRealSpecs = computed(() => specEntries.value.length > 0)

// Splits real specs into "shown up-front" (known-important fields first,
// padded with whatever's left) and "rest" (behind the toggle below) — rather
// than guessing where a 'technical specs' section starts in free text, this
// works off the actual key/value pairs the vendor already gives us.
const prioritizedSpecs = computed(() => {
  const entries = [...specEntries.value]
  const top: Array<{ label: string; value: string }> = []

  for (const keywords of PRIORITY_SPEC_KEYWORDS) {
    if (top.length >= MAX_TOP_SPECS) break
    const idx = entries.findIndex(([label]) =>
      keywords.some((kw) => label.toLowerCase().includes(kw)),
    )
    if (idx !== -1) top.push(toSpec(entries.splice(idx, 1)[0]))
  }
  while (top.length < MAX_TOP_SPECS && entries.length > 0) {
    top.push(toSpec(entries.shift()!))
  }

  return { top, rest: entries.map(toSpec) }
})

const topSpecs = computed(() =>
  hasRealSpecs.value ? prioritizedSpecs.value.top : fallbackSpecs.value,
)
const restSpecs = computed(() => (hasRealSpecs.value ? prioritizedSpecs.value.rest : []))
const specsExpanded = ref(false)
watch(specEntries, () => {
  specsExpanded.value = false
})

const tabs = [
  { key: 'specs', label: 'Характеристики' },
  { key: 'reviews', label: 'Відгуки' },
]
const activeTab = ref('specs')

// TODO: remove route.query.oos check — test only, backend will send real stock
const isOutOfStock = computed(() => (product.value?.stock ?? 0) === 0 || route.query.oos === '1')

function onAddToCart(qty: number) {
  if (product.value) cartStore.add(product.value, qty)
}

function onUpdateCartQty(delta: number) {
  if (product.value) cartStore.updateQty(product.value.id, delta)
}

const toastStore = useToastStore()

function notifyWhenAvailable() {
  if (!authStore.isLoggedIn) {
    uiStore.authModalOpen = true
    return
  }
  toastStore.add("Ми повідомимо вас, коли товар з'явиться в наявності", 'success')
}

function toggleFav() {
  if (product.value) wishlistsStore.toggle(product.value.id)
}
</script>

<template>
  <div>
    <div class="product-detail container">
      <AppBreadcrumbs
        :crumbs="[
          { label: 'Головна', to: '/' },
          { label: 'Каталог', to: '/catalog' },
          {
            label: product?.category ?? '...',
            to: product?.categorySlug ? `/catalog/${product.categorySlug}` : '/catalog',
          },
          { label: product?.title ?? '...' },
        ]"
        class="product-detail__breadcrumbs"
      />

      <!-- Loading -->
      <div
        v-if="loading"
        class="product-detail__layout"
      >
        <div class="product-gallery">
          <AppSkeleton
            width="100%"
            height="420px"
            border-radius="16px"
          />
          <div class="product-detail__thumbs-skeleton">
            <AppSkeleton
              v-for="n in 4"
              :key="n"
              width="72px"
              height="72px"
              border-radius="8px"
            />
          </div>
        </div>
        <div class="product-detail__info">
          <AppSkeleton
            width="100px"
            height="14px"
            class="product-detail__skel-gap"
          />
          <AppSkeleton
            width="80%"
            height="32px"
            class="product-detail__skel-gap"
          />
          <AppSkeleton
            width="100%"
            height="14px"
            class="product-detail__skel-gap"
          />
          <AppSkeleton
            width="90%"
            height="14px"
            class="product-detail__skel-gap"
          />
          <AppSkeleton
            width="140px"
            height="40px"
            class="product-detail__skel-gap"
            style="margin-top: 16px"
          />
          <AppSkeleton
            width="100%"
            height="56px"
            border-radius="12px"
            style="margin-top: 24px"
          />
        </div>
      </div>
      <AppColdStartNotice v-if="loading" />

      <!-- Error -->
      <div
        v-else-if="error || !product"
        class="product-detail__error"
      >
        <p>
          Не вдалося завантажити товар. Спробуйте
          <button
            type="button"
            class="product-detail__error-retry"
            @click="() => refreshNuxtData()"
          >
            оновити сторінку
          </button>
        </p>
      </div>

      <!-- Content -->
      <div
        v-else-if="product"
        class="product-detail__layout"
      >
        <!-- Media -->
        <ProductGallery
          :images="allImages"
          :title="product.title"
          :out-of-stock="isOutOfStock"
        />

        <!-- Info  -->
        <div class="product-detail__info">
          <NuxtLink
            v-if="product.categorySlug"
            :to="`/catalog/${product.categorySlug}`"
            class="product-detail__category"
            >{{ product.category }}</NuxtLink
          >

          <div class="product-detail__title-row">
            <h1 class="product-detail__title">{{ product.title }}</h1>
          </div>

          <!-- Rating & meta -->
          <div class="product-detail__meta">
            <span
              v-if="product.rating"
              class="product-detail__rating"
            >
              <Star
                :size="14"
                fill="currentColor"
              />
              {{ product.rating }}
            </span>
            <span
              v-if="product.brand"
              class="product-detail__brand"
              >{{ product.brand }}</span
            >
            <span
              :class="[
                'product-detail__stock',
                !isOutOfStock ? 'product-detail__stock--in' : 'product-detail__stock--out',
              ]"
              >{{ !isOutOfStock ? 'В наявності' : 'Немає в наявності' }}</span
            >
          </div>

          <!-- Quick specs -->
          <div class="product-detail__quick-specs">
            <div
              v-for="spec in quickSpecs"
              :key="spec.label"
              class="product-detail__quick-spec"
            >
              <span class="product-detail__quick-spec-label">{{ spec.label }}</span>
              <span class="product-detail__quick-spec-value">{{ spec.value }}</span>
            </div>
          </div>

          <div class="product-detail__desc-wrap">
            <!-- sanitized via DOMPurify (sanitizedDescription above) — vendor HTML never renders unescaped -->
            <div
              ref="descRef"
              class="product-detail__desc"
              :class="{ 'product-detail__desc--collapsed': canCollapseDesc && !isDescExpanded }"
              v-html="sanitizedDescription"
            />
            <button
              v-if="canCollapseDesc"
              type="button"
              class="product-detail__desc-toggle"
              @click="isDescExpanded = !isDescExpanded"
            >
              {{ isDescExpanded ? 'Згорнути' : 'Показати повністю' }}
            </button>
          </div>

          <!-- Purchase: price + availability + favorite/qty/buy -->
          <ProductPurchasePanel
            :product="product"
            :original-price="originalPrice"
            :is-fav="isFav"
            :is-out-of-stock="isOutOfStock"
            :is-in-cart="isInCart"
            :cart-qty="cartQty"
            @add-to-cart="onAddToCart"
            @toggle-fav="toggleFav"
            @notify="notifyWhenAvailable"
            @update-cart-qty="onUpdateCartQty"
          />

          <!-- Perks -->
          <div class="product-detail__perks">
            <div class="product-detail__perk">
              <Truck :size="16" />
              <span>Безкоштовна доставка від 1 500 ₴</span>
            </div>
            <div class="product-detail__perk">
              <Shield :size="16" />
              <span>Гарантія 12 місяців</span>
            </div>
            <div class="product-detail__perk">
              <Package :size="16" />
              <span>Повернення протягом 30 днів</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bundle widget: real cross-sell accessories, prototype-only "Купити комплект" pricing -->
      <ProductBundleWidget
        v-if="product && bundleAccessoryGroups.length"
        :product="product"
        :groups="bundleAccessoryGroups"
        class="product-detail__bundle"
      />

      <!-- Tabs -->
      <div class="product-detail__content">
        <div
          v-if="product"
          class="product-detail__tabs"
        >
          <div class="product-detail__tabs-nav">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="[
                'product-detail__tab-btn',
                { 'product-detail__tab-btn--active': activeTab === tab.key },
              ]"
              type="button"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="product-detail__tab-content">
            <template v-if="activeTab === 'specs'">
              <ProductSpecsTable :specs="topSpecs" />
              <div
                v-if="specsExpanded && restSpecs.length"
                class="product-detail__specs-more"
              >
                <ProductSpecsTable :specs="restSpecs" />
              </div>
              <button
                v-if="restSpecs.length"
                type="button"
                class="product-detail__specs-toggle"
                @click="specsExpanded = !specsExpanded"
              >
                {{ specsExpanded ? 'Сховати' : 'Дивитись всі характеристики' }}
              </button>
            </template>

            <div v-else-if="activeTab === 'reviews'">
              <ProductReviews :product-id="product.id" />
            </div>
          </div>
        </div>
        <!-- Questions — always visible, not tucked behind a tab -->
        <div
          v-if="product"
          class="product-detail__questions"
        >
          <ProductQuestions :product-id="product.id" />
        </div>
      </div>

      <!-- Recommendations (prototype) -->
      <ProductRecommendations
        :products="recommendedProducts"
        class="product-detail__recs"
      />
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.product-detail {
  padding-block: 24px;

  &__breadcrumbs {
    margin-bottom: 16px;
  }

  &__layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    align-items: flex-start;

    // Stacked single-column layout: full-bleed 100%-wide gallery reads as
    // oversized once there's room to spare, so it's capped to 80% and
    // centered from 640px up. Below that (phones) it stays full width so the
    // nav arrows keep hugging the screen edges. Once the gallery sits in its
    // own grid column (tablet+) it fills that column normally again.
    @include mixins.respond-to(mobile) {
      .product-gallery {
        max-width: 80%;
        margin-inline: auto;
      }
    }

    @include mixins.respond-to(tablet) {
      grid-template-columns: 1fr 1fr;
      gap: 32px;

      .product-gallery {
        max-width: none;
        margin-inline: 0;
      }
    }
  }

  &__thumbs-skeleton {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  &__skel-gap {
    margin-bottom: 12px;
    display: block;
  }

  // Info
  &__category {
    display: inline-block;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-primary;
    margin-bottom: 8px;
  }

  &__title-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    margin: 0;
    flex: 1;
    min-width: 0;
    line-height: 1.2;
    overflow-wrap: break-word;

    @include mixins.respond-to(desktop) {
      font-size: $font-size-2xl;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  &__rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: $color-warning;
    font-weight: $font-weight-semibold;
    font-size: $font-size-sm;
  }

  &__brand {
    color: $color-gray-500;
    font-size: $font-size-sm;
  }

  &__stock {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    &--in {
      color: $color-success;
    }
    &--out {
      color: $color-danger;
    }
  }

  // Quick specs
  &__quick-specs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  &__quick-spec {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 10px 8px;
    text-align: center;
    background: $color-gray-50;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
  }

  &__quick-spec-label {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__quick-spec-value {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // Vendor descriptions are sanitized HTML (see [id].vue script), so this
  // styles whatever block/inline tags they send: headings, paragraphs, lists.
  &__desc-wrap {
    margin-bottom: 20px;
  }

  &__desc {
    color: $color-gray-600;
    line-height: $line-height-relaxed;
    font-size: $font-size-sm;

    &--collapsed {
      max-height: 220px;
      overflow: hidden;
      position: relative;
      mask-image: linear-gradient(to bottom, $color-black 80%, transparent 100%);
    }

    p {
      margin: 0 0 $spacing-3;
    }

    h2,
    h3 {
      margin: $spacing-5 0 $spacing-2;
      font-size: $font-size-base;
      font-weight: $font-weight-semibold;
      color: $color-gray-900;
    }

    strong {
      font-weight: $font-weight-semibold;
      color: $color-gray-900;
    }

    ul {
      margin: 0 0 $spacing-3;
      padding-left: $spacing-5;
      list-style: disc;
    }

    li {
      margin-bottom: $spacing-1;
    }

    > :first-child {
      margin-top: 0;
    }

    > :last-child {
      margin-bottom: 0;
    }
  }

  &__desc-toggle {
    display: inline-block;
    padding: 0;
    border: none;
    background: none;
    color: $color-primary;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    cursor: pointer;

    &:hover {
      color: $color-primary-dark;
    }
  }

  &__specs-more {
    margin-top: $spacing-2;
  }

  &__specs-toggle {
    display: inline-block;
    margin-top: $spacing-3;
    padding: 0;
    border: none;
    background: none;
    color: $color-primary;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    cursor: pointer;

    &:hover {
      color: $color-primary-dark;
    }
  }

  // Perks
  &__perks {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: $color-gray-50;
    border-radius: $radius-lg;
    margin-bottom: 24px;
  }

  &__perk {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: $font-size-sm;
    color: $color-gray-600;

    svg {
      color: $color-primary;
      flex-shrink: 0;
    }
  }

  &__bundle {
    margin-top: 24px;
    margin-bottom: 24px;

    @include mixins.respond-to(tablet) {
      margin-top: 32px;
      margin-bottom: 32px;
    }
  }

  &__recs {
    margin-top: 24px;

    @include mixins.respond-to(tablet) {
      margin-top: 32px;
    }
  }

  //info
  &__content {
    @include mixins.respond-to(laptop) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
  }

  // Tabs

  &__tabs {
    flex-shrink: 0;
  }

  &__tabs-nav {
    display: flex;
    border-bottom: 2px solid $color-gray-100;
    gap: 4px;
  }

  &__tab-btn {
    padding: 12px 8px;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-500;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition:
      color $transition-fast,
      border-color $transition-fast;

    &:hover {
      color: $color-gray-900;
    }

    &--active {
      color: $color-primary;
      border-bottom-color: $color-primary;
    }
  }

  // Questions
  &__questions {
  }

  &__error {
    padding: 48px 0;
    color: $color-gray-500;
    font-size: $font-size-sm;
  }

  &__error-retry {
    color: $color-primary;
    text-decoration: underline;
    cursor: pointer;
    background: none;
    border: none;
    font-size: inherit;
    padding: 0;
  }
}
</style>

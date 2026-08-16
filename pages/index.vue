<script setup lang="ts">
import { Package, ShieldCheck, Truck, Percent, CreditCard } from 'lucide-vue-next'
import { CARD_GAP } from '~/constants/layout'
import type { Product } from '~/types/product'

// Same copy as the SEO block at the bottom of the page — repeated here as a
// compact strip right under the hero so a new visitor sees the trust signals
// before they scroll, not only in the footer-adjacent SEO text.
const TRUST_BADGES = [
  { icon: Package, label: 'Великий асортимент' },
  { icon: ShieldCheck, label: 'Офіційна гарантія' },
  { icon: Truck, label: 'Швидка доставка' },
  { icon: Percent, label: 'Вигідні ціни' },
  { icon: CreditCard, label: 'Зручна оплата' },
]

useSeoMeta({
  title: 'Honey Store — інтернет-магазин техніки та аксесуарів',
  description:
    'Смартфони, навушники, аксесуари та техніка з гарантією і швидкою доставкою по Україні.',
  ogTitle: 'Honey Store — інтернет-магазин техніки та аксесуарів',
  ogDescription:
    'Смартфони, навушники, аксесуари та техніка з гарантією і швидкою доставкою по Україні.',
})
useCanonical()

interface BannerDto {
  id: number
  title: string
  description: string | null
  mediaUrl: string | null
  mediaType: 'image' | 'video'
  linkUrl: string | null
  buttonText: string | null
  gradient: string | null
  sortOrder: number
}

type SliderItem = {
  id: string | number
  [key: string]: unknown
}

// Real API shape (snake_case) — see banner.serializer.ts on the backend.
interface MainBannerApiDto {
  id: number
  title: string
  description: string | null
  media_url: string
  media_type: 'image' | 'video'
  link_url: string | null
  sort_order: number
}
interface SpecialBannerApiDto {
  title: string
  image_url: string
  link_url: string | null
}
interface PromoTileApiDto {
  slug: string
  title: string
  subtitle: string
  link_url: string | null
}
interface HotTileApiDto {
  slug: string
  label: string
  image_url: string
  link_url: string | null
}
interface BannersResponse {
  data: {
    main_banner: MainBannerApiDto[]
    special_banners: {
      special_1: SpecialBannerApiDto | null
      special_2: SpecialBannerApiDto | null
    }
    promo_tiles: PromoTileApiDto[]
    hot_tiles: HotTileApiDto[]
  }
}

const config = useRuntimeConfig()
const categoriesStore = useCategoriesStore()

const { data: bannersData } = useFetch<BannersResponse>('/api/banners', {
  baseURL: config.public.apiBase,
})

const { isXl, isDesktop } = useBreakpoints()
const mounted = ref(false)

// Homepage sliders are impulse-buy real estate, not the full catalog — keep
// them to items a browsing visitor could plausibly add to cart on a whim.
// See TODOS.md for the "Лідери продажів" follow-up once there's real order
// data to rank by.
const HOME_PRICE_CEILING = 20000
const HOME_PER_CATEGORY = 3

// Every real top-level category gets a shot at the homepage now (was a
// hand-picked seasonal shortlist) — the noise/brand/dedup filters below do
// the curation work per category, so a thin or messy category just
// contributes fewer (or zero) items instead of needing to be hand-excluded.
const HOME_CATEGORY_SLUGS = [
  'smartphones',
  'laptops',
  'naushnyky',
  'audio',
  'gaming',
  'tablets',
  'accessories',
  'tv',
  'smart-home',
  'photo-video',
  'office',
  'chasy',
  'elektronni-knygy',
  'zaryadni-prystroi',
  'powerbanky',
  'chohly-dlya-telefoniv',
  'peryferiia',
]

// Generic accessory-noise guard, kept in case a future category swap
// reintroduces something strap/glass/case-heavy like `chasy` was.
const ACCESSORY_TITLE_EXCLUDES = ['ремінець', 'ремешок', 'скло', 'стекло', 'чохол', 'плівка']

function isAccessoryNoise(title: string): boolean {
  const lower = title.toLowerCase()
  return ACCESSORY_TITLE_EXCLUDES.some((kw) => lower.includes(kw))
}

// Checked against the live catalog on 2026-08-16 (`/api/brands/?search=...`) —
// only kept names with real stock. Revisit as the catalog grows; this is the
// difference between the homepage showing a Marshall headphone and a No Brand
// radio from the same category pool.
const RECOGNIZED_BRANDS = [
  'Xiaomi',
  'Samsung',
  'Apple',
  'Marshall',
  'JBL',
  'Sony',
  'Logitech',
  'Razer',
  'Anker',
  'ASUS',
  'Lenovo',
  'Huawei',
  'PocketBook',
  'Ajax',
  'Hikvision',
  'Doogee',
]

function isRecognizedBrand(brand: string | null): boolean {
  return !!brand && RECOGNIZED_BRANDS.includes(brand)
}

// Same base product in several colors (we've seen this repeatedly — Bearbrick
// powerbanks, Wonlex watches) reads as "3 identical items" once picked into a
// top-3. Stripping a trailing SKU code and common color words collapses those
// down to one representative before ranking runs.
const COLOR_WORDS = [
  'black',
  'white',
  'blue',
  'red',
  'grey',
  'gray',
  'silver',
  'gold',
  'rose',
  'green',
  'purple',
  'orange',
  'yellow',
  'pink',
  'beige',
  'brown',
  'multicolor',
  'graphite',
  'midnight',
  'starlight',
  'чорний',
  'білий',
  'синій',
  'червоний',
  'сірий',
  'сріблястий',
  'золотий',
  'рожевий',
  'чорный',
  'белый',
  'синий',
  'красный',
  'серый',
  'черный',
  'розовый',
  'голубой',
  'зеленый',
]

function baseModelKey(title: string): string {
  let key = title
    .toLowerCase()
    .replace(/\([^)]*\)\s*$/, '')
    .trim()
  for (const color of COLOR_WORDS) {
    key = key.replace(new RegExp(`\\b${color}\\b`, 'g'), '')
  }
  return key.replace(/\s+/g, ' ').trim()
}

function dedupeByBaseModel<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    const key = baseModelKey(item.title)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// One combined "newest across all 6 categories" query doesn't work — a single
// recent import batch in one category (e.g. a run of Audio radios) fills the
// entire result window and crowds every other category out before dedup even
// sees them. Fetching each category separately guarantees every category in
// the list actually gets a shot at the homepage, then interleaving keeps the
// slider from clumping same-category cards together.
const homeProducts = ref<Product[]>([])
const homeLoading = ref(true)

function interleave<T>(groups: T[][]): T[] {
  const result: T[] = []
  const maxLen = Math.max(0, ...groups.map((g) => g.length))
  for (let i = 0; i < maxLen; i++) {
    for (const group of groups) {
      if (group[i]) result.push(group[i])
    }
  }
  return result
}

async function fetchSeasonalProducts() {
  homeLoading.value = true
  try {
    const groups = await Promise.all(
      HOME_CATEGORY_SLUGS.map(async (slug) => {
        try {
          const res = await $fetch<{ data: Product[] }>(`${config.public.apiBase}/api/products/`, {
            query: { categorySlug: slug, priceMax: HOME_PRICE_CEILING, inStock: true, limit: 40 },
          })
          // Top picks per category: recognized brand first, then biggest
          // discount as the tiebreaker — a real markdown is a concrete reason
          // to feature that listing today, not just "it's in stock".
          return dedupeByBaseModel(res.data.filter((p) => !isAccessoryNoise(p.title)))
            .sort((a, b) => {
              const brandDiff =
                Number(isRecognizedBrand(b.brand)) - Number(isRecognizedBrand(a.brand))
              if (brandDiff !== 0) return brandDiff
              return (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0)
            })
            .slice(0, HOME_PER_CATEGORY)
        } catch {
          return []
        }
      }),
    )
    // Shuffled category order each load, then round-robin interleaved — with
    // 17 categories in the mix, that guarantees no two adjacent cards share a
    // category, and the mix looks different on every visit rather than always
    // starting with the same one.
    homeProducts.value = interleave(shuffle(groups.filter((g) => g.length > 0)))
  } finally {
    homeLoading.value = false
  }
}

// A local, homepage-only count — deliberately NOT productsStore.fetchProducts().
// That call fills the *shared* products store, and other places (product page
// "often bought together", search overlay "trending now") only fetch their own
// list when that shared store is still empty. A homepage limit:1 call was
// leaving exactly one product sitting there, so every other page silently
// reused that same single item instead of fetching its own.
const catalogTotal = ref(0)

onMounted(() => {
  mounted.value = true
  $fetch<{ meta: { total: number } }>(`${config.public.apiBase}/api/products/`, {
    query: { limit: 1 },
  })
    .then((res) => {
      catalogTotal.value = res.meta.total
    })
    .catch(() => {})
  fetchSeasonalProducts()
  categoriesStore.fetchCategories()
})

const FALLBACK_MAIN: BannerDto[] = [
  {
    id: 1,
    title: 'Beats Studio Pro',
    description: 'Преміальний звук та активне шумоподавлення. Бездротова свобода до 40 годин.',
    mediaUrl: '/banners/headphone.png',
    mediaType: 'image',
    linkUrl: '/catalog',
    buttonText: null,
    gradient: null,
    sortOrder: 1,
  },
]

const FALLBACK_SPECIAL_1: BannerDto = {
  id: -1,
  title: 'Навушники тижня',
  description:
    'Бездротовий звук преміум-класу з активним шумоподавленням та до 40 годин автономності.',
  mediaUrl: '/banners/test-headphones.png',
  mediaType: 'image',
  linkUrl: '/catalog',
  buttonText: null,
  gradient: null,
  sortOrder: 0,
}

const FALLBACK_SPECIAL_2: BannerDto = {
  ...FALLBACK_SPECIAL_1,
  id: -2,
  title: 'Хіт сезону',
  description:
    'Найпопулярніша модель серед наших покупців. Обмежена кількість за спеціальною ціною.',
}

const FALLBACK_PROMO = [
  {
    id: 1,
    gradient: 'linear-gradient(135deg, rgb(79 70 229) 0%, rgb(55 48 163) 100%)',
    title: 'до -40%',
    subtitle: 'на смартфони та планшети',
    linkUrl: null as string | null,
  },
  {
    id: 2,
    gradient: 'linear-gradient(135deg, rgb(30 41 59) 0%, rgb(15 23 42) 100%)',
    title: 'до -35%',
    subtitle: 'на ноутбуки та техніку',
    linkUrl: null as string | null,
  },
  {
    id: 3,
    gradient: 'linear-gradient(135deg, rgb(6 182 212) 0%, rgb(8 145 178) 100%)',
    title: 'до -25%',
    subtitle: 'на аудіо та аксесуари',
    linkUrl: null as string | null,
  },
]

const heroSlides = computed<SliderItem[]>(() => {
  const fromApi = bannersData.value?.data?.main_banner ?? []
  if (!fromApi.length) return FALLBACK_MAIN as unknown as SliderItem[]

  return fromApi.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    mediaUrl: b.media_url,
    mediaType: b.media_type,
    linkUrl: b.link_url,
  })) as unknown as SliderItem[]
})

// SpecialBanner has no `description` column on the backend — real data always
// renders without one, only the fallback placeholder has that extra text.
function mapSpecialBanner(
  dto: SpecialBannerApiDto | null | undefined,
  fallback: BannerDto,
): BannerDto {
  if (!dto) return fallback
  return {
    ...fallback,
    title: dto.title,
    description: null,
    mediaUrl: dto.image_url,
    linkUrl: dto.link_url,
  }
}

const special1 = computed(() =>
  mapSpecialBanner(bannersData.value?.data?.special_banners?.special_1, FALLBACK_SPECIAL_1),
)
const special2 = computed(() =>
  mapSpecialBanner(bannersData.value?.data?.special_banners?.special_2, FALLBACK_SPECIAL_2),
)
const promoBanners = computed(() => {
  const fromApi = bannersData.value?.data?.promo_tiles ?? []
  if (!fromApi.length) return FALLBACK_PROMO

  return fromApi.map((t, i) => ({
    id: i + 1,
    // Unused by PromoBannerCard (tag/colour come from position, not data) —
    // kept only because the prop type still requires a string.
    gradient: '',
    title: t.title,
    subtitle: t.subtitle,
    linkUrl: t.link_url,
  }))
})

const featuredProducts = computed(() => homeProducts.value.slice(0, 12))
const newProducts = computed(() => homeProducts.value.slice(12, 20))
// Matches productBreakpoints' max slidesPerView (6) below, so the loading
// grid never shows fewer cards than the real slider settles into.
const skeletons = Array.from({ length: 6 })

const productBreakpoints = {
  0: { slidesPerView: 1.5 },
  768: { slidesPerView: 3 },
  1024: { slidesPerView: 4 },
  1280: { slidesPerView: 6 },
}

const TILE_SHAPES = ['vertical', 'horizontal', 'square', 'square', 'horizontal'] as const
const TILE_SHAPES_DESKTOP = ['vertical', 'horizontal', 'square', 'square', 'vertical'] as const

const promoTiles = computed(() => {
  const tiles = (bannersData.value?.data?.hot_tiles ?? []).map((t, i) => ({
    id: i + 1,
    label: t.label,
    description: null as string | null,
    buttonText: 'Детальніше',
    // Unused by PromoImageTile visually — kept only because the prop type
    // still requires a string.
    gradient: '',
    to: t.link_url || '/catalog',
    image: t.image_url,
  }))

  const showShapes = mounted.value && isXl.value
  const shapes = mounted.value && isDesktop.value ? TILE_SHAPES_DESKTOP : TILE_SHAPES

  return tiles.map((tile, i) => ({
    ...tile,
    shape: showShapes ? (shapes[i] ?? 'square') : 'square',
  }))
})
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="py-13">
      <div class="container">
        <AppSlider
          :slides="heroSlides"
          :loop="true"
          swiper-class="swiper-nav-image"
        >
          <template #default="slotProps">
            <HeroBanner
              v-if="slotProps?.slide"
              :title="(slotProps.slide?.title as string | null) ?? ''"
              :description="(slotProps.slide?.description as string | null) ?? null"
              :media-url="(slotProps.slide?.mediaUrl as string | null) ?? ''"
              :media-type="(slotProps.slide?.mediaType as 'image' | 'video' | null) ?? 'image'"
              :link-url="(slotProps.slide?.linkUrl as string | null) ?? null"
              :title-tag="slotProps.index === 0 ? 'h1' : 'h2'"
            />
          </template>
        </AppSlider>
      </div>
    </section>

    <!-- Trust strip -->
    <section class="home__trust-section">
      <div class="container">
        <ul class="home__trust">
          <li
            v-for="badge in TRUST_BADGES"
            :key="badge.label"
            class="home__trust-item"
          >
            <component
              :is="badge.icon"
              :size="20"
              class="home__trust-icon"
            />
            <span>{{ badge.label }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Category Ribbon -->
    <section class="py-13">
      <div class="container">
        <CategoryRibbon />
      </div>
    </section>

    <!-- Promo banners -->
    <section class="py-13">
      <div class="container">
        <div class="home__promo-header">
          <h2 class="home__promo-title">Акції</h2>
          <NuxtLink
            to="/promo"
            class="home__promo-link"
          >
            Всі акції ({{ promoBanners.length }})
          </NuxtLink>
        </div>

        <PromoBannerList
          :banners="promoBanners"
          class="home__promo-list"
        />
      </div>
    </section>

    <!-- All products -->
    <section class="py-13">
      <div class="container">
        <div
          v-if="homeLoading"
          class="home__skeleton-row"
        >
          <TheProductCard
            v-for="(_, i) in skeletons"
            :key="i"
            :loading="true"
          />
        </div>
        <AppSlider
          v-else
          :slides="featuredProducts"
          :space-between="CARD_GAP"
          :breakpoints="productBreakpoints"
          :peek="true"
          title="Всі товари"
          link-label="Дивитись усі"
          link-to="/catalog"
          :link-count="catalogTotal"
        >
          <template #default="slotProps">
            <TheProductCard
              v-if="slotProps?.slide"
              :image-desktop-w="330"
              :image-desktop-h="250"
              :product="slotProps.slide as any"
            />
          </template>
        </AppSlider>
      </div>
    </section>

    <!-- Promo image tiles -->
    <section class="py-13">
      <div class="container">
        <div class="home__tiles-header">
          <h2 class="home__tiles-title">Гарячі пропозиції</h2>
        </div>
        <div
          v-if="homeLoading"
          class="home__tiles-grid"
        >
          <AppSkeleton
            v-for="n in 5"
            :key="n"
            height="100%"
            border-radius="12px"
            class="home__tile-skeleton"
          />
        </div>
        <div
          v-else
          class="home__tiles-grid"
        >
          <PromoImageTile
            v-for="tile in promoTiles"
            :key="tile.id"
            :image="tile.image"
            :label="tile.label"
            :description="tile.description"
            :link-label="tile.buttonText"
            :gradient="tile.gradient"
            :to="tile.to"
            :shape="tile.shape"
          />
        </div>
      </div>
    </section>

    <!-- Banner special_1 -->
    <section
      v-if="special1"
      class="py-13"
    >
      <div class="container">
        <SpecialBanner
          :title="special1.title"
          :description="special1.description ?? undefined"
          :image-url="special1.mediaUrl ?? ''"
          :link-url="special1.linkUrl"
        />
      </div>
    </section>

    <!-- New products -->
    <section class="py-13">
      <div class="container">
        <div
          v-if="homeLoading"
          class="home__skeleton-row"
        >
          <TheProductCard
            v-for="(_, i) in skeletons"
            :key="i"
            :loading="true"
          />
        </div>
        <AppSlider
          v-else
          :slides="newProducts"
          :space-between="CARD_GAP"
          :breakpoints="productBreakpoints"
          :peek="true"
          title="Новинки"
        >
          <template #default="slotProps">
            <TheProductCard
              v-if="slotProps?.slide"
              :image-desktop-w="330"
              :image-desktop-h="250"
              :product="slotProps.slide as any"
            />
          </template>
        </AppSlider>
      </div>
    </section>

    <!-- Banner special_2 -->
    <section
      v-if="special2"
      class="py-13"
    >
      <div class="container">
        <SpecialBanner
          :title="special2.title"
          :description="special2.description ?? undefined"
          :image-url="special2.mediaUrl ?? ''"
          :link-url="special2.linkUrl"
          :reverse="true"
        />
      </div>
    </section>

    <!-- SEO text -->
    <section class="py-13">
      <div class="container">
        <HomeSeoText />
      </div>
    </section>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.swiper:not(.swiper-initialized) .swiper-wrapper {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  border: 3px solid red;
}

.swiper:not(.swiper-initialized) .swiper-slide {
  flex-shrink: 0;
  width: 85%;
}
.home {
  --swiper-navigation-top-offset: calc(50% - 20px);

  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;

  &__trust-section {
    padding-block: 16px;
    border-block: 1px solid $color-gray-100;
  }

  &__trust {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px 32px;
    list-style: none;
  }

  &__trust-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
    white-space: nowrap;
  }

  &__trust-icon {
    flex-shrink: 0;
    color: $color-primary;
  }

  &__promo-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__promo-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-heading;
  }

  &__promo-link {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-primary-dark;
    transition: color $transition-fast;

    &:hover {
      color: $color-primary-light;
    }
  }

  &__tiles-header {
    margin-bottom: 12px;
  }

  &__tiles-title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-heading;

    @include mixins.respond-to(tablet) {
      font-size: $font-size-2xl;
    }
  }

  &__tiles-grid {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-block: 20px;
    margin-block: -20px;

    &::-webkit-scrollbar {
      display: none;
    }

    @include mixins.respond-to(laptop) {
      display: grid;
      overflow: visible;
      grid-template-columns: 1.6fr 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 12px;

      /* > * {
        flex: initial;
        height: auto;
      }

      > *:nth-child(1) {
        grid-column: 1;
        grid-row: 1 / 3;
      }

      > *:nth-child(2) {
        grid-column: 2 / 4;
        grid-row: 1;
      }

      > *:nth-child(3) {
        grid-column: 4;
        grid-row: 1;
      }

      > *:nth-child(4) {
        grid-column: 2;
        grid-row: 2;
      }

      > *:nth-child(5) {
        grid-column: 3 / 5;
        grid-row: 2;
      } */
    }

    @include mixins.respond-to(desktop) {
      > *:nth-child(2) {
        grid-column: 2 / 4;
        grid-row: 1;
      }

      > *:nth-child(3) {
        grid-column: 3;
        grid-row: 2;
      }

      > *:nth-child(4) {
        grid-column: 2;
        grid-row: 2;
      }

      > *:nth-child(5) {
        grid-column: 4;
        grid-row: 1 / 3;
      }
    }
  }

  // Column counts mirror productBreakpoints' slidesPerView above (0/768/1024/1280)
  // so the loading grid lines up with what the real slider settles into.
  &__skeleton-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    @include mixins.respond-to(tablet) {
      grid-template-columns: repeat(3, 1fr);
    }
    @include mixins.respond-to(notebook) {
      grid-template-columns: repeat(4, 1fr);
    }
    @include mixins.respond-to(laptop) {
      grid-template-columns: repeat(6, 1fr);
    }
  }
}
</style>

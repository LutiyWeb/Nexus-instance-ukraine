<script setup lang="ts">
import { Star, Package, Shield, Truck } from 'lucide-vue-next'
import type { Product } from '~/types/product'

const route = useRoute()
const cartStore = useCartStore()
const wishlistsStore = useWishlistsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const config = useRuntimeConfig()

const {
  data: productData,
  pending,
  error,
} = useAsyncData(
  () => `product-${route.params.id}`,
  () => $fetch<{ data: Product }>(`${config.public.apiBase}/api/products/${route.params.id}`),
)

const product = computed(() => productData.value?.data ?? null)
const loading = computed(() => pending.value)

useSeoMeta({
  title: () => (product.value ? `${product.value.title} — Nexus Commerce` : 'Товар'),
  description: () => product.value?.description ?? '',
  ogTitle: () => product.value?.title ?? '',
  ogDescription: () => product.value?.description ?? '',
  ogImage: () => product.value?.thumbnail ?? '',
})

const allImages = computed(() => {
  const p = product.value
  if (!p) return []
  return [p.thumbnail, ...p.images].filter(Boolean) as string[]
})

const isFav = computed(() => (product.value ? wishlistsStore.has(product.value.id) : false))

const originalPrice = computed(() => {
  const p = product.value
  if (!p?.price || !p.discountPercentage) return null
  return Math.round(p.price / (1 - p.discountPercentage / 100))
})

// TODO: replace with real dynamic spec set once backend defines per-category fields
const quickSpecs = computed(() => [
  { label: 'Бренд', value: product.value?.brand ?? '—' },
  { label: 'Артикул', value: product.value?.sku ?? '—' },
  { label: 'Рейтинг', value: product.value?.rating ? String(product.value.rating) : '—' },
])

const mockSpecs = computed(() => [
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
            to: product?.categorySlug
              ? `/catalog?categorySlug=${product.categorySlug}`
              : '/catalog',
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
            :to="`/catalog?categorySlug=${product.categorySlug}`"
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

          <p class="product-detail__desc">{{ product.description }}</p>

          <!-- Purchase: price + availability + favorite/qty/buy -->
          <ProductPurchasePanel
            :product="product"
            :original-price="originalPrice"
            :is-fav="isFav"
            :is-out-of-stock="isOutOfStock"
            @add-to-cart="onAddToCart"
            @toggle-fav="toggleFav"
            @notify="notifyWhenAvailable"
          />

          <!-- Perks -->
          <div class="product-detail__perks">
            <div class="product-detail__perk">
              <Truck :size="16" />
              <span>Безкоштовна доставка від $50</span>
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
            <ProductSpecsTable
              v-if="activeTab === 'specs'"
              :specs="mockSpecs"
            />

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

    @include mixins.respond-to(md) {
      grid-template-columns: 1fr 1fr;
      gap: 32px;
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

    @include mixins.respond-to(2xl) {
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

  &__desc {
    color: $color-gray-600;
    line-height: $line-height-relaxed;
    margin-bottom: 20px;
    font-size: $font-size-sm;
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

  //info
  &__content {
    @include mixins.respond-to(xl) {
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

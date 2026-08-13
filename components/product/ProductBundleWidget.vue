<script setup lang="ts">
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-vue-next'
import type { Product } from '~/types/product'

// The accessory-per-category grouping is real (see BUNDLE_ACCESSORY_CATEGORIES
// in pages/product/[id].vue). The bundle discount is still a hardcoded 10%,
// applied only visually — "Купити комплект" does not add a discounted pair to
// the cart, see handleBuyBundle(). Tiles are a standalone implementation, not
// the Акції promo card component.
interface AccessoryGroup {
  slug: string
  name: string
  products: Product[]
}
interface Props {
  product: Product
  groups: AccessoryGroup[]
}
const props = defineProps<Props>()

const toastStore = useToastStore()

const BUNDLE_DISCOUNT_PERCENT = 10

const activeTabIndex = ref(0)
const accessoryIndex = ref(0)

const activeGroup = computed(() => props.groups[activeTabIndex.value] ?? props.groups[0] ?? null)
const accessories = computed(() => activeGroup.value?.products ?? [])
const selectedAccessory = computed(() => accessories.value[accessoryIndex.value] ?? null)

watch(activeGroup, () => {
  accessoryIndex.value = 0
})

function prevAccessory() {
  const len = accessories.value.length
  accessoryIndex.value = (accessoryIndex.value - 1 + len) % len
}
function nextAccessory() {
  accessoryIndex.value = (accessoryIndex.value + 1) % accessories.value.length
}

const accessoryDiscountedPrice = computed(() => {
  const price = selectedAccessory.value?.price ?? 0
  return Math.round(price * (1 - BUNDLE_DISCOUNT_PERCENT / 100))
})
const sumOriginal = computed(
  () => (props.product.price ?? 0) + (selectedAccessory.value?.price ?? 0),
)
const sumFinal = computed(() => (props.product.price ?? 0) + accessoryDiscountedPrice.value)
const savings = computed(() => sumOriginal.value - sumFinal.value)

function handleBuyBundle() {
  toastStore.add(
    'Це UI-прототип — для реального додавання комплекту в кошик потрібна логіка бекенду (знижка на пару товарів)',
    'warning',
  )
}
</script>

<template>
  <div
    v-if="selectedAccessory"
    class="bundle-widget"
  >
    <h2 class="bundle-widget__title">Вигідний комплект</h2>

    <div
      v-if="groups.length > 1"
      class="bundle-widget__tabs"
    >
      <button
        v-for="(group, i) in groups"
        :key="group.slug"
        :class="['bundle-widget__tab', { 'bundle-widget__tab--active': i === activeTabIndex }]"
        type="button"
        @click="activeTabIndex = i"
      >
        {{ group.name }}
      </button>
    </div>

    <div class="bundle-widget__row">
      <!-- Main product tile -->
      <div class="bundle-widget__tile">
        <div class="bundle-widget__tile-media">
          <AppImage
            v-if="product.thumbnail"
            :src="product.thumbnail"
            :alt="product.title"
            fit="inside"
            img-class="bundle-widget__tile-img"
            :sizes="{ desktop: { w: 300, h: 300 } }"
          />
        </div>

        <div class="bundle-widget__tile-info">
          <h3 class="bundle-widget__tile-title">{{ product.title }}</h3>
          <p class="bundle-widget__tile-price">{{ product.price }} ₴</p>
        </div>

        <AppHexPattern
          variant="scatter"
          class="bundle-widget__tile-hex"
        />
      </div>

      <span class="bundle-widget__connector">+</span>

      <!-- Accessory tile -->
      <div class="bundle-widget__tile">
        <div class="bundle-widget__tile-media">
          <span class="bundle-widget__tile-badge">-{{ BUNDLE_DISCOUNT_PERCENT }}%</span>
          <AppImage
            v-if="selectedAccessory.thumbnail"
            :src="selectedAccessory.thumbnail"
            :alt="selectedAccessory.title"
            fit="inside"
            img-class="bundle-widget__tile-img"
            :sizes="{ desktop: { w: 300, h: 300 } }"
          />
        </div>

        <div class="bundle-widget__tile-info">
          <h3 class="bundle-widget__tile-title">
            <NuxtLink
              :to="`/product/${selectedAccessory.id}`"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ selectedAccessory.title }}
            </NuxtLink>
          </h3>
          <p class="bundle-widget__tile-price">
            <span class="bundle-widget__tile-price-old">{{ selectedAccessory.price }} ₴</span>
            {{ accessoryDiscountedPrice }} ₴
          </p>
        </div>

        <AppHexPattern
          variant="cluster"
          class="bundle-widget__tile-hex"
        />

        <div
          v-if="accessories.length > 1"
          class="bundle-widget__nav"
        >
          <button
            type="button"
            class="bundle-widget__nav-btn"
            @click="prevAccessory"
          >
            <ChevronLeft :size="18" />
          </button>
          <span class="bundle-widget__counter"
            >{{ accessoryIndex + 1 }}/{{ accessories.length }}</span
          >
          <button
            type="button"
            class="bundle-widget__nav-btn"
            @click="nextAccessory"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </div>

    <div class="bundle-widget__footer">
      <button
        type="button"
        class="bundle-widget__cta"
        @click="handleBuyBundle"
      >
        <ShoppingCart :size="16" />
        Купити комплект
      </button>

      <div class="bundle-widget__total">
        <div class="bundle-widget__total-row">
          <span class="bundle-widget__total-old">{{ sumOriginal }} ₴</span>
          <span class="bundle-widget__total-save">−{{ savings }} ₴</span>
        </div>
        <span class="bundle-widget__total-final">{{ sumFinal }} ₴</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.bundle-widget {
  border: 1px solid $color-gray-200;
  border-radius: $radius-xl;
  padding: 20px;

  @include mixins.respond-to(tablet) {
    padding: 24px;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-heading;
    margin: 0 0 14px;
  }

  &__tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 4px;
    margin-bottom: 16px;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__tab {
    flex-shrink: 0;
    padding: 6px 14px;
    border-radius: $radius-full;
    border: 1px solid $color-gray-200;
    background: $color-white;
    color: $color-gray-600;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background $transition-fast,
      color $transition-fast,
      border-color $transition-fast;

    &:hover:not(&--active) {
      border-color: $color-primary;
      color: $color-primary;
    }

    &--active {
      background: $color-primary;
      border-color: $color-primary;
      color: $color-white;

      &:hover {
        background: $color-primary-dark;
      }
    }
  }

  &__row {
    display: flex;
    align-items: stretch;
    gap: 12px;
    flex-wrap: wrap;
    padding-bottom: 20px;
    margin-bottom: 20px;
    border-bottom: 1px solid $color-gray-100;
  }

  &__tile {
    position: relative;
    z-index: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1 1 260px;
    min-width: 0;
    padding: 12px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  &__tile-media {
    position: relative;
    flex-shrink: 0;
    width: 120px;
    height: 120px;
    border-radius: $radius-md;
    overflow: hidden;

    @include mixins.respond-to(tablet) {
      width: 200px;
      height: 200px;
    }
  }

  .bundle-widget__tile-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__tile-badge {
    position: absolute;
    z-index: 1;
    top: 2px;
    left: 2px;
    background: $color-primary;
    color: $color-white;
    font-size: 10px;
    font-weight: $font-weight-bold;
    padding: 2px 6px;
    border-radius: $radius-sm;
  }

  &__tile-info {
    position: relative;
    z-index: 1;
    min-width: 0;
    flex: 1 1 auto;

    @include mixins.respond-to(laptop) {
      max-width: 50%;
    }
  }

  &__tile-title {
    margin: 0 0 4px;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-heading;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    a {
      color: inherit;
      text-decoration: none;
      transition: color $transition-fast;

      &:hover {
        color: $color-primary;
        text-decoration: underline;
      }
    }
  }

  &__tile-price {
    margin: 0;
    font-size: $font-size-base;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  &__tile-price-old {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-400;
    text-decoration: line-through;
  }

  .bundle-widget__tile-hex {
    display: none;

    @include mixins.respond-to(laptop) {
      display: block;
      position: absolute;
      z-index: 0;
      top: -25%;
      right: -12%;
      width: 220px;
      height: auto;
      opacity: 0.5;
      pointer-events: none;
    }
  }

  &__nav {
    position: absolute;
    z-index: 1;
    right: 12px;
    bottom: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: $radius-full;
    border: 1px solid $color-gray-200;
    background: $color-white;
    color: $color-gray-600;
    cursor: pointer;
    transition:
      border-color $transition-fast,
      color $transition-fast;

    &:hover {
      border-color: $color-primary;
      color: $color-primary;
    }
  }

  &__counter {
    font-size: $font-size-xs;
    color: $color-gray-400;
  }

  &__connector {
    flex: 0 0 100%;
    text-align: center;
    color: $color-gray-400;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;

    @include mixins.respond-to(tablet) {
      flex: 0 0 auto;
      align-self: center;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__total {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;

    @include mixins.respond-to(tablet) {
      flex-direction: row;
      align-items: baseline;
      gap: 10px;
    }
  }

  &__total-row {
    display: flex;
    align-items: baseline;
    gap: 6px;

    @include mixins.respond-to(tablet) {
      display: contents;
    }
  }

  &__total-old {
    font-size: $font-size-xs;
    color: $color-gray-400;
    text-decoration: line-through;

    @include mixins.respond-to(tablet) {
      font-size: $font-size-sm;
    }
  }

  &__total-save {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-success;

    @include mixins.respond-to(tablet) {
      font-size: $font-size-sm;
    }
  }

  &__total-final {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-primary-dark;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-shrink: 0;
    padding: 12px 28px;
    border: none;
    border-radius: $radius-md;
    background: $color-primary;
    color: $color-white;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-primary-dark;
    }
  }
}
</style>

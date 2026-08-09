<script setup lang="ts">
import { Heart, ShoppingCart, Mail } from 'lucide-vue-next'
import type { Product } from '~/types/product'

interface Props {
  product?: Product
  loading?: boolean
}
withDefaults(defineProps<Props>(), { loading: false })

const NuxtLink = resolveComponent('NuxtLink')

const cartStore = useCartStore()
const wishlistsStore = useWishlistsStore()
const toastStore = useToastStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()

const notifyModalOpen = ref(false)

const isOutOfStock = (product: Product) => product.stock === 0

function getHoverImage(product: Product): string | null {
  if (!product.images?.length) return null
  return product.images.find((img) => img !== product.thumbnail) ?? null
}

function handleCartClick(product: Product) {
  cartStore.add(product)
  toastStore.add('Товар додано до кошика', 'success', { label: 'Перейти в кошик', to: '/cart' })
}

function handleFavClick(product: Product) {
  wishlistsStore.toggle(product.id)
}

async function handleNotifyClick(e: Event, product: Product) {
  e.preventDefault()

  const userEmail = authStore.user?.email
  if (!userEmail) {
    notifyModalOpen.value = true
    return
  }

  try {
    await $fetch(`${config.public.apiBase}/api/products/${product.id}/notify-stock`, {
      method: 'POST',
      body: { email: userEmail },
    })
    toastStore.add("Ми повідомимо вас, коли товар з'явиться в наявності", 'success')
  } catch {
    toastStore.add('Не вдалося зберегти запит, спробуйте ще раз', 'error')
  }
}
</script>

<template>
  <component
    :is="!loading && product ? NuxtLink : 'article'"
    v-bind="
      !loading && product
        ? { to: isOutOfStock(product) ? `/product/${product.id}?oos=1` : `/product/${product.id}` }
        : {}
    "
    :class="['image-card', { 'image-card--loading': loading }]"
  >
    <!-- Shimmer -->
    <div
      v-if="loading"
      class="image-card__shimmer"
    />

    <template v-else-if="product">
      <!-- Product image -->
      <AppImage
        v-if="product.thumbnail"
        :src="product.thumbnail"
        :alt="product.title"
        :img-class="
          ['image-card__img', isOutOfStock(product) && 'image-card__img--oos']
            .filter(Boolean)
            .join(' ')
        "
        :sizes="{ desktop: { w: 300, h: 300 } }"
      />

      <!-- Hover image swap -->
      <div
        v-if="getHoverImage(product) && !isOutOfStock(product)"
        class="image-card__hover-img"
        :style="{ backgroundImage: `url(${getHoverImage(product)})` }"
      />

      <!-- Out of stock overlay -->
      <div
        v-if="isOutOfStock(product)"
        class="image-card__oos-overlay"
      >
        <span class="image-card__oos-badge">Немає в наявності</span>
      </div>

      <!-- Labels -->
      <div
        v-if="product.labels?.length"
        class="image-card__labels"
      >
        <span
          v-for="label in product.labels"
          :key="label"
          :class="['image-card__label', `image-card__label--${label}`]"
        >
          {{ { new: 'Новинка', sale: 'Акція', hit: 'Хіт' }[label] ?? label }}
        </span>
      </div>

      <!-- Fav button — always visible -->
      <button
        :class="['image-card__fav', { 'image-card__fav--active': wishlistsStore.has(product.id) }]"
        type="button"
        @click.prevent="handleFavClick(product)"
      >
        <Heart
          :size="14"
          :fill="wishlistsStore.has(product.id) ? 'currentColor' : 'none'"
        />
      </button>

      <!-- Info panel — slides up on hover -->
      <div class="image-card__info">
        <span
          v-if="product.category"
          class="image-card__category"
          >{{ product.category }}</span
        >
        <h3 class="image-card__title">{{ product.title }}</h3>
        <div class="image-card__price-row">
          <span
            :class="[
              'image-card__price',
              { 'image-card__price--discounted': product.compareAtPrice },
            ]"
          >
            ${{ product.price }}
          </span>
          <span
            v-if="product.compareAtPrice"
            class="image-card__compare"
          >
            ${{ product.compareAtPrice }}
          </span>
        </div>
        <button
          v-if="!isOutOfStock(product)"
          class="image-card__cart"
          type="button"
          @click.prevent="handleCartClick(product)"
        >
          <ShoppingCart :size="14" />
          Додати до кошика
        </button>
        <button
          v-else
          class="image-card__notify"
          type="button"
          title="Повідомити про наявність"
          aria-label="Повідомити про наявність"
          @click="handleNotifyClick($event, product)"
        >
          <Mail :size="14" />
          Повідомити про наявність
        </button>
      </div>
    </template>

    <NotifyStockModal
      v-if="product"
      v-model:open="notifyModalOpen"
      :product-id="product.id"
    />
  </component>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.image-card {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-height: 200px;
  border-radius: $radius-xl;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  background: $color-gray-100;
  box-shadow: $shadow-card;
  transition:
    box-shadow $transition-base,
    transform $transition-base;

  &:hover {
    box-shadow: $shadow-card-hover;
    transform: translateY(-3px);
  }

  &__shimmer {
    position: absolute;
    inset: 0;
    @include mixins.shimmer;
  }

  .image-card__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform $transition-slow;

    &--oos {
      filter: grayscale(60%);
    }
  }

  &:hover .image-card__img {
    transform: scale(1.05);
  }

  &__hover-img {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0;
    transform: scale(1.05);
    transition:
      opacity 0.5s ease,
      transform 0.5s ease;
    z-index: 1;
  }

  &:hover &__hover-img {
    opacity: 1;
    transform: scale(1);
  }

  &__oos-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 28%);
    z-index: 1;
  }

  &__oos-badge {
    padding: 6px 14px;
    background: $color-white;
    color: $color-gray-700;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;
    letter-spacing: 0.03em;
  }

  &__labels {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 3;
  }

  &__label {
    display: inline-block;
    padding: 3px 8px;
    border-radius: $radius-sm;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    letter-spacing: 0.03em;
    background: $color-white;
    color: $color-gray-700;

    &--new {
      background: #dbeafe;
      color: #2563eb;
    }
    &--sale {
      background: #fee2e2;
      color: #c0392b;
    }
    &--hit {
      background: #fef3c7;
      color: #b45309;
    }
  }

  &__fav {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 30px;
    height: 30px;
    border-radius: $radius-full;
    background: $color-white;
    border: 1px solid $color-gray-100;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $color-gray-400;
    z-index: 3;
    transition:
      color $transition-fast,
      border-color $transition-fast;
    box-shadow: 0 1px 4px rgb(0 0 0 / 10%);

    &:hover {
      color: $color-danger;
      border-color: $color-danger;
    }
    &--active {
      color: $color-danger;
      border-color: rgb(239 68 68 / 30%);
    }
  }

  &__info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    padding: 16px;
    background: $color-white;
    border-radius: 0 0 $radius-xl $radius-xl;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transform: translateY(calc(100% + 2px));
    transition: transform $transition-base;
  }

  &:hover &__info {
    transform: translateY(0);
  }

  &__category {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-primary;
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__price-row {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  &__price {
    font-size: $font-size-base;
    font-weight: $font-weight-bold;
    color: $color-gray-900;

    &--discounted {
      color: $color-primary;
    }
  }

  &__compare {
    font-size: $font-size-sm;
    color: $color-gray-400;
    text-decoration: line-through;
  }

  &__cart {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 8px;
    margin-top: 4px;
    background: $color-primary;
    color: $color-white;
    border: none;
    border-radius: $radius-md;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-primary-dark;
    }
  }

  &__notify {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 8px;
    margin-top: 4px;
    background: $color-gray-200;
    color: $color-gray-700;
    border: none;
    border-radius: $radius-md;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-gray-300;
    }
  }
}
</style>

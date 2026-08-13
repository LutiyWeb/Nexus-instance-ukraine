<script setup lang="ts">
import { Heart, ShoppingCart, Check, Minus, Plus } from 'lucide-vue-next'
import type { Product } from '~/types/product'

interface Props {
  product: Product
  originalPrice: number | null
  isFav: boolean
  isOutOfStock: boolean
  isInCart: boolean
  cartQty: number
}

interface Emits {
  addToCart: [qty: number]
  toggleFav: []
  notify: []
  updateCartQty: [delta: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { clamp: clampToStock } = useStockLimit()

// Before the item is in the cart, quantity is a local draft used only for the
// initial "add to cart" click. Once it's in the cart, the same stepper reads
// and writes the real cart quantity instead (see displayQty/applyQty below).
const qty = ref(1)

const displayQty = computed(() => (props.isInCart ? props.cartQty : qty.value))
const isAtStockLimit = computed(() => displayQty.value >= props.product.stock)

function applyQty(value: number) {
  const clamped = clampToStock(value, props.product.stock)
  if (props.isInCart) {
    const delta = clamped - props.cartQty
    if (delta !== 0) emit('updateCartQty', delta)
  } else {
    qty.value = clamped
  }
}

function decrement() {
  if (props.isInCart) {
    if (props.cartQty > 1) emit('updateCartQty', -1)
  } else if (qty.value > 1) {
    qty.value--
  }
}
function increment() {
  if (isAtStockLimit.value) {
    clampToStock(displayQty.value + 1, props.product.stock)
    return
  }
  if (props.isInCart) emit('updateCartQty', 1)
  else qty.value++
}

const {
  editing: qtyEditing,
  draft: qtyDraft,
  inputRef: qtyInputRef,
  startEdit: startQtyEdit,
  commit: commitQty,
  cancel: cancelQty,
} = useEditableQty(
  () => displayQty.value,
  (v) => applyQty(v),
)

function handleAddToCart() {
  if (props.isInCart) return
  emit('addToCart', qty.value)
  qty.value = 1
}
</script>

<template>
  <div class="product-purchase">
    <div class="product-purchase__price-row">
      <span class="product-purchase__price">${{ product.price }}</span>
      <span
        v-if="originalPrice"
        class="product-purchase__price-original"
        >${{ originalPrice }}</span
      >
      <span
        v-if="product.discountPercentage"
        class="product-purchase__discount"
      >
        -{{ Math.round(product.discountPercentage) }}%
      </span>
    </div>

    <div
      v-if="isOutOfStock"
      class="product-purchase__oos-banner"
    >
      <span class="product-purchase__oos-label">Немає в наявності</span>
      <p class="product-purchase__oos-hint">Залиште заявку — ми повідомимо, коли товар з'явиться</p>
    </div>

    <div class="product-purchase__controls">
      <button
        :class="['product-purchase__fav-btn', { 'product-purchase__fav-btn--active': isFav }]"
        type="button"
        :title="isFav ? 'Прибрати з обраного' : 'До обраного'"
        @click="emit('toggleFav')"
      >
        <Heart
          :size="18"
          :fill="isFav ? 'currentColor' : 'none'"
        />
      </button>

      <div
        v-if="!isOutOfStock"
        class="product-purchase__qty"
      >
        <button
          class="product-purchase__qty-btn"
          type="button"
          :disabled="isInCart ? cartQty <= 1 : qty <= 1"
          @click="decrement"
        >
          <Minus :size="14" />
        </button>
        <input
          v-if="qtyEditing"
          ref="qtyInputRef"
          v-model="qtyDraft"
          type="number"
          min="1"
          inputmode="numeric"
          class="product-purchase__qty-val product-purchase__qty-val--input"
          @blur="commitQty"
          @keydown.enter="commitQty"
          @keydown.escape="cancelQty"
        />
        <span
          v-else
          class="product-purchase__qty-val"
          @click="startQtyEdit"
          >{{ displayQty }}</span
        >
        <button
          class="product-purchase__qty-btn"
          type="button"
          :disabled="isAtStockLimit"
          @click="increment"
        >
          <Plus :size="14" />
        </button>
      </div>
    </div>

    <AppButton
      v-if="!isOutOfStock"
      :variant="isInCart ? 'success' : 'gradient'"
      size="xl"
      class="product-purchase__add-btn"
      @click="handleAddToCart"
    >
      <component
        :is="isInCart ? Check : ShoppingCart"
        :size="24"
      />
      {{ isInCart ? 'У кошику' : 'Додати до кошика' }}
    </AppButton>
    <AppButton
      v-else
      variant="outline"
      size="lg"
      class="product-purchase__notify-btn"
      @click="emit('notify')"
    >
      Повідомити про наявність
    </AppButton>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

// Reflowed via grid per breakpoint: price+controls share a row on mobile,
// price gets its own row on desktop with controls beside the buy button.
.product-purchase {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'price controls'
    'oos oos'
    'buy buy';
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;

  @include mixins.respond-to(tablet) {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'price price'
      'oos oos'
      'controls buy';
    align-items: stretch;
  }

  &__price-row {
    grid-area: price;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__price {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
  }

  &__price-original {
    font-size: $font-size-lg;
    color: $color-gray-400;
    text-decoration: line-through;
  }

  &__discount {
    background: $color-danger;
    color: $color-white;
    padding: 2px 8px;
    border-radius: $radius-sm;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
  }

  &__controls {
    grid-area: controls;
    display: flex;
    align-items: stretch;
    gap: 8px;
    justify-self: end;

    @include mixins.respond-to(tablet) {
      justify-self: start;
    }
  }

  &__fav-btn {
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    color: $color-gray-400;
    cursor: pointer;
    transition:
      background $transition-fast,
      color $transition-fast,
      border-color $transition-fast;

    @include mixins.respond-to(tablet) {
      height: auto;
    }

    &:hover {
      border-color: $color-danger;
      color: $color-danger;
    }
    &--active {
      border-color: $color-danger;
      color: $color-danger;
    }
  }

  &__qty {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    overflow: hidden;
  }

  &__qty-btn {
    width: 40px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $color-gray-600;
    transition:
      background $transition-fast,
      color $transition-fast;
    &:hover:not(:disabled) {
      background: $color-gray-100;
      color: $color-gray-900;
    }
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  &__qty-val {
    width: 40px;
    text-align: center;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    border-inline: 1px solid $color-gray-200;
    cursor: text;

    &--input {
      height: 100%;
      background: $color-white;
      border-block: none;
      outline: none;
      font-family: $font-family-base;

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        appearance: none;
        margin: 0;
      }
      appearance: textfield;
    }
  }

  // ".app-btn--gradient"/".app-btn--success" chained in so these layout
  // overrides out-specificity AppButton's own size/variant rules reliably —
  // both variants are covered since this button switches between them
  // (gradient when not in cart, success once added).
  &__add-btn.app-btn--gradient,
  &__add-btn.app-btn--success {
    grid-area: buy;
    white-space: nowrap;
    justify-content: center;
    min-width: 0;

    @include mixins.respond-to(tablet) {
      max-width: 250px;
      padding: 16px;
    }

    svg {
      flex-shrink: 0;
    }
  }

  &__oos-banner {
    grid-area: oos;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    background: $color-gray-50;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
  }

  &__oos-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-500;
  }

  &__oos-hint {
    font-size: $font-size-sm;
    color: $color-gray-400;
    margin: 0;
  }

  &__notify-btn {
    grid-area: buy;
    justify-content: center;

    @include mixins.respond-to(tablet) {
      justify-self: start;
      width: auto;
    }
  }
}
</style>

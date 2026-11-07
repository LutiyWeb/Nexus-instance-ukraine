<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import type { CartEntry } from '~/stores/cart'

const props = defineProps<{
  item: CartEntry
  selected: boolean
}>()

const emit = defineEmits<{
  'update:selected': [boolean]
  remove: [number]
  updateQty: [number, number]
}>()

function formatPrice(p: number) {
  return p.toLocaleString('uk-UA') + ' ₴'
}

const { clamp: clampToStock } = useStockLimit()

function increment() {
  if (props.item.qty >= props.item.product.stock) {
    clampToStock(props.item.qty + 1, props.item.product.stock)
    return
  }
  emit('updateQty', props.item.product.id, 1)
}

const {
  editing: qtyEditing,
  draft: qtyDraft,
  inputRef: qtyInputRef,
  startEdit: startQtyEdit,
  commit: commitQty,
  cancel: cancelQty,
} = useEditableQty(
  () => props.item.qty,
  (v) => {
    const clamped = clampToStock(v, props.item.product.stock)
    emit('updateQty', props.item.product.id, clamped - props.item.qty)
  },
)
</script>

<template>
  <div class="cart-item">
    <input
      type="checkbox"
      class="cart-item__check"
      :checked="selected"
      @change="emit('update:selected', ($event.target as HTMLInputElement).checked)"
    />

    <NuxtLink
      :to="`/product/${item.product.id}`"
      class="cart-item__img-link"
    >
      <img
        v-if="item.product.thumbnail"
        :src="item.product.thumbnail"
        :alt="item.product.title"
        class="cart-item__img"
      />
      <div
        v-else
        class="cart-item__img cart-item__img--placeholder"
      />
    </NuxtLink>

    <div class="cart-item__info">
      <NuxtLink
        :to="`/product/${item.product.id}`"
        class="cart-item__title"
      >
        {{ item.product.title }}
      </NuxtLink>
      <span class="cart-item__price">{{ formatPrice(item.product.price ?? 0) }}</span>
    </div>

    <div class="cart-item__qty">
      <button
        type="button"
        :disabled="item.qty <= 1"
        @click="emit('updateQty', item.product.id, -1)"
      >
        −
      </button>
      <input
        v-if="qtyEditing"
        ref="qtyInputRef"
        v-model="qtyDraft"
        type="number"
        min="1"
        inputmode="numeric"
        class="cart-item__qty-input"
        @blur="commitQty"
        @keydown.enter="commitQty"
        @keydown.escape="cancelQty"
      />
      <span
        v-else
        @click="startQtyEdit"
        >{{ item.qty }}</span
      >
      <button
        type="button"
        :disabled="item.qty >= item.product.stock"
        @click="increment"
      >
        +
      </button>
    </div>

    <button
      class="cart-item__remove"
      type="button"
      @click="emit('remove', item.product.id)"
    >
      <Trash2 :size="16" />
    </button>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.cart-item {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  grid-template-rows: auto auto;
  column-gap: 12px;
  row-gap: 6px;
  padding: 12px 0;
  border-bottom: 1px solid $color-gray-100;
  align-items: start;

  @include mixins.respond-to(tablet) {
    grid-template-columns: auto 64px 1fr auto auto;
    grid-template-rows: auto;
    align-items: center;
  }

  &__check {
    // Custom-drawn instead of the native checkbox: an unstyled input
    // renders with the browser's own accent, not the brand color, and
    // its checkmark can come out dark instead of white when it is styled.
    appearance: none;
    position: relative;
    grid-column: 1;
    grid-row: 1 / 3;
    align-self: center;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin: 0;
    border: 1.5px solid $color-gray-300;
    border-radius: $radius-sm;
    background: $color-white;
    cursor: pointer;
    transition:
      background $transition-fast,
      border-color $transition-fast;

    @include mixins.respond-to(tablet) {
      grid-row: 1;
    }

    &:checked {
      background: $color-primary;
      border-color: $color-primary;

      &::after {
        content: '';
        position: absolute;
        left: 4.5px;
        top: 2px;
        width: 4px;
        height: 8px;
        border: solid $color-white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
    }
  }

  &__img-link {
    grid-column: 2;
    grid-row: 1 / 3;
    display: block;
    border-radius: $radius-md;
    flex-shrink: 0;

    @include mixins.respond-to(tablet) {
      grid-row: 1;
    }
  }

  &__img {
    display: block;
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: $radius-md;

    &--placeholder {
      background: $color-gray-100;
    }

    @include mixins.respond-to(tablet) {
      width: 64px;
      height: 64px;
    }
  }

  &__info {
    grid-column: 3;
    grid-row: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    @include mixins.respond-to(tablet) {
      grid-column: 3;
    }
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-900;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      color: $color-primary;
    }
  }

  &__price {
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
  }

  &__qty {
    grid-column: 3 / 5;
    grid-row: 2;
    display: flex;
    align-items: center;
    gap: 8px;

    @include mixins.respond-to(tablet) {
      grid-column: 4;
      grid-row: 1;
    }

    button {
      width: 28px;
      height: 28px;
      background: $color-gray-100;
      border-radius: $radius-md;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background $transition-fast;

      &:hover:not(:disabled) {
        background: $color-gray-200;
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    }

    span {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      min-width: 20px;
      text-align: center;
      cursor: text;
    }

    &-input {
      width: 32px;
      min-width: 20px;
      text-align: center;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      font-family: $font-family-base;
      color: $color-gray-900;
      border: none;
      outline: none;
      background: transparent;

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        appearance: none;
        margin: 0;
      }
      appearance: textfield;
    }
  }

  &__remove {
    grid-column: 4;
    grid-row: 1;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: $radius-md;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background $transition-fast;

    @include mixins.respond-to(tablet) {
      grid-column: 5;
    }

    &:hover {
      background: rgb(239 68 68 / 10%);
    }
  }
}
</style>

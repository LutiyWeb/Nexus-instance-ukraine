<script setup lang="ts">
import { DELIVERY_METHOD_LABELS, type DeliveryMethod } from '~/contracts/delivery'

interface Props {
  modelValue: DeliveryMethod
}

defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [DeliveryMethod] }>()

/** Courier-to-door is intentionally last — warehouse pickup is the common case in UA. */
const options: { value: DeliveryMethod; hint: string }[] = [
  { value: 'np_branch', hint: 'Самовывоз, оплата при получении' },
  { value: 'np_postomat', hint: 'До 20 кг, круглосуточно' },
  { value: 'np_courier', hint: 'Доставка на ваш адрес' },
]
</script>

<template>
  <div class="delivery-method">
    <button
      v-for="option in options"
      :key="option.value"
      :class="[
        'delivery-method__option',
        { 'delivery-method__option--active': modelValue === option.value },
      ]"
      :aria-pressed="modelValue === option.value"
      type="button"
      @click="emit('update:modelValue', option.value)"
    >
      <span class="delivery-method__label">{{ DELIVERY_METHOD_LABELS[option.value] }}</span>
      <span class="delivery-method__hint">{{ option.hint }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.delivery-method {
  // Grid so all three options stay exactly equal width regardless of label length.
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;

  @include mixins.respond-to(sm) {
    grid-template-columns: repeat(3, 1fr);
  }

  &__option {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    text-align: left;
    transition:
      border-color $transition-fast,
      background $transition-fast;

    &:hover {
      border-color: $color-primary;
    }

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: 2px;
    }

    &:active {
      transform: translateY(1px);
    }

    &--active {
      border-color: $color-primary;
      background: rgb(79 70 229 / 6%);
    }
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-gray-400;
  }
}
</style>

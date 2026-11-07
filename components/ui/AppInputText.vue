<script setup lang="ts">
import { vMaska } from 'maska/vue'

interface Props {
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  type?: 'text' | 'phone'
  name?: string
  autocomplete?: string
}

const props = withDefaults(defineProps<Props>(), { type: 'text' })
const modelValue = defineModel<string>()

// UA mobile format: +38 (0XX) XXX-XX-XX — "+38 (0" is fixed, only the 9 digits after it are user input
const PHONE_MASK = '+38 (0##) ###-##-##'
const PHONE_PREFIX = '+38 (0'

function onFocus() {
  if (props.type === 'phone' && !modelValue.value) {
    modelValue.value = PHONE_PREFIX
  }
}
</script>

<template>
  <div class="app-input">
    <label
      v-if="label"
      class="app-input__label"
      >{{ label }}</label
    >
    <input
      v-model="modelValue"
      v-maska="type === 'phone' ? { mask: PHONE_MASK, eager: true } : undefined"
      :type="type === 'phone' ? 'tel' : 'text'"
      :name="name"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="['app-input__field', { 'app-input__field--error': error }]"
      @focus="onFocus"
    />
    <span
      v-if="error"
      class="app-input__error"
      >{{ error }}</span
    >
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;

.app-input {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__field {
    width: 100%;
    height: 44px;
    padding: 0 12px;
    border: 1px solid $color-gray-300;
    border-radius: $radius-md;
    font-size: $font-size-base;
    font-family: $font-family-base;
    color: $color-gray-900;
    background: $color-white;
    outline: none;
    transition: border-color $transition-base;

    &::placeholder {
      color: $color-gray-400;
    }

    &:focus {
      border-color: $color-primary;
    }

    &:disabled {
      background: $color-gray-100;
      color: $color-gray-400;
      cursor: not-allowed;
    }

    &--error {
      border-color: $color-danger;
    }
  }

  &__error {
    font-size: $font-size-xs;
    color: $color-danger;
  }
}
</style>

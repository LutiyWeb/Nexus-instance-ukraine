<script setup lang="ts">
import type { NpSettlement } from '~/contracts/delivery'

const props = defineProps<{
  modelValue: NpSettlement | null
  error?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: NpSettlement | null] }>()

const { searchSettlements } = useNovaPoshta()

const query = ref(props.modelValue?.present ?? '')
const results = ref<NpSettlement[]>([])
const open = ref(false)
const loading = ref(false)

let debounceTimer: ReturnType<typeof setTimeout>

watch(
  () => props.modelValue,
  (value) => {
    if (value) query.value = value.present
  },
)

function onInput() {
  if (props.modelValue) emit('update:modelValue', null)
  clearTimeout(debounceTimer)

  const q = query.value.trim()
  if (q.length < 2) {
    results.value = []
    open.value = false
    return
  }

  debounceTimer = setTimeout(async () => {
    loading.value = true
    try {
      results.value = await searchSettlements(q)
      open.value = true
    } finally {
      loading.value = false
    }
  }, 300)
}

function select(settlement: NpSettlement) {
  emit('update:modelValue', settlement)
  query.value = settlement.present
  open.value = false
}

function onFocus() {
  if (results.value.length) open.value = true
}

function onBlur() {
  open.value = false
}
</script>

<template>
  <div class="checkout-city-autocomplete">
    <label class="checkout-city-autocomplete__label">Місто</label>
    <div class="checkout-city-autocomplete__control">
      <input
        v-model="query"
        type="text"
        class="checkout-city-autocomplete__input"
        placeholder="Почніть вводити назву міста"
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <ul
        v-if="open && results.length"
        class="checkout-city-autocomplete__dropdown"
      >
        <li
          v-for="settlement in results"
          :key="settlement.ref"
        >
          <button
            type="button"
            class="checkout-city-autocomplete__option"
            @mousedown.prevent="select(settlement)"
          >
            {{ settlement.present }}
          </button>
        </li>
      </ul>
      <p
        v-else-if="open && !loading"
        class="checkout-city-autocomplete__empty"
      >
        Нічого не знайдено
      </p>
    </div>
    <span
      v-if="error"
      class="checkout-city-autocomplete__error"
      >{{ error }}</span
    >
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;

.checkout-city-autocomplete {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__control {
    position: relative;
  }

  &__input {
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
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    inset-inline: 0;
    z-index: $z-dropdown;
    max-height: 260px;
    overflow-y: auto;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
  }

  &__option {
    display: block;
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    font-size: $font-size-sm;
    color: $color-gray-900;

    &:hover {
      background: $color-gray-50;
    }
  }

  &__empty {
    position: absolute;
    top: calc(100% + 4px);
    inset-inline: 0;
    z-index: $z-dropdown;
    padding: 10px 12px;
    font-size: $font-size-sm;
    color: $color-gray-400;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
  }

  &__error {
    font-size: $font-size-xs;
    color: $color-danger;
  }
}
</style>

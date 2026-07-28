<script setup lang="ts">
import type { NpWarehouse } from '~/contracts/delivery'

const props = defineProps<{
  cityRef: string | null
  modelValue: NpWarehouse | null
  error?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: NpWarehouse | null] }>()

const { getWarehouses } = useNovaPoshta()

const warehouses = ref<NpWarehouse[]>([])
const query = ref('')
const open = ref(false)
const loading = ref(false)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return warehouses.value
  return warehouses.value.filter(
    (w) => w.number.toLowerCase().includes(q) || w.shortAddress.toLowerCase().includes(q),
  )
})

watch(
  () => props.cityRef,
  async (cityRef) => {
    emit('update:modelValue', null)
    query.value = ''
    warehouses.value = []
    if (!cityRef) return

    loading.value = true
    try {
      warehouses.value = await getWarehouses(cityRef)
    } finally {
      loading.value = false
    }
  },
)

function label(w: NpWarehouse) {
  return `Відділення №${w.number} — ${w.shortAddress}`
}

function select(warehouse: NpWarehouse) {
  emit('update:modelValue', warehouse)
  query.value = label(warehouse)
  open.value = false
}

function onFocus() {
  if (props.cityRef) open.value = true
}

function onBlur() {
  open.value = false
}

function onInput() {
  if (props.modelValue) emit('update:modelValue', null)
  open.value = true
}
</script>

<template>
  <div class="checkout-warehouse-select">
    <label class="checkout-warehouse-select__label">Відділення Нової Пошти</label>
    <div class="checkout-warehouse-select__control">
      <input
        v-model="query"
        type="text"
        class="checkout-warehouse-select__input"
        :disabled="!cityRef"
        :placeholder="cityRef ? 'Оберіть відділення' : 'Спочатку оберіть місто'"
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />
      <p v-if="loading" class="checkout-warehouse-select__empty">Завантаження...</p>
      <ul v-else-if="open && filtered.length" class="checkout-warehouse-select__dropdown">
        <li v-for="warehouse in filtered" :key="warehouse.ref">
          <button
            type="button"
            class="checkout-warehouse-select__option"
            @mousedown.prevent="select(warehouse)"
          >
            {{ label(warehouse) }}
          </button>
        </li>
      </ul>
      <p v-else-if="open && cityRef && !filtered.length" class="checkout-warehouse-select__empty">
        Нічого не знайдено
      </p>
    </div>
    <span v-if="error" class="checkout-warehouse-select__error">{{ error }}</span>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;

.checkout-warehouse-select {
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

    &:disabled {
      background: $color-gray-100;
      color: $color-gray-400;
      cursor: not-allowed;
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

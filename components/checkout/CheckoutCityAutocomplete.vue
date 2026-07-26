<script setup lang="ts">
import type { Settlement } from '~/contracts/delivery'

interface Props {
  modelValue: string
  error?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [string]
  select: [Settlement]
}>()

const deliveryStore = useDeliveryStore()

const open = ref(false)
const highlighted = ref(-1)
const root = ref<HTMLElement | null>(null)

/** Debounce keystrokes so a fast typist triggers one request, not one per character. */
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput(value: string) {
  emit('update:modelValue', value)
  open.value = true
  highlighted.value = -1

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => deliveryStore.searchSettlements(value), 250)
}

function choose(settlement: Settlement) {
  emit('update:modelValue', settlement.present)
  emit('select', settlement)
  open.value = false
  highlighted.value = -1
}

function onKeydown(event: KeyboardEvent) {
  const items = deliveryStore.settlements
  if (!open.value || !items.length) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlighted.value = (highlighted.value + 1) % items.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlighted.value = highlighted.value <= 0 ? items.length - 1 : highlighted.value - 1
  } else if (event.key === 'Enter' && highlighted.value >= 0) {
    event.preventDefault()
    choose(items[highlighted.value])
  } else if (event.key === 'Escape') {
    open.value = false
  }
}

function onClickOutside(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  if (debounceTimer) clearTimeout(debounceTimer)
})

const showDropdown = computed(
  () => open.value && (deliveryStore.settlements.length > 0 || deliveryStore.loadingSettlements),
)
</script>

<template>
  <!-- keydown is bound here, not on AppInputText: that component has no attrs
       passthrough to its <input>, so the listener would land on its wrapper anyway. -->
  <div ref="root" class="city-autocomplete" @keydown="onKeydown">
    <AppInputText
      :model-value="props.modelValue"
      :error="props.error"
      label="Город или населённый пункт"
      placeholder="Начните вводить, например Киев"
      @update:model-value="onInput"
    />

    <ul v-if="showDropdown" class="city-autocomplete__dropdown">
      <li v-if="deliveryStore.loadingSettlements" class="city-autocomplete__status">Поиск…</li>

      <li
        v-for="(settlement, index) in deliveryStore.settlements"
        :key="settlement.ref"
        :class="[
          'city-autocomplete__item',
          { 'city-autocomplete__item--highlighted': index === highlighted },
        ]"
      >
        <button type="button" class="city-autocomplete__button" @click="choose(settlement)">
          <span class="city-autocomplete__name">{{ settlement.present }}</span>
          <span class="city-autocomplete__meta">{{ settlement.warehouseCount }} отд.</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;

.city-autocomplete {
  // Positioning context for the dropdown overlay.
  position: relative;

  // Overlay, not in flow — the form must not shift when suggestions appear.
  &__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: $z-dropdown;
    max-height: 280px;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 4px;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
  }

  &__status {
    padding: 10px 12px;
    font-size: $font-size-sm;
    color: $color-gray-400;
  }

  &__item {
    border-radius: $radius-md;

    &--highlighted {
      background: rgb(79 70 229 / 8%);
    }
  }

  &__button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    border-radius: $radius-md;
    transition: background $transition-fast;

    &:hover {
      background: rgb(79 70 229 / 8%);
    }

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: -2px;
    }
  }

  &__name {
    font-size: $font-size-sm;
    color: $color-gray-900;
  }

  &__meta {
    font-size: $font-size-xs;
    color: $color-gray-400;
    flex-shrink: 0;
  }
}
</style>

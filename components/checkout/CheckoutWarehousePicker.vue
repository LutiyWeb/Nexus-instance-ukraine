<script setup lang="ts">
import type { Warehouse } from '~/contracts/delivery'

interface Props {
  /** Nova Poshta `deliveryCityRef` of the chosen settlement. Empty until a city is picked. */
  cityRef: string
  type: 'branch' | 'postomat'
  selectedRef?: string
  error?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [Warehouse] }>()

const deliveryStore = useDeliveryStore()
const filter = ref('')

// Refetch whenever the city or the warehouse type changes — a locker list and a
// branch list are different queries for the same settlement.
watch(
  () => [props.cityRef, props.type] as const,
  ([cityRef, type]) => {
    filter.value = ''
    if (cityRef) deliveryStore.fetchWarehouses(cityRef, type)
    else deliveryStore.clearWarehouses()
  },
  { immediate: true },
)

const filtered = computed(() => {
  const query = filter.value.trim().toLowerCase()
  if (!query) return deliveryStore.warehouses

  return deliveryStore.warehouses.filter(
    (warehouse) =>
      warehouse.description.toLowerCase().includes(query) ||
      warehouse.number.includes(query) ||
      warehouse.shortAddress.toLowerCase().includes(query),
  )
})

const emptyMessage = computed(() => {
  if (!props.cityRef) return 'Сначала выберите город'
  if (deliveryStore.loadingWarehouses) return 'Загрузка отделений…'
  if (!deliveryStore.warehouses.length) {
    return props.type === 'postomat'
      ? 'В этом населённом пункте нет почтоматов'
      : 'В этом населённом пункте нет отделений'
  }
  if (!filtered.value.length) return 'Ничего не найдено по запросу'
  return ''
})
</script>

<template>
  <div class="warehouse-picker">
    <AppInputText
      v-if="cityRef && deliveryStore.warehouses.length"
      v-model="filter"
      :label="type === 'postomat' ? 'Поиск почтомата' : 'Поиск отделения'"
      placeholder="Номер или улица"
    />

    <p v-if="emptyMessage" class="warehouse-picker__empty">{{ emptyMessage }}</p>

    <ul v-else class="warehouse-picker__list">
      <li v-for="warehouse in filtered" :key="warehouse.ref">
        <button
          :class="[
            'warehouse-picker__item',
            { 'warehouse-picker__item--active': selectedRef === warehouse.ref },
          ]"
          :aria-pressed="selectedRef === warehouse.ref"
          type="button"
          @click="emit('select', warehouse)"
        >
          <span class="warehouse-picker__name">{{ warehouse.description }}</span>
          <span v-if="warehouse.maxWeight" class="warehouse-picker__weight">
            до {{ warehouse.maxWeight }} кг
          </span>
        </button>
      </li>
    </ul>

    <span v-if="error" class="warehouse-picker__error">{{ error }}</span>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;

.warehouse-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__empty {
    font-size: $font-size-sm;
    color: $color-gray-400;
    padding-block: 8px;
  }

  // Large cities have hundreds of branches — cap the height and scroll inside,
  // otherwise the list pushes the order summary off-screen.
  &__list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 320px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
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

  &__name {
    font-size: $font-size-sm;
    color: $color-gray-900;
  }

  &__weight {
    font-size: $font-size-xs;
    color: $color-gray-400;
    flex-shrink: 0;
  }

  &__error {
    font-size: $font-size-xs;
    color: $color-danger;
  }
}
</style>

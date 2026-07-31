<script setup lang="ts">
interface Spec {
  label: string
  value: string
}

defineProps<{ specs: Spec[] }>()
</script>

<template>
  <table class="product-specs-table">
    <tbody>
      <tr v-for="spec in specs" :key="spec.label">
        <td class="product-specs-table__label">{{ spec.label }}</td>
        <td class="product-specs-table__value">{{ spec.value }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;

.product-specs-table {
  width: 100%;
  max-width: 640px;
  border-collapse: collapse;

  &__label,
  &__value {
    padding: 10px 12px;
    font-size: $font-size-sm;
    border-bottom: 1px solid $color-gray-100;
  }

  &__label {
    color: $color-gray-500;
    width: 40%;
  }

  &__value {
    color: $color-gray-900;
    font-weight: $font-weight-medium;
  }
}
</style>

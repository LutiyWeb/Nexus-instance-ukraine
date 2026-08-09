<script setup lang="ts">
import type { Product } from '~/types/product'

// TODO: products are a real API slice, but "related to this item" is currently
// just "other products in the store" — swap for a real relation once the
// backend exposes GET /api/products/:id/related.
defineProps<{ products: Product[] }>()
</script>

<template>
  <section
    v-if="products.length"
    class="product-recs"
  >
    <h2 class="product-recs__title">З цим товаром часто купують</h2>

    <div class="product-recs__track">
      <TheProductCard
        v-for="p in products"
        :key="p.id"
        :product="p"
        class="product-recs__card"
      />
    </div>
  </section>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.product-recs {
  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-heading;
    margin: 0 0 16px;

    @include mixins.respond-to(tablet) {
      font-size: $font-size-2xl;
    }
  }

  &__track {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-block: 20px;
    padding-inline: 16px;
    margin-block: -20px;
    margin-inline: -16px;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__card {
    flex: 0 0 200px;

    @include mixins.respond-to(tablet) {
      flex: 0 0 230px;
    }
  }
}
</style>

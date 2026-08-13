<script setup lang="ts">
interface SubcategoryTile {
  id: number
  name: string
  slug: string
}

defineProps<{ subcategories: SubcategoryTile[] }>()

const HEX_VARIANTS = ['scatter', 'cluster', 'sparse'] as const
</script>

<template>
  <div
    v-if="subcategories.length"
    class="catalog-subcats"
  >
    <NuxtLink
      v-for="(sub, i) in subcategories"
      :key="sub.id"
      :to="`/catalog?categories=${sub.slug}`"
      class="catalog-subcats__tile"
    >
      <AppHexPattern
        :variant="HEX_VARIANTS[i % HEX_VARIANTS.length]"
        class="catalog-subcats__hex"
      />
      <span class="catalog-subcats__name">{{ sub.name }}</span>
    </NuxtLink>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.catalog-subcats {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-block: 4px;
  margin-bottom: 20px;

  &::-webkit-scrollbar {
    display: none;
  }

  &__tile {
    position: relative;
    z-index: 0;
    flex: 0 0 auto;
    width: 120px;
    height: 88px;
    display: flex;
    align-items: flex-end;
    padding: 10px;
    border-radius: $radius-lg;
    background: $color-gray-50;
    border: 1px solid $color-gray-200;
    overflow: hidden;
    text-decoration: none;
    transition:
      transform $transition-base,
      box-shadow $transition-base;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-sm;
    }
  }

  &__hex {
    position: absolute;
    z-index: -1;
    top: -10px;
    right: -10px;
    width: 64px;
    height: auto;
    opacity: 0.5;
    transition: opacity $transition-base;
  }

  &__tile:hover &__hex {
    opacity: 1;
  }

  &__name {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-heading;
    line-height: 1.25;
  }
}
</style>

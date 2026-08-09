<script setup lang="ts">
interface PromoBanner {
  id: number
  gradient: string
  title: string
  subtitle: string
  linkUrl?: string | null
}

defineProps<{ banners: PromoBanner[] }>()

// Temporary — cycling all three hex-pattern layouts so they can be compared side by side.
const HEX_VARIANTS = ['scatter', 'cluster', 'sparse'] as const
</script>

<template>
  <div class="promo-banner-list">
    <PromoBannerCard
      v-for="(banner, index) in banners"
      :key="banner.id"
      :variant="index % 2 === 0 ? 'graphite' : 'accent'"
      :hex-variant="HEX_VARIANTS[index % HEX_VARIANTS.length]"
      :title="banner.title"
      :subtitle="banner.subtitle"
      :link-url="banner.linkUrl"
    />
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.promo-banner-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-block: 4px 8px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  > * {
    flex: 0 0 300px;
  }

  @include mixins.respond-to(tablet) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: visible;

    > * {
      flex: 0 0 auto;
    }
  }
}
</style>

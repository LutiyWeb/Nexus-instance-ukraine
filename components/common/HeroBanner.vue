<script setup lang="ts">
interface Props {
  title: string
  description?: string | null
  mediaUrl: string
  mediaType?: 'image' | 'video'
  linkUrl?: string | null
}

withDefaults(defineProps<Props>(), {
  mediaType: 'image',
})
</script>

<template>
  <NuxtLink :to="linkUrl ?? '/'" class="hero-banner">
    <div class="hero-banner__content">
      <h2 class="hero-banner__title">{{ title }}</h2>
      <p v-if="description" class="hero-banner__sub">{{ description }}</p>
      <AppButton v-if="linkUrl" variant="gradient" size="xl" tag="span" class="hero-banner__cta">
        Дивитись
      </AppButton>
    </div>
    <div class="hero-banner__image">
      <video
        v-if="mediaType === 'video'"
        :src="mediaUrl"
        class="hero-banner__img"
        autoplay
        muted
        loop
        playsinline
      />
      <img
        v-else
        :src="mediaUrl"
        :alt="title"
        class="hero-banner__img"
        width="340"
        height="340"
        loading="eager"
        fetchpriority="high"
      />
    </div>
  </NuxtLink>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

// EXPERIMENTAL: two-tone hero (gradient content panel + static-tint media
// panel). Colors stay on existing design tokens, not a new hardcoded palette.
.hero-banner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 450px;
  border-radius: $radius-2xl;
  overflow: hidden;
  position: relative;
  text-decoration: none;
  background: linear-gradient(180deg, rgba(248, 189, 228, 0.18) 0%, rgba(255, 251, 253, 0.18) 180%);

  &::before {
    content: '';
    position: absolute;
    width: 35%;
    height: 100%;
    top: 0;
    bottom: 0;
    right: 0;
    z-index: 0;
    pointer-events: none;
    background-color: $color-white;
  }

  &::after {
    content: 'SOUND';
    position: absolute;
    inset: 200px 0 0 300px;
    z-index: 0;
    font-family: 'Oswald', sans-serif;
    font-size: 240px;
    font-weight: $font-weight-bold;
    color: rgb(79 70 229 / 8%);
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    pointer-events: none;
    opacity: 0.3;
  }

  @include mixins.respond-to(md) {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex: 1 1 0;
    min-width: 0;
    padding: 16px 20px;
    text-align: center;

    @include mixins.respond-to(md) {
      align-items: flex-start;
      gap: 16px;
      padding: 40px 64px;
      text-align: left;
    }
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    margin: 0;
    color: $color-gray-900;
    line-height: 1.2;
    max-width: 520px;

    @include mixins.respond-to(md) {
      font-size: $font-size-4xl;
    }
  }

  &__sub {
    font-size: $font-size-xs;
    color: $color-gray-500;
    margin: 0;
    max-width: 440px;

    @include mixins.respond-to(md) {
      font-size: $font-size-xl;
    }
  }

  &__cta {
    align-self: center;
    min-width: 180px;
    padding: 12px;
    font-size: $font-size-base;

    @include mixins.respond-to(md) {
      align-self: flex-start;
    }

    @include mixins.respond-to(lg) {
      min-width: 240px;
      padding: 16px;
      font-size: $font-size-xl;
    }
  }

  &__image {
    position: relative;
    display: flex;
    order: -1;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    @include mixins.respond-to(md) {
      order: 0;
      flex: 0 0 38%;
      max-width: 38%;
    }
  }

  &__img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: contain;
    display: block;

    @include mixins.respond-to(md) {
      aspect-ratio: auto;
      max-height: 510px;
    }
  }
}
</style>

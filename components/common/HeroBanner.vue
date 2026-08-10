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
  <NuxtLink
    :to="linkUrl ?? '/'"
    class="hero-banner"
  >
    <div class="hero-banner__content">
      <h2 class="hero-banner__title">{{ title }}</h2>
      <p
        v-if="description"
        class="hero-banner__sub"
      >
        {{ description }}
      </p>
      <AppButton
        v-if="linkUrl"
        variant="gradient"
        size="xl"
        tag="span"
        class="hero-banner__cta"
      >
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
      <AppImage
        v-else
        :src="mediaUrl"
        :alt="title"
        fit="inside"
        :lazy="false"
        img-class="hero-banner__img"
        :sizes="{ mobile: { w: 400, h: 400 }, desktop: { w: 600, h: 600 } }"
      />
    </div>
  </NuxtLink>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.hero-banner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 400px;
  padding: 16px 20px;
  border-radius: $radius-2xl;
  background: $color-gray-50;
  text-decoration: none;

  &::before {
    width: 100%;
    height: 100%;
    right: 0;
    position: absolute;
    z-index: 0;
    top: 0;
    background-image: url('/public/bg-image/tech-bg-hex.svg');
    background-size: cover;
    background-repeat: no-repeat;
    border-radius: inherit;
    content: '';

    @include mixins.respond-to(tablet) {
      width: 30%;
      height: 100%;
    }
  }

  &::before {
  }

  // &::after {
  //   position: absolute;
  //   z-index: 0;
  //   bottom: 0;
  //   border-radius: 0 24px 24px 0;
  //   background-image: linear-gradient(to top, $color-gray-100 0%, rgb(244 248 252 / 0.6) 100%);
  //   content: '';

  //   @include mixins.respond-to(tablet) {
  //     background-image: linear-gradient(to right, $color-gray-100 0%, rgb(244 248 252 / 0.2) 100%);
  //     width: calc(30% + 10px);
  //     height: 100%;
  //   }
  // }

  @include mixins.respond-to(tablet) {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    padding: 40px 64px;
    gap: 48px;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex: 1 1 0;
    min-width: 0;
    text-align: center;

    @include mixins.respond-to(tablet) {
      align-items: flex-start;
      gap: 16px;
      text-align: left;
    }
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    margin: 0;
    color: $color-heading;
    line-height: 1.2;
    max-width: 520px;

    @include mixins.respond-to(tablet) {
      font-size: $font-size-4xl;
    }
  }

  &__sub {
    font-size: $font-size-xs;
    color: $color-gray-500;
    margin: 0;
    max-width: 440px;

    @include mixins.respond-to(tablet) {
      font-size: $font-size-xl;
    }
  }

  &__cta {
    align-self: center;
    min-width: 180px;
    padding: 12px;
    font-size: $font-size-base;

    @include mixins.respond-to(tablet) {
      align-self: flex-start;
    }

    @include mixins.respond-to(notebook) {
      min-width: 240px;
      padding: 16px;
      font-size: $font-size-xl;
    }
  }

  &__image {
    position: relative;
    z-index: 1;
    display: flex;
    order: -1;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    // Vendor photos are shot on white; blending multiply against this
    // banner's flat background hides the seam around the product.
    --ai-blend-mode: multiply;

    @include mixins.respond-to(tablet) {
      order: 0;
      flex: 0 0 26%;
    }
  }

  &__img {
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: contain;
    display: block;

    @include mixins.respond-to(tablet) {
      aspect-ratio: auto;
      max-height: 510px;
    }
  }
}
</style>

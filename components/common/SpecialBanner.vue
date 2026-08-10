<script setup lang="ts">
interface Props {
  title: string
  description?: string
  imageUrl: string
  linkUrl?: string | null
  reverse?: boolean
}

withDefaults(defineProps<Props>(), { reverse: false })
</script>

<template>
  <NuxtLink
    v-if="linkUrl"
    :to="linkUrl"
    :class="['special-banner', { 'special-banner--reverse': reverse }]"
  >
    <div class="special-banner__image">
      <AppImage
        :src="imageUrl"
        :alt="title"
        fit="inside"
        img-class="special-banner__img"
        :sizes="{ mobile: { w: 500, h: 400 }, desktop: { w: 600, h: 480 } }"
      />
    </div>
    <div class="special-banner__content">
      <h2 class="special-banner__title">{{ title }}</h2>
      <p
        v-if="description"
        class="special-banner__description"
      >
        {{ description }}
      </p>
      <div class="special-banner__actions">
        <AppButton
          variant="primary"
          size="lg"
          tag="span"
          >Дивитись</AppButton
        >
      </div>
    </div>
  </NuxtLink>
  <div
    v-else
    :class="['special-banner', { 'special-banner--reverse': reverse }]"
  >
    <div class="special-banner__image">
      <AppImage
        :src="imageUrl"
        :alt="title"
        fit="inside"
        img-class="special-banner__img"
        :sizes="{ mobile: { w: 500, h: 400 }, desktop: { w: 600, h: 480 } }"
      />
    </div>
    <div class="special-banner__content">
      <h2 class="special-banner__title">{{ title }}</h2>
      <p
        v-if="description"
        class="special-banner__description"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.special-banner {
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 32px 24px;
  border-radius: $radius-2xl;
  background: $color-gray-50;
  overflow: hidden;

  &::before {
    position: absolute;
    z-index: -1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: url('/public/bg-image/tech-bg-hex.svg');
    background-size: cover;
    background-position: left center;
    background-repeat: no-repeat;
    content: '';

    @include mixins.respond-to(tablet) {
      width: 25%;
      background-size: 100%;
      transform: scaleX(-1);
    }
  }

  @include mixins.respond-to(tablet) {
    flex-direction: row;
    align-items: center;
    gap: 48px;
    padding: 48px;
  }

  &--reverse {
    &::before {
      left: auto;
      right: 0;
      transform: scaleX(-1);
      background-position: right center;

      @include mixins.respond-to(tablet) {
        transform: scaleY(-1);
      }
    }
    .special-banner__image {
      @include mixins.respond-to(tablet) {
        order: 1;
      }
    }
  }

  &__image {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    @include mixins.respond-to(tablet) {
      flex: 0 0 26%;
    }
  }

  &__img {
    width: 100%;
    max-height: 260px;
    object-fit: contain;

    @include mixins.respond-to(tablet) {
      max-height: 320px;
    }
  }

  &__content {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 16px;
    flex: 1 1 0;
    min-width: 0;

    @include mixins.respond-to(tablet) {
      align-items: flex-end;
      text-align: right;
      gap: 20px;
    }
  }

  &--reverse &__content {
    @include mixins.respond-to(tablet) {
      align-items: flex-start;
      text-align: left;
    }
  }

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-heading;
    margin: 0;

    @include mixins.respond-to(tablet) {
      font-size: $font-size-3xl;
    }
  }

  &__description {
    font-size: $font-size-base;
    color: $color-gray-600;
    margin: 0;
    max-width: 420px;
    line-height: 1.6;
  }

  &__actions {
    margin-top: 4px;
  }
}
</style>

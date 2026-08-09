<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
interface Props {
  title: string
  subtitle: string
  variant: 'graphite' | 'accent'
  hexVariant?: 'scatter' | 'cluster' | 'sparse'
  linkUrl?: string | null
  tag?: string
}
withDefaults(defineProps<Props>(), { tag: 'Акція', hexVariant: 'scatter' })
</script>

<template>
  <NuxtLink
    :to="linkUrl || '/promo'"
    :class="['promo-card', `promo-card--${variant}`]"
  >
    <AppHexPattern
      :variant="hexVariant"
      class="promo-card__hex"
    />

    <span class="promo-card__tag">{{ tag }}</span>
    <h3 class="promo-card__title">{{ title }}</h3>
    <p class="promo-card__subtitle">{{ subtitle }}</p>
    <span class="promo-card__cta">Дивитись <ArrowRight :size="14" /></span>
  </NuxtLink>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.promo-card {
  display: flex;
  flex-direction: column;
  border-radius: $radius-xl;
  padding: 16px;
  color: $color-heading;
  min-height: 160px;
  position: relative;
  z-index: 0;
  overflow: hidden;
  transition:
    transform $transition-base,
    box-shadow $transition-base;
  text-decoration: none;
  box-shadow: $shadow-sm;

  @include mixins.respond-to(tablet) {
    padding: 24px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &--graphite {
    background: $color-white;
    border: 1px solid $color-gray-200;
  }

  &--accent {
    background: $color-gray-50;
    border: 1px solid $color-gray-200;
  }

  .promo-card__hex {
    position: absolute;
    z-index: -1;
    top: 50%;
    right: -30px;
    transform: translateY(-50%);
    width: 140px;
    height: auto;
    opacity: 0.5;
    transition: opacity $transition-base;

    @include mixins.respond-to(tablet) {
      width: 170px;
    }
  }

  // scatter's pattern has one dominant hex that carries its visual weight —
  // cluster/sparse don't, so they're scaled up to match it at the same
  // container size instead of reading as smaller/airier.
  .promo-card__hex.app-hex-pattern--cluster {
    transform: translateY(-50%) scale(1.45);
  }

  .promo-card__hex.app-hex-pattern--sparse {
    transform: translateY(-50%) scale(1.25);
  }

  &:hover .promo-card__hex {
    opacity: 1;
  }

  &__tag {
    display: inline-block;
    width: fit-content;
    background: rgba($color-primary, 12%);
    color: $color-primary-dark;
    border-radius: $radius-full;
    font-size: 11px;
    font-weight: $font-weight-semibold;
    padding: 4px 10px;
  }

  &__title {
    font-size: 28px;
    font-weight: $font-weight-bold;
    color: $color-heading;
    margin: 8px 0 4px;
  }

  &__subtitle {
    font-size: $font-size-sm;
    color: $color-gray-600;
    margin: 0;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: $font-weight-semibold;
    color: $color-primary-dark;
    margin-top: 12px;
    transition: color $transition-fast;
  }

  &:hover &__cta {
    color: $color-primary;
  }
}
</style>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
interface Props {
  title: string
  subtitle: string
  variant: 'graphite' | 'accent'
  linkUrl?: string | null
  tag?: string
}
withDefaults(defineProps<Props>(), { tag: 'Акція' })
</script>

<template>
  <NuxtLink
    :to="linkUrl || '/promo'"
    :class="['promo-card', `promo-card--${variant}`]"
  >
    <span class="promo-card__tag">{{ tag }}</span>
    <h3 class="promo-card__title">{{ title }}</h3>
    <p class="promo-card__subtitle">{{ subtitle }}</p>
    <span class="promo-card__cta">Дивитись <ArrowRight :size="14" /></span>
  </NuxtLink>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

// EXPERIMENTAL: temporary hardcoded palette for the glassmorphism visual
// test — not promoted to variables.scss yet (see branch brief).
.promo-card {
  display: flex;
  flex-direction: column;
  border-radius: $radius-xl;
  padding: 16px;
  color: $color-white;
  min-height: 160px;
  position: relative;
  overflow: hidden;
  transition: transform $transition-base;
  text-decoration: none;

  @include mixins.respond-to(tablet) {
    padding: 24px;
  }

  &:hover {
    transform: translateY(-2px);
  }

  &--graphite {
    background: #16181d;
  }

  &--accent {
    background: linear-gradient(90deg, #00c6ff, #0072ff, #00c6ff);
    background-size: 200% auto;
    animation: promo-card-gradient-move 3s linear infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }

  &__tag {
    display: inline-block;
    width: fit-content;
    background: rgb(255 255 255 / 20%);
    border-radius: $radius-full;
    font-size: 11px;
    font-weight: $font-weight-semibold;
    padding: 4px 10px;
  }

  &__title {
    font-size: 28px;
    font-weight: $font-weight-bold;
    margin: 8px 0 4px;
  }

  &__subtitle {
    font-size: $font-size-sm;
    opacity: 0.85;
    margin: 0;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: $font-weight-semibold;
    opacity: 0.9;
    margin-top: 12px;
  }
}

@keyframes promo-card-gradient-move {
  from {
    background-position: 0% 50%;
  }
  to {
    background-position: 200% 50%;
  }
}
</style>

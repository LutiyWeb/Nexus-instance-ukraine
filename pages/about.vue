<script setup lang="ts">
useHead({ title: 'Про нас — Nexus Commerce' })
</script>

<template>
  <div class="about-page container">
    <TheTitle
      tag="h1"
      size="m"
      >Про нас</TheTitle
    >
    <p class="about-page__lead">
      Nexus Commerce — сучасна платформа шаблонів для e-commerce проєктів на Nuxt 3.
    </p>
    <div class="about-page__grid">
      <TheBanner variant="primary">
        <template #eyebrow>Наша місія</template>
        <p>Допомагати розробникам швидко запускати якісні проєкти.</p>
      </TheBanner>
      <TheBanner variant="dark">
        <template #eyebrow>Технології</template>
        <p>Nuxt 3, Pinia, Swiper, PrimeVue, SCSS — найкращий стек для продакшену.</p>
      </TheBanner>
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.about-page {
  padding-block: 48px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  &__lead {
    font-size: $font-size-lg;
    color: $color-gray-600;
    max-width: 640px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    @include mixins.respond-to(md) {
      grid-template-columns: 1fr 1fr;
    }
  }
}
</style>

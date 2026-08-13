<script setup lang="ts">
useHead({ title: 'Про нас — Honey Store' })
useCanonical()
</script>

<template>
  <div class="about-page container--narrow">
    <TheTitle
      tag="h1"
      size="m"
      >Про нас</TheTitle
    >
    <p class="about-page__lead">
      Honey Store — сучасний інтернет-магазин електроніки, де кожен покупець знайде техніку для
      роботи, навчання та відпочинку.
    </p>

    <div class="about-page__grid">
      <div class="about-page__card">
        <span class="about-page__eyebrow">Наша місія</span>
        <p>
          Робимо купівлю техніки простою та чесною — перевірений товар, прозорі ціни та підтримка на
          кожному кроці.
        </p>
      </div>
      <div class="about-page__card">
        <span class="about-page__eyebrow">Гарантія</span>
        <p>На кожен товар — гарантійний талон виробника та сервісна підтримка.</p>
      </div>
      <div class="about-page__card">
        <span class="about-page__eyebrow">Доставка</span>
        <p>
          Відправляємо замовлення протягом 24 годин після підтвердження. Доставка «Новою Поштою» або
          «Укрпоштою» по всій Україні.
        </p>
      </div>
      <div class="about-page__card">
        <span class="about-page__eyebrow">Оплата</span>
        <p>Картка Visa/Mastercard, готівка при отриманні або оплата частинами без переплати.</p>
      </div>
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
    gap: 16px;

    @include mixins.respond-to(tablet) {
      grid-template-columns: repeat(2, 1fr);
    }

    @include mixins.respond-to(laptop) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 24px;
    background: $color-gray-50;
    border-radius: $radius-xl;

    p {
      margin: 0;
      font-size: $font-size-sm;
      line-height: 1.5;
      color: $color-gray-600;
    }
  }

  &__eyebrow {
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-heading;
  }
}
</style>

<script setup lang="ts">
useHead({ title: 'Правова інформація — Honey Store' })
useCanonical()
</script>

<template>
  <div class="legal-page container">
    <TheTitle
      tag="h1"
      size="m"
      >Умови використання</TheTitle
    >
    <div class="legal-page__content">
      <h2>1. Загальні положення</h2>
      <p>Використовуючи цей сервіс, ви погоджуєтесь із цими умовами використання.</p>
      <h2>2. Інтелектуальна власність</h2>
      <p>Усі матеріали на сайті захищені авторським правом. Використання без дозволу заборонено.</p>
      <h2>3. Обмеження відповідальності</h2>
      <p>Сервіс надається «як є» без будь-яких гарантій.</p>
      <h2>4. Контакти</h2>
      <p>
        З питань звертайтесь:
        <a href="mailto:info@nexus-commerce.dev">info@nexus-commerce.dev</a>
      </p>
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.legal-page {
  padding-block: 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  &__content {
    max-width: 760px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    h2 {
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
      margin: 0;
    }
    p {
      color: $color-gray-600;
      line-height: $line-height-relaxed;
      margin: 0;
    }
    a {
      color: $color-primary;
    }
  }
}
</style>

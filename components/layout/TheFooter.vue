<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

const open = reactive<Record<number, boolean>>({})
function toggle(i: number) {
  open[i] = !open[i]
}
</script>

<template>
  <footer class="the-footer">
    <div class="the-footer__inner container">
      <div class="the-footer__brand">
        <NuxtLink
          to="/"
          class="the-footer__logo"
          >Honey Store</NuxtLink
        >
      </div>

      <div class="the-footer__cols">
        <div
          v-for="(col, i) in [
            {
              title: 'Каталог',
              links: [
                { to: '/catalog', label: 'Все товари' },
                { to: '/promo', label: 'Акції' },
              ],
            },
            {
              title: 'Компанія',
              links: [
                { to: '/about', label: 'Про нас' },
                { to: '/contacts', label: 'Контакти' },
              ],
            },
            {
              title: 'Покупцям',
              links: [
                { to: '/payment-delivery', label: 'Оплата та доставка' },
                { to: '/returns-exchanges', label: 'Повернення та обмін' },
              ],
            },
            {
              title: 'Правова інформація',
              links: [
                { to: '/public-offer', label: 'Публічна оферта' },
                { to: '/privacy-policy', label: 'Політика конфіденційності' },
              ],
            },
          ]"
          :key="i"
          class="the-footer__col"
        >
          <button
            :class="['the-footer__col-toggle', { 'the-footer__col-toggle--open': open[i] }]"
            type="button"
            @click="toggle(i)"
          >
            {{ col.title }}
            <ChevronDown
              class="the-footer__col-icon"
              :size="14"
            />
          </button>
          <div :class="['the-footer__col-body', { 'the-footer__col-body--open': open[i] }]">
            <div class="the-footer__col-body-inner">
              <NuxtLink
                v-for="link in col.links"
                :key="link.to"
                :to="link.to"
                class="the-footer__link"
              >
                {{ link.label }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="the-footer__bottom container">
      <span>© {{ new Date().getFullYear() }} Honey Store. Усі права захищені.</span>
    </div>
  </footer>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.the-footer {
  background: $color-gray-50;
  color: $color-gray-900;
  border-top: 1px solid $color-gray-200;
  margin-top: auto;

  &__inner {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-block: 48px;

    @include mixins.respond-to(tablet) {
      flex-direction: row;
      gap: 48px;
    }
  }

  &__brand {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__logo {
    font-size: $font-size-xl;
    line-height: 0.7;
    font-weight: $font-weight-bold;
    color: $color-primary-dark;
  }

  &__cols {
    display: flex;
    flex-direction: column;
    flex: 1;

    @include mixins.respond-to(tablet) {
      flex-direction: row;
      gap: 32px;
    }
  }

  &__col {
    display: flex;
    flex-direction: column;

    @include mixins.respond-to(tablet) {
      flex: 1;
    }
  }

  &__col-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    padding: 12px 0;
    background: none;
    border: none;
    border-bottom: 1px solid $color-gray-200;
    cursor: pointer;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-700;
    text-align: left;
    transition: color $transition-fast;

    &:hover {
      color: $color-heading;
    }

    &--open {
      color: $color-heading;

      .the-footer__col-icon {
        transform: rotate(180deg);
      }
    }

    @include mixins.respond-to(tablet) {
      cursor: default;
      pointer-events: none;
      border-bottom: none;
      padding: 0 0 12px;
    }
  }

  &__col-icon {
    flex-shrink: 0;
    color: $color-gray-500;
    transition: transform $transition-base;

    @include mixins.respond-to(tablet) {
      display: none;
    }
  }

  &__col-body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows $transition-base;

    &--open {
      grid-template-rows: 1fr;
    }

    @include mixins.respond-to(tablet) {
      grid-template-rows: 1fr;
      transition: none;
    }
  }

  &__col-body-inner {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 0;
    transition: padding-top $transition-base;

    .the-footer__col-body--open & {
      padding-top: 8px;
    }

    @include mixins.respond-to(tablet) {
      overflow: visible;
      padding-top: 0;
      transition: none;
    }
  }

  &__link {
    font-size: $font-size-sm;
    color: $color-gray-500;
    padding: 5px 0;
    transition: color $transition-fast;

    &:hover {
      color: $color-heading;
    }

    &.router-link-active {
      color: $color-primary-dark;
      font-weight: $font-weight-medium;
    }
  }

  &__bottom {
    border-top: 1px solid $color-gray-200;
    padding-block: 16px;
    font-size: $font-size-sm;
    color: $color-gray-500;
  }
}
</style>

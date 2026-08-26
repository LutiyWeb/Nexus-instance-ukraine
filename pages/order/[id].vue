<script setup lang="ts">
import { CheckCircle2, Package, MapPin, User, Phone, FileText, ChevronRight } from 'lucide-vue-next'
import type { Order, OrderStatus } from '~/types/order'

const route = useRoute()
const { authFetch } = useAuthFetch()
const authStore = useAuthStore()
const ordersStore = useOrdersStore()

// Guests have no account for GET /api/orders/:id to attach to (always 401), so
// skip the fetch entirely for them — checkout.vue stashed what the POST
// response returned, which is all a guest ever gets to see.
const { data, pending, error } = useAsyncData(`order-${route.params.id}`, () =>
  authStore.isLoggedIn
    ? authFetch<{ data: Order }>(`/api/orders/${route.params.id}`)
    : Promise.resolve(null),
)

const order = computed(() => data.value?.data ?? null)

interface GuestOrderSummary {
  orderNumber: string
  status: OrderStatus
  totalPrice: number
}

const guestOrder = ref<GuestOrderSummary | null>(null)

if (process.client && !authStore.isLoggedIn) {
  try {
    const raw = sessionStorage.getItem(`guest-order-${route.params.id}`)
    guestOrder.value = raw ? JSON.parse(raw) : null
  } catch {
    guestOrder.value = null
  }
}

const breadcrumbs = computed(() =>
  authStore.isLoggedIn
    ? [
        { label: 'Головна', to: '/' },
        { label: 'Мої замовлення', to: '/cabinet?section=orders' },
        { label: order.value?.orderNumber ?? '...' },
      ]
    : [{ label: 'Головна', to: '/' }, { label: guestOrder.value?.orderNumber ?? '...' }],
)

useSeoMeta({
  title: () => {
    const number = order.value?.orderNumber ?? guestOrder.value?.orderNumber
    return number ? `Замовлення ${number} — Honey Store` : 'Замовлення'
  },
  robots: 'noindex, follow',
})
useCanonical()

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'warning',
  confirmed: 'primary',
  processing: 'primary',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="order-page container--narrow">
    <AppBreadcrumbs
      :crumbs="breadcrumbs"
      class="order-page__breadcrumbs"
    />

    <!-- Guest: only what the POST /api/orders response gave us, no GET is possible -->
    <template v-if="!authStore.isLoggedIn">
      <div
        v-if="guestOrder"
        class="order-page__guest"
      >
        <div class="order-page__banner">
          <div class="order-page__banner-icon">
            <CheckCircle2 :size="40" />
          </div>
          <div class="order-page__banner-body">
            <h1 class="order-page__banner-title">Замовлення оформлено!</h1>
            <p class="order-page__banner-sub">
              Номер замовлення: <strong>{{ guestOrder.orderNumber }}</strong>
            </p>
          </div>
          <span
            :class="[
              'order-page__status',
              `order-page__status--${STATUS_COLOR[guestOrder.status]}`,
            ]"
          >
            {{ ordersStore.getStatusLabel(guestOrder.status) }}
          </span>
        </div>

        <div class="order-page__card order-page__guest-total">
          <span>До сплати</span>
          <span>{{ ordersStore.formatMoney(String(guestOrder.totalPrice)) }}</span>
        </div>

        <NuxtLink
          to="/catalog"
          class="order-page__btn order-page__btn--primary order-page__guest-cta"
        >
          Продовжити покупки
        </NuxtLink>
      </div>

      <div
        v-else
        class="order-page__error"
      >
        <p>Замовлення недоступне. Номер замовлення показується лише одразу після оформлення.</p>
        <NuxtLink
          to="/contacts"
          class="order-page__error-link"
          >Зв'язатися з підтримкою</NuxtLink
        >
      </div>
    </template>

    <!-- Logged in -->
    <template v-else>
      <!-- Loading -->
      <div
        v-if="pending"
        class="order-page__loading"
      >
        <AppSkeleton
          width="100%"
          height="200px"
          border-radius="16px"
        />
      </div>

      <!-- Error -->
      <div
        v-else-if="error || !order"
        class="order-page__error"
      >
        <p>Замовлення не знайдено.</p>
        <NuxtLink
          to="/cabinet?section=orders"
          class="order-page__error-link"
          >Мої замовлення</NuxtLink
        >
      </div>

      <!-- Content -->
      <template v-else>
        <!-- Success banner -->
        <div class="order-page__banner">
          <div class="order-page__banner-icon">
            <CheckCircle2 :size="40" />
          </div>
          <div class="order-page__banner-body">
            <h1 class="order-page__banner-title">Замовлення оформлено!</h1>
            <p class="order-page__banner-sub">
              Номер замовлення: <strong>{{ order.orderNumber }}</strong> &nbsp;·&nbsp;
              {{ formatDate(order.createdAt) }}
            </p>
          </div>
          <span
            :class="[
              'order-page__status',
              `order-page__status--${STATUS_COLOR[order.status as OrderStatus]}`,
            ]"
          >
            {{ ordersStore.getStatusLabel(order.status as OrderStatus) }}
          </span>
        </div>

        <!-- Grid -->
        <div class="order-page__layout">
          <!-- Left: items + address -->
          <div class="order-page__main">
            <!-- Items -->
            <section class="order-page__card">
              <h2 class="order-page__card-title"><Package :size="16" />Склад замовлення</h2>
              <div class="order-page__items">
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="order-page__item"
                >
                  <div class="order-page__item-info">
                    <p class="order-page__item-title">{{ item.productTitle }}</p>
                    <p
                      v-if="item.sku"
                      class="order-page__item-sku"
                    >
                      SKU: {{ item.sku }}
                    </p>
                    <p
                      v-if="item.variant"
                      class="order-page__item-variant"
                    >
                      {{ (item.variant as any).title }}
                    </p>
                  </div>
                  <div class="order-page__item-qty">× {{ item.quantity }}</div>
                  <div class="order-page__item-price">
                    {{ ordersStore.formatMoney(item.totalPrice, order.currency) }}
                  </div>
                </div>
              </div>
            </section>

            <!-- Delivery address -->
            <section
              v-if="order.deliveryAddressSnapshot"
              class="order-page__card order-page__card--fill"
            >
              <h2 class="order-page__card-title"><MapPin :size="16" />Адреса доставки</h2>
              <div class="order-page__address">
                <p>
                  <User :size="13" />
                  {{ order.deliveryAddressSnapshot.recipientName }}
                </p>
                <p>
                  <Phone :size="13" />
                  {{ order.deliveryAddressSnapshot.phone }}
                </p>
                <p>
                  <MapPin :size="13" />
                  {{ order.deliveryAddressSnapshot.city }},
                  {{ order.deliveryAddressSnapshot.street }}, буд.
                  {{ order.deliveryAddressSnapshot.house }}
                  <template v-if="order.deliveryAddressSnapshot.apartment">
                    , кв. {{ order.deliveryAddressSnapshot.apartment }}
                  </template>
                </p>
              </div>
            </section>

            <!-- Notes -->
            <section
              v-if="order.notes"
              class="order-page__card"
            >
              <h2 class="order-page__card-title"><FileText :size="16" />Коментар</h2>
              <p class="order-page__notes">{{ order.notes }}</p>
            </section>
          </div>

          <!-- Right: summary + actions -->
          <aside class="order-page__aside">
            <div class="order-page__summary">
              <h2 class="order-page__summary-title">Разом</h2>

              <div class="order-page__summary-row">
                <span>Товари</span>
                <span>{{ ordersStore.formatMoney(order.subtotalPrice, order.currency) }}</span>
              </div>
              <div
                v-if="parseFloat(order.discountAmount) > 0"
                class="order-page__summary-row order-page__summary-row--discount"
              >
                <span>Знижка</span>
                <span>− {{ ordersStore.formatMoney(order.discountAmount, order.currency) }}</span>
              </div>
              <div class="order-page__summary-row">
                <span>Доставка</span>
                <span>{{
                  parseFloat(order.deliveryPrice) === 0
                    ? 'Безкоштовно'
                    : ordersStore.formatMoney(order.deliveryPrice, order.currency)
                }}</span>
              </div>

              <div class="order-page__summary-total">
                <span>До сплати</span>
                <span>{{ ordersStore.formatMoney(order.totalPrice, order.currency) }}</span>
              </div>

              <div class="order-page__summary-actions">
                <NuxtLink
                  to="/catalog"
                  class="order-page__btn order-page__btn--primary"
                >
                  Продовжити покупки
                </NuxtLink>
                <NuxtLink
                  to="/cabinet?section=orders"
                  class="order-page__btn order-page__btn--outline"
                >
                  Мої замовлення <ChevronRight :size="14" />
                </NuxtLink>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </template>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.order-page {
  padding-block: 32px;

  &__breadcrumbs {
    margin-bottom: 24px;
  }

  &__loading,
  &__error {
    padding: 48px 0;
    text-align: center;
    color: $color-gray-500;
  }

  &__error-link {
    color: $color-primary;
    text-decoration: underline;
    margin-top: 8px;
    display: inline-block;
  }

  // ── Guest success (no account to fetch the full order back from) ──────────
  &__guest {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__guest-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
  }

  &__guest-cta {
    align-self: flex-start;
  }

  // ── Banner ───────────────────────────────────────────────────────────────
  &__banner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 24px 28px;
    background: $color-white;
    border-radius: $radius-xl;
    box-shadow: $shadow-card;
    margin-bottom: 24px;

    @include mixins.respond-to(mobile) {
      flex-direction: row;
      align-items: center;
      gap: 20px;
    }
  }

  &__banner-icon {
    width: 64px;
    height: 64px;
    border-radius: $radius-full;
    background: rgb(34 197 94 / 10%);
    color: $color-success;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__banner-body {
    flex: 1;
  }

  &__banner-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 4px;
  }

  &__banner-sub {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin: 0;
  }

  &__status {
    padding: 5px 14px;
    border-radius: $radius-full;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    white-space: nowrap;
    flex-shrink: 0;

    &--primary {
      background: rgb(99 102 241 / 10%);
      color: $color-primary;
    }
    &--warning {
      background: rgb(234 179 8 / 12%);
      color: $color-warning;
    }
    &--success {
      background: rgb(34 197 94 / 10%);
      color: $color-success;
    }
    &--danger {
      background: rgb(239 68 68 / 10%);
      color: $color-danger;
    }
    &--info {
      background: rgb(6 182 212 / 10%);
      color: #0891b2;
    }
  }

  // ── Layout ───────────────────────────────────────────────────────────────
  &__layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    align-items: stretch;

    @include mixins.respond-to(notebook) {
      grid-template-columns: 1fr 320px;
    }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  // ── Card ─────────────────────────────────────────────────────────────────
  &__card {
    background: $color-white;
    border-radius: $radius-xl;
    box-shadow: $shadow-card;
    padding: 20px 24px;

    &--fill {
      flex: 1;
    }
  }

  &__card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin: 0 0 16px;

    svg {
      color: $color-primary;
    }
  }

  // ── Items ────────────────────────────────────────────────────────────────
  &__items {
    display: flex;
    flex-direction: column;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid $color-gray-100;

    &:last-child {
      border-bottom: none;
    }
  }

  &__item-info {
    flex: 1;
    min-width: 0;
  }

  &__item-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-900;
    margin: 0 0 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-sku,
  &__item-variant {
    font-size: $font-size-xs;
    color: $color-gray-400;
    margin: 0;
  }

  &__item-qty {
    font-size: $font-size-sm;
    color: $color-gray-500;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__item-price {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 100px;
    text-align: right;
  }

  // ── Address ──────────────────────────────────────────────────────────────
  &__address {
    display: flex;
    flex-direction: column;
    gap: 8px;

    p {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: $font-size-sm;
      color: $color-gray-700;
      margin: 0;

      svg {
        color: $color-primary;
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
  }

  &__notes {
    font-size: $font-size-sm;
    color: $color-gray-600;
    margin: 0;
    line-height: $line-height-relaxed;
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  &__aside {
    position: sticky;
    top: 80px;
  }

  &__summary {
    background: $color-white;
    border-radius: $radius-xl;
    box-shadow: $shadow-card;
    padding: 20px 24px;
  }

  &__summary-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid $color-gray-100;
  }

  &__summary-row {
    display: flex;
    justify-content: space-between;
    font-size: $font-size-sm;
    color: $color-gray-600;
    margin-bottom: 10px;

    &--discount {
      color: $color-success;
    }
  }

  &__summary-total {
    display: flex;
    justify-content: space-between;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    padding-top: 12px;
    border-top: 1px solid $color-gray-100;
    margin-top: 4px;
    margin-bottom: 20px;
  }

  &__summary-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  // ── Buttons ───────────────────────────────────────────────────────────────
  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 20px;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    text-decoration: none;
    transition:
      background $transition-fast,
      color $transition-fast,
      border-color $transition-fast;

    &--primary {
      background: $color-primary;
      color: $color-white;
      &:hover {
        background: $color-primary-dark;
      }
    }

    &--outline {
      border: 1px solid $color-gray-200;
      color: $color-gray-700;
      &:hover {
        border-color: $color-primary;
        color: $color-primary;
      }
    }
  }
}
</style>

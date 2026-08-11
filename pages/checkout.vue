<script setup lang="ts">
import { checkoutSchema, CHECKOUT_ERROR_MESSAGES } from '~/contracts/checkout'
import type { Address } from '~/contracts/addresses'
import type { NpSettlement, NpWarehouse } from '~/contracts/delivery'

useSeoMeta({ title: 'Оформлення замовлення — Honey Store', robots: 'noindex, follow' })
useCanonical()

const cartStore = useCartStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const { authFetch } = useAuthFetch()

// If cart is empty redirect to cart page
if (process.client && !cartStore.items.length) navigateTo('/cart')

const savedAddresses = ref<Address[]>([])
const selectedAddressId = ref<number | null>(null)
const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  recipientName: '',
  phone: '',
  street: '',
  house: '',
  apartment: '',
  notes: '',
})

// Delivery method: np_branch — pickup at a Nova Poshta warehouse; np_courier — Nova Poshta courier
// to a door address (no delivery-time-slot choice, NP doesn't expose that).
const deliveryMethod = ref<'np_branch' | 'np_courier'>('np_branch')
const selectedCity = ref<NpSettlement | null>(null)
const selectedWarehouse = ref<NpWarehouse | null>(null)

// Payment method: 'card' isn't wired up to an acquirer yet — selectable for now, backend/redirect flow comes next.
const paymentMethod = ref<'cod' | 'card'>('cod')
const noCallback = ref(false)

const errors = ref<Partial<Record<keyof typeof form | 'npCityRef' | 'npWarehouseRef', string>>>({})

function formatPrice(p: number) {
  return p.toLocaleString('uk-UA') + ' ₴'
}

// Prefill from user profile
onMounted(async () => {
  if (authStore.user) {
    form.recipientName = `${authStore.user.firstName ?? ''} ${authStore.user.lastName ?? ''}`.trim()
    if (authStore.user.phone) form.phone = authStore.user.phone
  }

  // Load saved addresses — shown only once "Кур'єр" delivery is picked, not auto-applied here,
  // since the default method is Nova Poshta warehouse pickup (no street address involved).
  if (authStore.isLoggedIn) {
    loading.value = true
    try {
      const res = await authFetch<{ data: Address[] }>('/api/addresses')
      savedAddresses.value = res.data
    } catch {
    } finally {
      loading.value = false
    }
  }
})

function applyAddress(addr: Address) {
  selectedAddressId.value = addr.id
  selectedCity.value = null
  selectedWarehouse.value = null
  if (addr.recipientName) form.recipientName = addr.recipientName
  if (addr.phone) form.phone = addr.phone
}

function selectAddress(addr: Address) {
  applyAddress(addr)
}

function selectNpBranchDelivery() {
  deliveryMethod.value = 'np_branch'
  selectedAddressId.value = null
}

async function submit() {
  errors.value = {}
  const usingSavedAddress = !!selectedAddressId.value

  const result = checkoutSchema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach((e) => {
      const key = e.path[0] as keyof typeof form
      if (!errors.value[key]) errors.value[key] = e.message
    })
    return
  }

  if (!usingSavedAddress) {
    if (!selectedCity.value) errors.value.npCityRef = 'Оберіть місто зі списку'
    if (deliveryMethod.value === 'np_branch' && !selectedWarehouse.value) {
      errors.value.npWarehouseRef = 'Оберіть відділення зі списку'
    }
    if (deliveryMethod.value === 'np_courier') {
      if (!form.street.trim()) errors.value.street = 'Введіть вулицю'
      if (!form.house.trim()) errors.value.house = 'Введіть номер будинку'
    }
    if (Object.keys(errors.value).length) return
  }

  submitting.value = true
  try {
    const body = {
      ...(usingSavedAddress
        ? { addressId: selectedAddressId.value }
        : {
            deliveryAddress: {
              recipientName: form.recipientName,
              phone: form.phone,
              deliveryMethod: deliveryMethod.value,
              city: selectedCity.value?.present ?? '',
              npCityRef: selectedCity.value?.deliveryCityRef,
              ...(deliveryMethod.value === 'np_branch'
                ? {
                    npWarehouseRef: selectedWarehouse.value?.ref,
                    npWarehouseNumber: selectedWarehouse.value?.number,
                    npWarehouseAddress: selectedWarehouse.value?.shortAddress,
                  }
                : {
                    street: form.street,
                    house: form.house,
                    apartment: form.apartment || undefined,
                  }),
            },
          }),
      // Not yet persisted by the backend — see checkout notes.
      paymentMethod: paymentMethod.value,
      noCallback: noCallback.value,
      notes: form.notes || undefined,
    }

    const res = await authFetch<{ data: { id: number } }>('/api/orders', { method: 'POST', body })
    await cartStore.clear()

    if (paymentMethod.value === 'card') {
      try {
        const pay = await authFetch<{ data: { pageUrl: string } }>(
          `/api/orders/${res.data.id}/pay`,
          { method: 'POST' },
        )
        // Full browser redirect — Monobank's checkout page is a different origin,
        // this must not be a SPA navigation.
        window.location.href = pay.data.pageUrl
        return
      } catch {
        toastStore.add(
          'Замовлення оформлено, але не вдалося створити оплату. Спробуйте оплатити ще раз зі сторінки замовлення.',
          'error',
        )
      }
    }

    navigateTo(`/order/${res.data.id}`)
  } catch (err: unknown) {
    const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message
    toastStore.add(
      CHECKOUT_ERROR_MESSAGES[msg ?? ''] ?? 'Не вдалося оформити замовлення. Спробуйте ще раз.',
      'error',
    )
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="checkout container">
    <AppBreadcrumbs
      :crumbs="[
        { label: 'Головна', to: '/' },
        { label: 'Кошик', to: '/cart' },
        { label: 'Оформлення замовлення' },
      ]"
      class="checkout__breadcrumbs"
    />

    <h1 class="checkout__heading">Оформлення замовлення</h1>

    <div class="checkout__layout">
      <!-- Left: form -->
      <div class="checkout__form-col">
        <!-- Delivery form -->
        <div class="checkout__section">
          <h2 class="checkout__section-title">Дані доставки</h2>

          <div class="checkout__method">
            <button
              type="button"
              :class="[
                'checkout__method-option',
                { 'checkout__method-option--active': deliveryMethod === 'np_branch' },
              ]"
              @click="selectNpBranchDelivery"
            >
              Відділення Нової Пошти
            </button>
            <button
              type="button"
              :class="[
                'checkout__method-option',
                { 'checkout__method-option--active': deliveryMethod === 'np_courier' },
              ]"
              @click="deliveryMethod = 'np_courier'"
            >
              Кур'єр
            </button>
          </div>

          <div class="checkout__delivery-grid">
            <div class="checkout__delivery-col">
              <AppInputText
                v-model="form.recipientName"
                label="Ім'я отримувача"
                placeholder="Іван Іванов"
                :error="errors.recipientName"
              />
              <AppInputText
                v-model="form.phone"
                type="phone"
                label="Телефон"
                placeholder="+38 (0##) ###-##-##"
                :error="errors.phone"
              />
            </div>

            <div class="checkout__delivery-col">
              <template v-if="deliveryMethod === 'np_branch'">
                <CheckoutCityAutocomplete
                  v-model="selectedCity"
                  :error="errors.npCityRef"
                />
                <CheckoutWarehouseSelect
                  v-model="selectedWarehouse"
                  :city-ref="selectedCity?.deliveryCityRef ?? null"
                  :error="errors.npWarehouseRef"
                />
              </template>

              <template v-else>
                <div
                  v-if="savedAddresses.length"
                  class="checkout__addresses"
                >
                  <button
                    v-for="addr in savedAddresses"
                    :key="addr.id"
                    :class="[
                      'checkout__address-card',
                      { 'checkout__address-card--active': selectedAddressId === addr.id },
                    ]"
                    type="button"
                    @click="selectAddress(addr)"
                  >
                    <span class="checkout__address-line"
                      >{{ addr.city }}, {{ addr.street }}, {{ addr.house
                      }}<template v-if="addr.apartment">, кв. {{ addr.apartment }}</template></span
                    >
                    <span
                      v-if="addr.isDefault"
                      class="checkout__address-badge"
                      >За замовчуванням</span
                    >
                  </button>
                </div>

                <template v-if="!selectedAddressId">
                  <CheckoutCityAutocomplete
                    v-model="selectedCity"
                    :error="errors.npCityRef"
                  />
                  <div class="checkout__fields-row">
                    <AppInputText
                      v-model="form.street"
                      label="Вулиця"
                      placeholder="вул. Хрещатик"
                      :error="errors.street"
                    />
                    <AppInputText
                      v-model="form.house"
                      label="Будинок"
                      placeholder="1"
                      :error="errors.house"
                    />
                    <AppInputText
                      v-model="form.apartment"
                      label="Квартира"
                      placeholder="42"
                    />
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>

        <!-- Payment -->
        <div class="checkout__section">
          <h2 class="checkout__section-title">Способи оплати</h2>

          <div class="checkout__method">
            <button
              type="button"
              :class="[
                'checkout__method-option',
                { 'checkout__method-option--active': paymentMethod === 'cod' },
              ]"
              @click="paymentMethod = 'cod'"
            >
              Оплата при отриманні
            </button>
            <button
              type="button"
              :class="[
                'checkout__method-option',
                { 'checkout__method-option--active': paymentMethod === 'card' },
              ]"
              @click="paymentMethod = 'card'"
            >
              Карткою онлайн
            </button>
          </div>

          <label class="checkout__checkbox">
            <input
              v-model="noCallback"
              type="checkbox"
            />
            <span>Не передзвонювати мені, замовлення підтверджено</span>
          </label>
        </div>

        <!-- Comment -->
        <div class="checkout__section">
          <h2 class="checkout__section-title">Коментар до замовлення</h2>
          <textarea
            v-model="form.notes"
            class="checkout__textarea"
            placeholder="Додаткова інформація для кур'єра..."
            rows="3"
          />
        </div>
      </div>

      <!-- Right: summary -->
      <aside class="checkout__summary">
        <h2 class="checkout__summary-title">Ваше замовлення</h2>

        <div class="checkout__summary-items">
          <div
            v-for="item in cartStore.items"
            :key="item.product.id"
            class="checkout__summary-item"
          >
            <img
              v-if="item.product.thumbnail"
              :src="item.product.thumbnail"
              :alt="item.product.title"
              class="checkout__summary-img"
            />
            <div class="checkout__summary-info">
              <span class="checkout__summary-name">{{ item.product.title }}</span>
              <span class="checkout__summary-qty">{{ item.qty }} шт.</span>
            </div>
            <span class="checkout__summary-price">{{
              formatPrice((item.product.price ?? 0) * item.qty)
            }}</span>
          </div>
        </div>

        <div class="checkout__summary-rows">
          <div class="checkout__summary-row">
            <span>Товари ({{ cartStore.count }})</span>
            <span>{{ formatPrice(cartStore.total) }}</span>
          </div>
          <div class="checkout__summary-row">
            <span>Доставка</span>
            <span class="checkout__summary-free">Безкоштовно</span>
          </div>
        </div>

        <div class="checkout__summary-total">
          <span>До сплати</span>
          <span>{{ formatPrice(cartStore.total) }}</span>
        </div>

        <AppButton
          variant="gradient"
          size="lg"
          class="checkout__submit"
          :loading="submitting"
          @click="submit"
        >
          Підтвердити замовлення
        </AppButton>
      </aside>
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.checkout {
  padding-block: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  &__breadcrumbs {
    margin-bottom: 8px;
  }

  &__heading {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
  }

  &__layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    align-items: flex-start;

    @include mixins.respond-to(notebook) {
      grid-template-columns: 1fr 360px;
    }
  }

  &__form-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__section {
    background: $color-white;
    border: 1px solid $color-gray-100;
    border-radius: $radius-xl;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__section-title {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    padding-bottom: 16px;
    border-bottom: 1px solid $color-gray-100;
  }

  // Saved addresses
  &__addresses {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__address-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    text-align: left;
    cursor: pointer;
    transition:
      border-color $transition-fast,
      background $transition-fast;

    &:hover {
      border-color: $color-primary;
      background: rgb(79 70 229 / 3%);
    }

    &--active {
      border-color: $color-primary;
      background: rgb(79 70 229 / 6%);
    }
  }

  &__address-line {
    font-size: $font-size-sm;
    color: $color-gray-700;
  }

  &__address-badge {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-primary;
    background: rgb(79 70 229 / 10%);
    padding: 2px 8px;
    border-radius: $radius-full;
    flex-shrink: 0;
  }

  // Delivery form: name/phone in one column, delivery method in the other on wider screens —
  // locked via grid-template-columns so one column's content can't crush the other's.
  &__delivery-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;

    @include mixins.respond-to(mobile) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__delivery-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__fields-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;

    @include mixins.respond-to(mobile) {
      grid-template-columns: 1fr 80px 80px;
    }
  }

  // Delivery method toggle
  &__method {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__method-option {
    padding: 8px 16px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    font-size: $font-size-sm;
    color: $color-gray-500;
    transition:
      border-color $transition-fast,
      color $transition-fast,
      background $transition-fast,
      box-shadow $transition-fast,
      transform $transition-fast;

    &:not(:disabled):hover {
      border-color: $color-primary;
      box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
      transform: translateY(-1px);
    }

    &--active {
      border-color: $color-primary;
      color: $color-primary;
      background: rgb(79 70 229 / 6%);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: $font-size-sm;
    color: $color-gray-700;
    cursor: pointer;

    input[type='checkbox'] {
      accent-color: $color-primary;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }

  // Textarea
  &__textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    font-family: $font-family-base;
    font-size: $font-size-sm;
    color: $color-gray-900;
    resize: vertical;
    outline: none;
    transition: border-color $transition-fast;
    background: $color-white;

    &::placeholder {
      color: $color-gray-400;
    }
    &:focus {
      border-color: $color-primary;
    }
  }

  // Summary
  &__summary {
    background: $color-white;
    border: 1px solid $color-gray-100;
    border-radius: $radius-xl;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: sticky;
    top: 80px;
  }

  &__summary-title {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    padding-bottom: 16px;
    border-bottom: 1px solid $color-gray-100;
  }

  &__summary-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__summary-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__summary-img {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: $radius-md;
    flex-shrink: 0;
    background: $color-gray-100;
  }

  &__summary-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__summary-name {
    max-width: 200px;
    font-size: $font-size-sm;
    color: $color-gray-900;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__summary-qty {
    font-size: $font-size-xs;
    color: $color-gray-400;
  }

  &__summary-price {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    flex-shrink: 0;
  }

  &__summary-rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid $color-gray-100;
  }

  &__summary-row {
    display: flex;
    justify-content: space-between;
    font-size: $font-size-sm;
    color: $color-gray-600;
  }

  &__summary-free {
    color: $color-success;
    font-weight: $font-weight-medium;
  }

  &__summary-total {
    display: flex;
    justify-content: space-between;
    font-size: $font-size-base;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    padding-top: 16px;
    border-top: 1px solid $color-gray-100;
  }

  &__submit {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { MapPin, Star, Trash2, Plus, X } from 'lucide-vue-next'
import { addressSchema } from '~/contracts/addresses'
import type { Address } from '~/contracts/addresses'
import type { NpSettlement, NpStreet } from '~/contracts/delivery'

const { authFetch } = useAuthFetch()
const { searchSettlements, searchStreets } = useNovaPoshta()

const addresses = ref<Address[]>([])
const loading = ref(true)
const showForm = ref(false)
const submitting = ref(false)

const form = reactive({ city: '', street: '', house: '', apartment: '', isDefault: false })
const errors = ref<Record<string, string>>({})

// City autocomplete (Nova Poshta settlements) — form.city stays a plain
// string to match the address contract; the dropdown just fills it in.
// The street search needs the settlement's `deliveryCityRef` though, so that
// part of the selection is kept on the side rather than in the form.
const citySuggestions = ref<NpSettlement[]>([])
const cityDropdownOpen = ref(false)
const cityLoading = ref(false)
const selectedCityRef = ref<string | null>(null)
let cityDebounceTimer: ReturnType<typeof setTimeout>

function onCityInput() {
  selectedCityRef.value = null
  clearTimeout(cityDebounceTimer)
  const q = form.city.trim()
  if (q.length < 2) {
    citySuggestions.value = []
    cityDropdownOpen.value = false
    return
  }
  cityDebounceTimer = setTimeout(async () => {
    cityLoading.value = true
    try {
      citySuggestions.value = await searchSettlements(q)
      cityDropdownOpen.value = true
    } finally {
      cityLoading.value = false
    }
  }, 300)
}

function selectCity(settlement: NpSettlement) {
  form.city = settlement.present
  selectedCityRef.value = settlement.deliveryCityRef
  citySuggestions.value = []
  cityDropdownOpen.value = false
  // The previously picked street belongs to the old city — it no longer
  // applies once the city changes.
  form.street = ''
}

function onCityFocus() {
  if (citySuggestions.value.length) cityDropdownOpen.value = true
}

function onCityBlur() {
  cityDropdownOpen.value = false
}

// Street autocomplete — same shape as city, scoped to the selected city's ref
// and disabled until one is actually picked (NP's street search requires it).
const streetSuggestions = ref<NpStreet[]>([])
const streetDropdownOpen = ref(false)
const streetLoading = ref(false)
let streetDebounceTimer: ReturnType<typeof setTimeout>

function onStreetInput() {
  clearTimeout(streetDebounceTimer)
  const cityRef = selectedCityRef.value
  const q = form.street.trim()
  if (!cityRef || q.length < 2) {
    streetSuggestions.value = []
    streetDropdownOpen.value = false
    return
  }
  streetDebounceTimer = setTimeout(async () => {
    streetLoading.value = true
    try {
      streetSuggestions.value = await searchStreets(cityRef, q)
      streetDropdownOpen.value = true
    } finally {
      streetLoading.value = false
    }
  }, 300)
}

function selectStreet(street: NpStreet) {
  form.street = `${street.type} ${street.name}`.trim()
  streetSuggestions.value = []
  streetDropdownOpen.value = false
}

function onStreetFocus() {
  if (streetSuggestions.value.length) streetDropdownOpen.value = true
}

function onStreetBlur() {
  streetDropdownOpen.value = false
}

async function load() {
  loading.value = true
  try {
    const res = await authFetch<{ data: Address[] }>('/api/addresses')
    addresses.value = res.data
  } finally {
    loading.value = false
  }
}

async function submit() {
  const result = addressSchema.safeParse(form)
  if (!result.success) {
    errors.value = Object.fromEntries(
      Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? '']),
    )
    return
  }
  errors.value = {}
  submitting.value = true
  try {
    await authFetch('/api/addresses', { method: 'POST', body: result.data })
    form.city = ''
    form.street = ''
    form.house = ''
    form.apartment = ''
    form.isDefault = false
    selectedCityRef.value = null
    showForm.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

async function setDefault(id: number) {
  await authFetch(`/api/addresses/${id}`, { method: 'PATCH', body: { isDefault: true } })
  await load()
}

async function deleteAddress(id: number) {
  await authFetch(`/api/addresses/${id}`, { method: 'DELETE' })
  addresses.value = addresses.value.filter((a) => a.id !== id)
}

onMounted(load)
</script>

<template>
  <div class="cab-addr">
    <div class="cab-addr__header">
      <h2 class="cab-addr__title">Адреса доставки</h2>
      <AppButton
        variant="outline"
        size="sm"
        class="cab-addr__add-btn"
        @click="showForm = !showForm"
      >
        <component
          :is="showForm ? X : Plus"
          :size="14"
        />
        <span class="cab-addr__btn-label">{{ showForm ? 'Скасувати' : 'Додати адресу' }}</span>
      </AppButton>
    </div>

    <!-- Add form -->
    <Transition name="slide-down">
      <div
        v-if="showForm"
        class="cab-addr__form"
      >
        <div class="cab-addr__grid">
          <div class="cab-addr__field">
            <label class="cab-addr__label">Місто *</label>
            <div class="cab-addr__autocomplete">
              <input
                v-model="form.city"
                class="cab-addr__input"
                :class="{ 'cab-addr__input--error': errors.city }"
                placeholder="Київ"
                autocomplete="off"
                @input="onCityInput"
                @focus="onCityFocus"
                @blur="onCityBlur"
              />
              <ul
                v-if="cityDropdownOpen && citySuggestions.length"
                class="cab-addr__dropdown"
              >
                <li
                  v-for="settlement in citySuggestions"
                  :key="settlement.ref"
                >
                  <button
                    type="button"
                    class="cab-addr__dropdown-option"
                    @mousedown.prevent="selectCity(settlement)"
                  >
                    {{ settlement.present }}
                  </button>
                </li>
              </ul>
              <p
                v-else-if="cityDropdownOpen && !cityLoading"
                class="cab-addr__dropdown-empty"
              >
                Нічого не знайдено
              </p>
            </div>
            <span
              v-if="errors.city"
              class="cab-addr__error"
              >{{ errors.city }}</span
            >
          </div>

          <div class="cab-addr__field">
            <label class="cab-addr__label">Вулиця *</label>
            <div class="cab-addr__autocomplete">
              <input
                v-model="form.street"
                class="cab-addr__input"
                :class="{ 'cab-addr__input--error': errors.street }"
                :disabled="!selectedCityRef"
                :placeholder="selectedCityRef ? 'вул. Хрещатик' : 'Спочатку оберіть місто'"
                autocomplete="off"
                @input="onStreetInput"
                @focus="onStreetFocus"
                @blur="onStreetBlur"
              />
              <ul
                v-if="streetDropdownOpen && streetSuggestions.length"
                class="cab-addr__dropdown"
              >
                <li
                  v-for="street in streetSuggestions"
                  :key="street.ref"
                >
                  <button
                    type="button"
                    class="cab-addr__dropdown-option"
                    @mousedown.prevent="selectStreet(street)"
                  >
                    {{ street.type }} {{ street.name }}
                  </button>
                </li>
              </ul>
              <p
                v-else-if="streetDropdownOpen && !streetLoading"
                class="cab-addr__dropdown-empty"
              >
                Нічого не знайдено
              </p>
            </div>
            <span
              v-if="errors.street"
              class="cab-addr__error"
              >{{ errors.street }}</span
            >
          </div>

          <div class="cab-addr__field">
            <label class="cab-addr__label">Будинок *</label>
            <input
              v-model="form.house"
              class="cab-addr__input"
              :class="{ 'cab-addr__input--error': errors.house }"
              placeholder="10"
            />
            <span
              v-if="errors.house"
              class="cab-addr__error"
              >{{ errors.house }}</span
            >
          </div>

          <div class="cab-addr__field">
            <label class="cab-addr__label">Квартира</label>
            <input
              v-model="form.apartment"
              class="cab-addr__input"
              placeholder="42"
            />
          </div>
        </div>

        <div class="cab-addr__form-footer">
          <label class="cab-addr__checkbox">
            <input
              v-model="form.isDefault"
              type="checkbox"
            />
            <span>Зробити основною</span>
          </label>

          <AppButton
            variant="primary"
            size="md"
            :loading="submitting"
            @click="submit"
          >
            Зберегти адресу
          </AppButton>
        </div>
      </div>
    </Transition>

    <!-- Loading -->
    <div
      v-if="loading"
      class="cab-addr__list"
    >
      <AppSkeleton
        v-for="n in 2"
        :key="n"
        width="100%"
        height="80px"
        border-radius="12px"
      />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!addresses.length && !showForm"
      class="cab-addr__empty"
    >
      <MapPin
        :size="40"
        class="cab-addr__empty-icon"
      />
      <p>Немає збережених адрес</p>
    </div>

    <!-- List -->
    <div
      v-else-if="addresses.length"
      class="cab-addr__list"
    >
      <div
        v-for="addr in addresses"
        :key="addr.id"
        class="cab-addr__item"
      >
        <MapPin
          :size="18"
          class="cab-addr__item-icon"
        />
        <div class="cab-addr__item-body">
          <span class="cab-addr__item-text">
            {{ addr.city }}, {{ addr.street }}, {{ addr.house }}
            <template v-if="addr.apartment">, кв. {{ addr.apartment }}</template>
          </span>
          <span
            v-if="addr.isDefault"
            class="cab-addr__badge"
            >Основна</span
          >
        </div>
        <div class="cab-addr__item-actions">
          <button
            v-if="!addr.isDefault"
            class="cab-addr__action-btn"
            title="Зробити основною"
            @click="setDefault(addr.id)"
          >
            <Star :size="15" />
          </button>
          <button
            class="cab-addr__action-btn cab-addr__action-btn--danger"
            title="Видалити"
            @click="deleteAddress(addr.id)"
          >
            <Trash2 :size="15" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.cab-addr {
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__add-btn {
    --btn-min-width: 0;
    --btn-padding: 0;
    width: 32px;
    height: 32px;
    flex-shrink: 0;

    @include mixins.respond-to(tablet) {
      --btn-min-width: 165px;
      --btn-padding: 6px 12px;
      width: auto;
      height: auto;
    }
  }

  &__btn-label {
    display: none;

    @include mixins.respond-to(tablet) {
      display: inline;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid $color-gray-100;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-heading;
  }

  &__form {
    background: $color-gray-50;
    border: 1px solid $color-gray-100;
    border-radius: $radius-lg;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    @include mixins.respond-to(mobile) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__input {
    width: 100%;
    height: 40px;
    padding: 0 12px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    font-family: $font-family-base;
    background: $color-white;
    color: $color-gray-900;
    outline: none;
    transition: border-color $transition-fast;
    &:focus {
      border-color: $color-primary;
    }
    &:disabled {
      background: $color-gray-50;
      color: $color-gray-400;
      cursor: not-allowed;
    }
    &--error {
      border-color: $color-danger;
    }
  }

  &__autocomplete {
    position: relative;
    width: 100%;
  }

  &__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    inset-inline: 0;
    z-index: $z-dropdown;
    max-height: 220px;
    overflow-y: auto;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
  }

  &__dropdown-option {
    display: block;
    width: 100%;
    padding: 9px 12px;
    text-align: left;
    font-size: $font-size-sm;
    color: $color-gray-900;

    &:hover {
      background: $color-gray-50;
    }
  }

  &__dropdown-empty {
    position: absolute;
    top: calc(100% + 4px);
    inset-inline: 0;
    z-index: $z-dropdown;
    padding: 9px 12px;
    font-size: $font-size-sm;
    color: $color-gray-400;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
  }

  &__error {
    font-size: $font-size-xs;
    color: $color-danger;
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: $font-size-sm;
    color: $color-gray-700;
    cursor: pointer;
  }

  &__form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid $color-gray-100;
    border-radius: $radius-lg;
    background: $color-white;
  }

  &__item-icon {
    color: $color-gray-400;
    flex-shrink: 0;
  }

  &__item-body {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  &__item-text {
    font-size: $font-size-sm;
    color: $color-gray-700;
  }

  &__badge {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-primary;
    background: rgb(79 70 229 / 8%);
    padding: 2px 8px;
    border-radius: $radius-full;
  }

  &__item-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  &__action-btn {
    width: 30px;
    height: 30px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-gray-400;
    cursor: pointer;
    transition:
      background $transition-fast,
      color $transition-fast;
    &:hover {
      background: $color-gray-100;
      color: $color-gray-700;
    }
    &--danger:hover {
      background: rgb(239 68 68 / 8%);
      color: $color-danger;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 0;
    color: $color-gray-400;
    font-size: $font-size-sm;
    text-align: center;
  }

  &__empty-icon {
    color: $color-gray-200;
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

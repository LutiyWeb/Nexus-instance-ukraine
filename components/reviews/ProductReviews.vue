<script setup lang="ts">
import { MessageSquare, X } from 'lucide-vue-next'
import { reviewSchema } from '~/contracts/reviews'
import type { Review } from '~/types/review'

const props = defineProps<{ productId: number }>()

const authStore = useAuthStore()
const uiStore = useUiStore()
const toastStore = useToastStore()
const config = useRuntimeConfig()
const { authFetch } = useAuthFetch()

interface ApiReview {
  id: number
  rating: number
  text: string
  createdAt: string
  user: { firstName: string | null; lastName: string | null }
}

interface ReviewsListResponse {
  data: ApiReview[]
  meta: { page: number; totalPages: number }
  summary: {
    total: number
    avg: number | null
    ratingCounts: Record<'1' | '2' | '3' | '4' | '5', number>
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
}

function mapReview(r: ApiReview): Review {
  const name = `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() || 'Анонім'
  return {
    id: r.id,
    author: name,
    initials: initials(name),
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt,
  }
}

const PAGE_SIZE = 6

const reviews = ref<Review[]>([])
const page = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const avgRating = ref(0)
const rawRatingCounts = ref<Record<'1' | '2' | '3' | '4' | '5', number>>({
  '1': 0,
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 0,
})
const loading = ref(true)
const loadingMore = ref(false)

const hasMore = computed(() => page.value < totalPages.value)
// Backend keys counts by star value (1..5); the bars render 5★ first.
const ratingCounts = computed(() =>
  [5, 4, 3, 2, 1].map((n) => rawRatingCounts.value[String(n) as '1' | '2' | '3' | '4' | '5']),
)

async function fetchReviews(targetPage: number) {
  const res = await $fetch<ReviewsListResponse>(
    `${config.public.apiBase}/api/products/${props.productId}/reviews`,
    { query: { page: targetPage, limit: PAGE_SIZE } },
  )
  const mapped = res.data.map(mapReview)
  reviews.value = targetPage === 1 ? mapped : [...reviews.value, ...mapped]
  page.value = res.meta.page
  totalPages.value = res.meta.totalPages
  totalCount.value = res.summary.total
  avgRating.value = res.summary.avg ?? 0
  rawRatingCounts.value = res.summary.ratingCounts
}

onMounted(async () => {
  try {
    await fetchReviews(1)
  } catch {
    toastStore.add('Не вдалося завантажити відгуки', 'error')
  } finally {
    loading.value = false
  }
})

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  try {
    await fetchReviews(page.value + 1)
  } catch {
    toastStore.add('Не вдалося завантажити відгуки', 'error')
  } finally {
    loadingMore.value = false
  }
}

// в”Ђв”Ђ Dialog в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const dialogOpen = ref(false)

function openDialog() {
  if (!authStore.isLoggedIn) {
    uiStore.authModalOpen = true
    return
  }
  formRating.value = 0
  formText.value = ''
  formErrors.value = {}
  dialogOpen.value = true
}

// в”Ђв”Ђ Form в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const formRating = ref(0)
const formText = ref('')
const formErrors = ref<{ rating?: string; text?: string }>({})
const submitting = ref(false)

async function submit() {
  formErrors.value = {}
  const result = reviewSchema.safeParse({ rating: formRating.value, text: formText.value })
  if (!result.success) {
    result.error.issues.forEach((e) => {
      const key = e.path[0] as 'rating' | 'text'
      if (!formErrors.value[key]) formErrors.value[key] = e.message
    })
    return
  }

  submitting.value = true
  try {
    await authFetch(`/api/products/${props.productId}/reviews`, {
      method: 'POST',
      body: { rating: formRating.value, text: formText.value },
    })
    dialogOpen.value = false
    toastStore.add('Відгук успішно додано!')
    await fetchReviews(1)
  } catch (err: any) {
    const status = err?.response?.status ?? err?.statusCode
    toastStore.add(
      status === 409 ? 'Ви вже залишили відгук на цей товар' : 'Не вдалося надіслати відгук',
      'error',
    )
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="product-reviews">
    <!-- Header -->
    <div class="product-reviews__header">
      <div class="product-reviews__header-left">
        <h2 class="product-reviews__title">Відгуки</h2>
        <span
          v-if="!loading"
          class="product-reviews__count"
          >{{ totalCount }}</span
        >
      </div>
      <AppButton
        variant="primary"
        size="md"
        @click="openDialog"
      >
        <MessageSquare :size="16" />
        Написати відгук
      </AppButton>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="product-reviews__summary"
    >
      <AppSkeleton
        width="100%"
        height="96px"
        border-radius="12px"
      />
    </div>

    <!-- Summary -->
    <div
      v-else-if="totalCount"
      class="product-reviews__summary"
    >
      <div class="product-reviews__avg">
        <span class="product-reviews__avg-num">{{ avgRating }}</span>
        <ReviewStars
          :rating="avgRating"
          :size="20"
        />
        <span class="product-reviews__avg-sub">{{ totalCount }} відгуків</span>
      </div>
      <div class="product-reviews__bars">
        <div
          v-for="(count, i) in ratingCounts"
          :key="i"
          class="product-reviews__bar-row"
        >
          <span class="product-reviews__bar-label">{{ 5 - i }} ★</span>
          <div class="product-reviews__bar-track">
            <div
              class="product-reviews__bar-fill"
              :style="{ width: totalCount ? `${(count / totalCount) * 100}%` : '0%' }"
            />
          </div>
          <span class="product-reviews__bar-count">{{ count }}</span>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="product-reviews__empty"
    >
      <MessageSquare
        :size="40"
        class="product-reviews__empty-icon"
      />
      <p>Відгуків поки немає. Будьте першим!</p>
    </div>

    <!-- List -->
    <div
      v-if="reviews.length"
      class="product-reviews__list"
    >
      <ReviewCard
        v-for="review in reviews"
        :key="review.id"
        :review="review"
      />
    </div>

    <!-- Load more -->
    <div
      v-if="hasMore"
      class="product-reviews__more"
    >
      <AppButton
        variant="outline"
        size="md"
        :loading="loadingMore"
        @click="loadMore"
      >
        Показати ще
      </AppButton>
    </div>

    <!-- Dialog -->
    <Teleport to="body">
      <div
        v-if="dialogOpen"
        class="review-dialog-overlay"
        @click.self="dialogOpen = false"
      >
        <div class="review-dialog">
          <div class="review-dialog__head">
            <h3 class="review-dialog__title">Написати відгук</h3>
            <button
              class="review-dialog__close"
              type="button"
              @click="dialogOpen = false"
            >
              <X :size="14" />
            </button>
          </div>

          <div class="review-dialog__body">
            <!-- Star picker -->
            <div class="review-dialog__field">
              <label class="review-dialog__label">Оцінка</label>
              <ReviewStars
                v-model:rating="formRating"
                :size="28"
                interactive
              />
              <span
                v-if="formErrors.rating"
                class="review-dialog__error"
                >{{ formErrors.rating }}</span
              >
            </div>

            <!-- Text -->
            <div class="review-dialog__field">
              <label class="review-dialog__label">Ваш відгук</label>
              <textarea
                v-model="formText"
                class="review-dialog__textarea"
                :class="{ 'review-dialog__textarea--error': formErrors.text }"
                placeholder="Розкажіть про свій досвід використання товару..."
                rows="5"
              />
              <div class="review-dialog__field-footer">
                <span
                  v-if="formErrors.text"
                  class="review-dialog__error"
                  >{{ formErrors.text }}</span
                >
                <span class="review-dialog__char-count">{{ formText.length }} / 1000</span>
              </div>
            </div>
          </div>

          <div class="review-dialog__footer">
            <AppButton
              variant="outline"
              size="md"
              @click="dialogOpen = false"
              >Скасувати</AppButton
            >
            <AppButton
              variant="primary"
              size="md"
              :loading="submitting"
              @click="submit"
            >
              Надіслати відгук
            </AppButton>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.product-reviews {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 12px;
  border-top: 1px solid $color-gray-100;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-heading;
  }

  &__count {
    background: $color-gray-100;
    color: $color-gray-600;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;
    padding: 2px 10px;
  }

  // Summary block
  &__summary {
    display: flex;
    gap: 32px;
    padding: 24px;
    background: $color-gray-50;
    border-radius: $radius-xl;
    border: 1px solid $color-gray-100;
    flex-wrap: wrap;
  }

  &__avg {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 100px;
  }

  &__avg-num {
    font-size: 48px;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    line-height: 1;
  }

  &__avg-sub {
    font-size: $font-size-xs;
    color: $color-gray-400;
  }

  &__bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    justify-content: center;
  }

  &__bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__bar-label {
    font-size: $font-size-xs;
    color: $color-gray-500;
    width: 28px;
    flex-shrink: 0;
  }

  &__bar-track {
    flex: 1;
    height: 6px;
    background: $color-gray-200;
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    background: $color-warning;
    border-radius: $radius-full;
    transition: width 0.4s ease;
  }

  &__bar-count {
    font-size: $font-size-xs;
    color: $color-gray-400;
    width: 16px;
    text-align: right;
    flex-shrink: 0;
  }

  // Empty
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 48px 0;
    color: $color-gray-400;
    text-align: center;
    font-size: $font-size-sm;
  }

  &__empty-icon {
    color: $color-gray-200;
  }

  // List
  &__list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    @include mixins.respond-to(mobile) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  // More button
  &__more {
    display: flex;
    justify-content: center;
  }
}

// в”Ђв”Ђ Review Dialog в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
.review-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 50%);
  z-index: $z-modal;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.15s ease;
}

.review-dialog {
  background: $color-white;
  border-radius: $radius-xl;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 24px 48px rgb(0 0 0 / 20%);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.2s ease;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid $color-gray-100;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__close {
    width: 32px;
    height: 32px;
    border-radius: $radius-full;
    background: $color-gray-100;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background $transition-fast;
    &:hover {
      background: $color-gray-200;
    }
  }

  &__body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    font-family: $font-family-base;
    font-size: $font-size-sm;
    color: $color-gray-900;
    resize: vertical;
    min-height: 120px;
    outline: none;
    transition: border-color $transition-fast;
    background: $color-white;

    &::placeholder {
      color: $color-gray-400;
    }
    &:focus {
      border-color: $color-primary;
    }
    &--error {
      border-color: $color-danger;
    }
  }

  &__field-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__error {
    font-size: $font-size-xs;
    color: $color-danger;
  }

  &__char-count {
    font-size: $font-size-xs;
    color: $color-gray-400;
    margin-left: auto;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px 24px;
    border-top: 1px solid $color-gray-100;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

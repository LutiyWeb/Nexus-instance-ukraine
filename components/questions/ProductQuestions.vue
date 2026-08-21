<script setup lang="ts">
import { MessageCircleQuestion } from 'lucide-vue-next'
import type { Question } from '~/types/question'

const props = defineProps<{ productId: number }>()

const config = useRuntimeConfig()
const toastStore = useToastStore()

interface ApiQuestion {
  id: number
  text: string
  answer: string | null
  answeredAt: string | null
  createdAt: string
  user: { firstName: string | null; lastName: string | null }
}

interface QuestionsListResponse {
  data: ApiQuestion[]
  meta: { page: number; totalPages: number }
}

const PAGE_SIZE = 6

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
}

function mapQuestion(q: ApiQuestion): Question {
  const name = `${q.user.firstName ?? ''} ${q.user.lastName ?? ''}`.trim() || 'Анонім'
  return {
    id: q.id,
    author: name,
    initials: initials(name),
    text: q.text,
    createdAt: q.createdAt,
    answer: q.answer ?? undefined,
    answeredAt: q.answeredAt ?? undefined,
  }
}

const questions = ref<Question[]>([])
const page = ref(1)
const totalPages = ref(1)
const loading = ref(true)
const loadingMore = ref(false)

const hasMore = computed(() => page.value < totalPages.value)

async function fetchQuestions(targetPage: number) {
  const res = await $fetch<QuestionsListResponse>(
    `${config.public.apiBase}/api/products/${props.productId}/questions`,
    { query: { page: targetPage, limit: PAGE_SIZE } },
  )
  const mapped = res.data.map(mapQuestion)
  questions.value = targetPage === 1 ? mapped : [...questions.value, ...mapped]
  page.value = res.meta.page
  totalPages.value = res.meta.totalPages
}

onMounted(async () => {
  try {
    await fetchQuestions(1)
  } catch {
    toastStore.add('Не вдалося завантажити питання', 'error')
  } finally {
    loading.value = false
  }
})

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  try {
    await fetchQuestions(page.value + 1)
  } catch {
    toastStore.add('Не вдалося завантажити питання', 'error')
  } finally {
    loadingMore.value = false
  }
}

function handleSubmitted() {
  fetchQuestions(1)
}
</script>

<template>
  <section class="product-questions">
    <div class="product-questions__header">
      <div class="product-questions__header-left">
        <h2 class="product-questions__title">Питання</h2>
        <span
          v-if="!loading && questions.length"
          class="product-questions__count"
          >{{ questions.length }}</span
        >
      </div>
      <AskQuestionButton
        :product-id="productId"
        @submitted="handleSubmitted"
      />
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="product-questions__list"
    >
      <AppSkeleton
        v-for="i in 2"
        :key="i"
        width="100%"
        height="140px"
        border-radius="12px"
      />
    </div>

    <div
      v-else-if="questions.length"
      class="product-questions__list"
    >
      <QuestionCard
        v-for="question in questions"
        :key="question.id"
        :question="question"
      />
    </div>

    <AppEmpty
      v-else
      title="Питань поки немає"
      description="Будьте першим, хто задасть питання про цей товар"
    >
      <template #icon>
        <MessageCircleQuestion
          :size="56"
          :stroke-width="1.2"
        />
      </template>
    </AppEmpty>

    <!-- Load more -->
    <div
      v-if="hasMore"
      class="product-questions__more"
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
  </section>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.product-questions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;

  @include mixins.respond-to(notebook) {
    margin-top: 0;
  }

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

  &__list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;

    @include mixins.respond-to(mobile) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__more {
    display: flex;
    justify-content: center;
  }
}
</style>

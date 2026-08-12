<script setup lang="ts">
import { ImageOff } from 'lucide-vue-next'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Адмінка — Баг-репорти' })

interface BugReport {
  id: number
  title: string
  description: string
  image_url: string | null
  created_at: string
}

const authStore = useAuthStore()
const loading = ref(true)
const reports = ref<BugReport[]>([])

onMounted(async () => {
  try {
    const res = await $fetch<{ data: BugReport[] }>('/api/bug-reports', {
      headers: { Authorization: `Bearer ${authStore.token}` },
    })
    reports.value = res.data
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<template>
  <div class="admin-bug-reports">
    <h1 class="admin-bug-reports__heading">Баг-репорти</h1>

    <p v-if="loading">Завантаження...</p>
    <p v-else-if="!reports.length">Звітів ще немає.</p>

    <div
      v-else
      class="admin-bug-reports__list"
    >
      <article
        v-for="report in reports"
        :key="report.id"
        class="admin-bug-reports__item"
      >
        <div class="admin-bug-reports__col">
          <h2 class="admin-bug-reports__title">{{ report.title }}</h2>
          <time class="admin-bug-reports__date">{{ formatDate(report.created_at) }}</time>
          <p class="admin-bug-reports__desc">{{ report.description }}</p>
        </div>

        <img
          v-if="report.image_url"
          :src="report.image_url"
          alt=""
          class="admin-bug-reports__image"
        />
        <div
          v-else
          class="admin-bug-reports__image-placeholder"
        >
          <ImageOff :size="28" />
        </div>
      </article>
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;

.admin-bug-reports {
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__heading {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__item {
    display: flex;
    gap: 20px;
    padding: 16px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $color-white;
  }

  &__col {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__date {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__desc {
    font-size: $font-size-base;
    color: $color-gray-700;
    white-space: pre-wrap;
  }

  &__image,
  &__image-placeholder {
    flex: 0 0 160px;
    height: 120px;
    border-radius: $radius-md;
  }

  &__image {
    object-fit: cover;
  }

  &__image-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-gray-50;
    color: $color-gray-300;
    border: 1px solid $color-gray-200;
  }
}
</style>

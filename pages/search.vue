<script setup lang="ts">
import { SearchX } from 'lucide-vue-next'
import type { Product } from '~/types/product'

useSeoMeta({
  title: 'Пошук — Honey Store',
  robots: 'noindex, follow',
})
useCanonical()

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

// The backend /api/search endpoint has no pagination (no `page`, no `meta`) —
// it just returns up to `limit` matches — so this page shows a single capped
// batch of results rather than pretending to paginate them.
const LIMIT = 60

const q = computed(() => (route.query.q as string) || '')

const products = ref<Product[]>([])
const loading = ref(false)

async function fetchResults() {
  if (!q.value) return
  loading.value = true
  try {
    const res = await $fetch<{ data: Product[] }>(`${config.public.apiBase}/api/search`, {
      query: { q: q.value, limit: LIMIT },
    })
    products.value = res.data
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
}

watch(q, fetchResults, { immediate: true })
</script>

<template>
  <div class="search-page container">
    <TheTitle
      tag="h1"
      size="m"
    >
      {{ q ? `Результати: "${q}"` : 'Пошук' }}
    </TheTitle>

    <p
      v-if="q && !loading"
      class="search-page__count"
    >
      Знайдено: {{ products.length }} товарів
    </p>

    <div
      v-if="loading"
      class="search-page__grid"
    >
      <TheProductCard
        v-for="n in LIMIT"
        :key="n"
        :loading="true"
      />
    </div>

    <template v-else-if="products.length">
      <div class="search-page__grid">
        <TheProductCard
          v-for="p in products"
          :key="p.id"
          :product="p"
        />
      </div>
    </template>

    <AppEmpty
      v-else-if="q"
      title="Нічого не знайдено"
      description="Спробуйте змінити запит або пошукати щось інше"
    >
      <template #icon>
        <SearchX
          :size="56"
          :stroke-width="1.2"
        />
      </template>
      <template #action>
        <AppButton
          variant="outline"
          size="md"
          @click="router.push('/catalog')"
        >
          Перейти до каталогу
        </AppButton>
      </template>
    </AppEmpty>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.search-page {
  padding-block: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  &__count {
    color: $color-gray-500;
    font-size: $font-size-sm;
    margin: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    @include mixins.respond-to(tablet) {
      grid-template-columns: repeat(3, 1fr);
    }
    @include mixins.respond-to(notebook) {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}
</style>

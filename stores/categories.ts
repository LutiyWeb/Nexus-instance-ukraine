import { defineStore } from 'pinia'
import type { Category } from '~/types/product'

export const useCategoriesStore = defineStore('categories', () => {
  const config = useRuntimeConfig()
  const categories = ref<Category[]>([])
  const loading = ref(false)
  let fetched = false

  async function hasProducts(slug: string) {
    try {
      const res = await $fetch<{ meta: { total: number } }>(
        `${config.public.apiBase}/api/products/`,
        {
          query: { categories: slug, limit: 1 },
        },
      )
      return res.meta.total > 0
    } catch {
      return false
    }
  }

  async function fetchCategories() {
    if (fetched) return
    loading.value = true
    try {
      const res = await $fetch<{ data: Category[] }>(`${config.public.apiBase}/api/categories/`)
      const nonEmpty = await Promise.all(
        res.data.map(async (cat) => ((await hasProducts(cat.slug)) ? cat : null)),
      )
      const mapped = nonEmpty
        .filter((cat): cat is Category => cat !== null)
        .map((cat) => ({
          ...cat,
          subcategories: [1, 2, 3].map((n) => ({
            id: cat.id * 100 + n,
            name: `${cat.name} — розділ ${n}`,
            slug: `${cat.slug}-${n}`,
          })),
        }))

      const isNew = (c: { slug?: string; name?: string }) =>
        c.slug?.includes('new') || c.name?.toLowerCase().includes('новин')

      categories.value = mapped.sort((a, b) => {
        if (isNew(a) && !isNew(b)) return -1
        if (!isNew(a) && isNew(b)) return 1
        return 0
      })
      fetched = true
    } finally {
      loading.value = false
    }
  }

  return { categories, loading, fetchCategories }
})

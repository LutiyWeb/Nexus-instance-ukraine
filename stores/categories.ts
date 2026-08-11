import { defineStore } from 'pinia'
import type { Category } from '~/types/product'

interface CategoryApiDto extends Category {
  parentId: number | null
}

export const useCategoriesStore = defineStore('categories', () => {
  const config = useRuntimeConfig()
  const categories = ref<Category[]>([])
  const loading = ref(false)
  let fetched = false

  async function productCount(slug: string) {
    try {
      const res = await $fetch<{ meta: { total: number } }>(
        `${config.public.apiBase}/api/products/`,
        { query: { categories: slug, limit: 1 } },
      )
      return res.meta.total
    } catch {
      return 0
    }
  }

  async function fetchCategories() {
    if (fetched) return
    loading.value = true
    try {
      const res = await $fetch<{ data: CategoryApiDto[] }>(
        `${config.public.apiBase}/api/categories/`,
      )

      const countById = new Map(
        await Promise.all(
          res.data.map(async (cat) => [cat.id, await productCount(cat.slug)] as const),
        ),
      )

      // Real subcategories only — a category with no products of its own but
      // at least one non-empty child (e.g. "Аксесуари" split into Чохли/
      // Зарядні пристрої/Повербанки) still belongs in the menu.
      const childrenByParent = new Map<
        number,
        { id: number; name: string; slug: string; description?: string | null }[]
      >()
      for (const cat of res.data) {
        if (cat.parentId == null) continue
        if ((countById.get(cat.id) ?? 0) === 0) continue
        const siblings = childrenByParent.get(cat.parentId) ?? []
        siblings.push({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description })
        childrenByParent.set(cat.parentId, siblings)
      }

      const topLevel = res.data
        .filter((cat) => cat.parentId == null)
        .map((cat) => ({ ...cat, subcategories: childrenByParent.get(cat.id) ?? [] }))
        .filter((cat) => (countById.get(cat.id) ?? 0) > 0 || cat.subcategories.length > 0)

      const isNew = (c: { slug?: string; name?: string }) =>
        c.slug?.includes('new') || c.name?.toLowerCase().includes('новин')

      categories.value = topLevel.sort((a, b) => {
        if (isNew(a) && !isNew(b)) return -1
        if (!isNew(a) && isNew(b)) return 1
        return 0
      })
      fetched = true
    } finally {
      loading.value = false
    }
  }

  function findBySlug(slug: string) {
    for (const cat of categories.value) {
      if (cat.slug === slug) return cat
      const sub = cat.subcategories?.find((s) => s.slug === slug)
      if (sub) return sub
    }
    return null
  }

  return { categories, loading, fetchCategories, findBySlug }
})

<script setup lang="ts">
definePageMeta({
  validate: async (route) => {
    const categoriesStore = useCategoriesStore()
    if (!categoriesStore.categories.length) await categoriesStore.fetchCategories()
    return !!categoriesStore.findBySlug(route.params.slug as string)
  },
})

const route = useRoute()
const categoriesStore = useCategoriesStore()

const slug = computed(() => route.params.slug as string)
const category = computed(() => categoriesStore.findBySlug(slug.value))

const description = computed(() => {
  const cat = category.value
  if (!cat) return ''
  return cat.description?.trim()
    ? cat.description
    : `Купити ${cat.name.toLowerCase()} в Honey Store: широкий вибір, гарантія та швидка доставка по Україні.`
})

useSeoMeta({
  title: () => (category.value ? `${category.value.name} — купити | Honey Store` : 'Категорія'),
  description: () => description.value,
  ogTitle: () => category.value?.name ?? '',
  ogDescription: () => description.value,
})
useCanonical()
</script>

<template>
  <CatalogView :category-slug="slug" />
</template>

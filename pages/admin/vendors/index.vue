<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { Category } from '~/types/product'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Адмінка — Вендори' })

interface Vendor {
  id: number
  name: string
  slug: string
  is_active: boolean
}

interface VendorCategory {
  source_category_id: string
  source_category_name: string
  parent_id: string | null
  commission: number | null
  mapping: {
    id: number
    import_action: 'map' | 'skip'
    category: { id: number; name: string; slug: string } | null
  } | null
  imported_count: number
}

interface VendorProduct {
  source_code: string
  title: string
  price: number | null
  old_price: number | null
  stock: number
  available: boolean
  thumbnail_url: string | null
  images_count: number
  in_our_catalog: boolean
  our_product: {
    id: number
    price: number
    stock: number
    price_differs: boolean
    removed: boolean
  } | null
  target_category: { id: number | null; name: string | null; slug: string | null; reason: string }
}

interface ProductsMeta {
  returned: number
  already_imported: number
  new_to_us: number
}

const { authFetch } = useAuthFetch()

const vendors = ref<Vendor[]>([])
const selectedVendorId = ref<number | null>(null)

const categories = ref<VendorCategory[]>([])
const categoriesLoading = ref(false)
const categorySearch = ref('')

const selectedCategory = ref<VendorCategory | null>(null)
const products = ref<VendorProduct[]>([])
const productsLoading = ref(false)
const productsMeta = ref<ProductsMeta | null>(null)

const categoryColumns = [
  { title: 'Категорія постачальника', dataIndex: 'source_category_name', key: 'name' },
  { title: 'Статус', key: 'status', width: 220 },
  { title: 'Комісія', dataIndex: 'commission', key: 'commission', width: 100 },
  { title: 'Вже імпортовано', dataIndex: 'imported_count', key: 'imported_count', width: 140 },
  { title: '', key: 'actions', width: 180 },
]

const config = useRuntimeConfig()
const ourCategories = ref<Category[]>([])

const mappingModalOpen = ref(false)
const mappingSubmitting = ref(false)
const mappingTarget = ref<VendorCategory | null>(null)
const mappingMode = ref<'existing' | 'new'>('existing')
const mappingCategoryId = ref<number | undefined>(undefined)
const mappingNewName = ref('')

const productColumns = [
  { title: '', key: 'thumbnail', width: 64 },
  { title: 'Назва', dataIndex: 'title', key: 'title' },
  { title: 'Ціна', dataIndex: 'price', key: 'price', width: 100 },
  { title: 'Залишок', dataIndex: 'stock', key: 'stock', width: 90 },
  { title: 'Фото', dataIndex: 'images_count', key: 'images_count', width: 70 },
  { title: 'У нас', key: 'in_our_catalog', width: 100 },
]

async function loadVendors() {
  try {
    const res = await authFetch<{ data: Vendor[] }>('/api/admin/vendors')
    vendors.value = res.data
    if (vendors.value.length === 1) selectedVendorId.value = vendors.value[0].id
  } catch {
    message.error('Не вдалося завантажити список постачальників')
  }
}

async function loadCategories() {
  if (!selectedVendorId.value) return
  categoriesLoading.value = true
  selectedCategory.value = null
  products.value = []
  productsMeta.value = null
  try {
    const res = await authFetch<{ data: VendorCategory[] }>(
      `/api/admin/vendors/${selectedVendorId.value}/categories`,
      { query: { search: categorySearch.value || undefined, limit: 100 } },
    )
    categories.value = res.data
  } catch {
    message.error('Не вдалося завантажити категорії постачальника')
  } finally {
    categoriesLoading.value = false
  }
}

async function selectCategory(category: VendorCategory) {
  if (!selectedVendorId.value) return
  selectedCategory.value = category
  productsLoading.value = true
  products.value = []
  try {
    const res = await authFetch<{ data: VendorProduct[]; meta: ProductsMeta }>(
      `/api/admin/vendors/${selectedVendorId.value}/products`,
      { query: { source_category_id: category.source_category_id, limit: 100 } },
    )
    products.value = res.data
    productsMeta.value = res.meta
  } catch {
    message.error('Не вдалося завантажити товари категорії')
  } finally {
    productsLoading.value = false
  }
}

async function loadOurCategories() {
  try {
    const res = await $fetch<{ data: Category[] }>(`${config.public.apiBase}/api/categories/`)
    ourCategories.value = res.data
  } catch {
    message.error('Не вдалося завантажити наші категорії')
  }
}

function openMappingModal(category: VendorCategory) {
  mappingTarget.value = category
  mappingMode.value = 'existing'
  mappingCategoryId.value = category.mapping?.category?.id ?? undefined
  mappingNewName.value = ''
  mappingModalOpen.value = true
}

async function submitMapping() {
  if (!selectedVendorId.value || !mappingTarget.value) return

  if (mappingMode.value === 'existing' && !mappingCategoryId.value) {
    message.error('Оберіть нашу категорію')
    return
  }
  if (mappingMode.value === 'new' && !mappingNewName.value.trim()) {
    message.error('Введіть назву нової категорії')
    return
  }

  mappingSubmitting.value = true
  try {
    await authFetch(`/api/admin/vendors/${selectedVendorId.value}/mappings`, {
      method: 'PUT',
      body: {
        source_category_id: mappingTarget.value.source_category_id,
        source_category_name: mappingTarget.value.source_category_name,
        import_action: 'map',
        ...(mappingMode.value === 'existing'
          ? { category_id: mappingCategoryId.value }
          : { create_category: { name: mappingNewName.value.trim() } }),
      },
    })
    message.success("Категорію прив'язано")
    mappingModalOpen.value = false
    await Promise.all([loadCategories(), loadOurCategories()])
  } catch (err: any) {
    message.error(err?.data?.error?.message ?? "Не вдалося прив'язати категорію")
  } finally {
    mappingSubmitting.value = false
  }
}

function categoryRowProps(category: VendorCategory) {
  return {
    class:
      selectedCategory.value?.source_category_id === category.source_category_id
        ? 'admin-vendors__row--active'
        : '',
    onClick: () => selectCategory(category),
  }
}

let searchDebounce: ReturnType<typeof setTimeout>
watch(categorySearch, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(loadCategories, 300)
})

watch(selectedVendorId, () => {
  categorySearch.value = ''
  loadCategories()
})

onMounted(() => {
  loadVendors()
  loadOurCategories()
})
</script>

<template>
  <div class="admin-vendors">
    <div class="admin-vendors__header">
      <h1 class="admin-vendors__title">Вендори</h1>
      <a-select
        v-model:value="selectedVendorId"
        placeholder="Оберіть постачальника"
        class="admin-vendors__vendor-select"
        :options="vendors.map((v) => ({ value: v.id, label: v.name }))"
      />
    </div>

    <template v-if="selectedVendorId">
      <div class="admin-vendors__section">
        <div class="admin-vendors__section-header">
          <h2 class="admin-vendors__section-title">Категорії постачальника</h2>
          <a-input-search
            v-model:value="categorySearch"
            placeholder="Пошук категорії..."
            class="admin-vendors__search"
            allow-clear
          />
        </div>

        <a-table
          :columns="categoryColumns"
          :data-source="categories"
          :loading="categoriesLoading"
          row-key="source_category_id"
          :pagination="false"
          :custom-row="categoryRowProps"
          class="admin-vendors__table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag
                v-if="!record.mapping"
                color="orange"
                >Не вирішено</a-tag
              >
              <a-tag v-else-if="record.mapping.import_action === 'skip'">Пропущено</a-tag>
              <a-tag
                v-else
                color="green"
              >
                Прив'язано: {{ record.mapping.category?.name ?? '—' }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-button
                size="small"
                @click.stop="openMappingModal(record)"
              >
                Додати категорію
              </a-button>
            </template>
          </template>
        </a-table>
      </div>

      <div
        v-if="selectedCategory"
        class="admin-vendors__section"
      >
        <h2 class="admin-vendors__section-title">
          Товари: {{ selectedCategory.source_category_name }}
          <span
            v-if="productsMeta"
            class="admin-vendors__meta"
          >
            (нових: {{ productsMeta.new_to_us }}, вже у нас: {{ productsMeta.already_imported }})
          </span>
        </h2>

        <a-table
          :columns="productColumns"
          :data-source="products"
          :loading="productsLoading"
          row-key="source_code"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'thumbnail'">
              <img
                v-if="record.thumbnail_url"
                :src="record.thumbnail_url"
                class="admin-vendors__thumb"
              />
            </template>
            <template v-else-if="column.key === 'in_our_catalog'">
              <a-tag
                v-if="record.in_our_catalog"
                color="green"
                >Так</a-tag
              >
              <a-tag v-else>Ні</a-tag>
            </template>
          </template>
        </a-table>
      </div>
    </template>

    <a-modal
      v-model:open="mappingModalOpen"
      title="Прив'язати категорію"
      :confirm-loading="mappingSubmitting"
      @ok="submitMapping"
    >
      <p
        v-if="mappingTarget"
        class="admin-vendors__modal-source"
      >
        Категорія постачальника: <strong>{{ mappingTarget.source_category_name }}</strong>
      </p>

      <a-radio-group
        v-model:value="mappingMode"
        class="admin-vendors__modal-mode"
      >
        <a-radio value="existing">Наша існуюча категорія</a-radio>
        <a-radio value="new">Створити нову</a-radio>
      </a-radio-group>

      <a-select
        v-if="mappingMode === 'existing'"
        v-model:value="mappingCategoryId"
        placeholder="Оберіть категорію"
        class="admin-vendors__modal-field"
        :options="ourCategories.map((c) => ({ value: c.id, label: c.name }))"
        show-search
        :filter-option="
          (input: string, option: any) => option.label.toLowerCase().includes(input.toLowerCase())
        "
      />
      <a-input
        v-else
        v-model:value="mappingNewName"
        placeholder="Назва нової категорії"
        class="admin-vendors__modal-field"
      />
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.admin-vendors {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
  }

  &__vendor-select {
    width: 260px;
  }

  &__section {
    margin-bottom: 32px;
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 600;
  }

  &__meta {
    font-size: 13px;
    font-weight: 400;
    color: rgb(0 0 0 / 45%);
  }

  &__search {
    width: 280px;
  }

  &__thumb {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
  }

  &__table :deep(.admin-vendors__row--active) {
    cursor: pointer;
    background: rgb(79 70 229 / 6%);
  }

  &__table :deep(tbody tr) {
    cursor: pointer;
  }

  &__modal-source {
    margin-bottom: 16px;
  }

  &__modal-mode {
    display: flex;
    margin-bottom: 16px;
  }

  &__modal-field {
    width: 100%;
  }
}
</style>

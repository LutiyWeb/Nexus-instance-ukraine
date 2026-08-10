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

interface ImportResult {
  dry_run: boolean
  requested: number
  created: number
  updated: number
  restored: number
  skipped: number
  failed: number
  truncated: boolean
}

const { authFetch } = useAuthFetch()

const vendors = ref<Vendor[]>([])
const selectedVendorId = ref<number | null>(null)

/**
 * 'my' is the vendor's hand-picked selection for our account and is empty for
 * most categories on this account; 'all' is the whole marketplace. Defaulting
 * to 'all' because that is where the real stock actually is.
 */
const catalogMode = ref<'my' | 'all'>('all')
const importLimit = ref(100)

const categories = ref<VendorCategory[]>([])
const categoriesLoading = ref(false)
const categorySearch = ref('')
const importingCategoryId = ref<string | null>(null)

/** source_category_id -> vendor's total product count (admitted for sale), under catalogMode. */
const categoryCounts = ref<Record<string, number | null>>({})
const categoryCountsLoading = ref<Record<string, boolean>>({})

const selectedCategory = ref<VendorCategory | null>(null)
const products = ref<VendorProduct[]>([])
const productsLoading = ref(false)
const productsMeta = ref<ProductsMeta | null>(null)
const importingProductCode = ref<string | null>(null)

const categoryColumns = [
  { title: 'Категорія постачальника', dataIndex: 'source_category_name', key: 'name' },
  { title: 'Статус', key: 'status', width: 220 },
  { title: 'У постачальника', key: 'vendor_count', width: 130 },
  { title: 'Комісія', dataIndex: 'commission', key: 'commission', width: 90 },
  { title: 'Вже імпортовано', dataIndex: 'imported_count', key: 'imported_count', width: 140 },
  { title: '', key: 'actions', width: 260 },
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
  { title: '', key: 'actions', width: 140 },
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

/**
 * Fetched with limit=1 purely to read `meta.vendor_total` from the response
 * header the admin products route already forwards — cheap even though it
 * goes through the vendor API, since we never pull the actual product page.
 */
async function loadCategoryCount(category: VendorCategory) {
  if (!selectedVendorId.value) return
  categoryCountsLoading.value[category.source_category_id] = true
  try {
    const res = await authFetch<{ meta: { vendor_total: number | null } }>(
      `/api/admin/vendors/${selectedVendorId.value}/products`,
      {
        query: {
          source_category_id: category.source_category_id,
          catalog: catalogMode.value,
          limit: 1,
        },
      },
    )
    categoryCounts.value[category.source_category_id] = res.meta.vendor_total
  } catch {
    categoryCounts.value[category.source_category_id] = null
  } finally {
    categoryCountsLoading.value[category.source_category_id] = false
  }
}

/** Small concurrency cap so a 100-row category page does not fire 100 requests at once. */
async function loadCategoryCounts(rows: VendorCategory[]) {
  const concurrency = 5
  let index = 0
  async function worker() {
    while (index < rows.length) {
      const row = rows[index]
      index += 1
      await loadCategoryCount(row)
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
}

async function loadCategories() {
  if (!selectedVendorId.value) return
  categoriesLoading.value = true
  selectedCategory.value = null
  products.value = []
  productsMeta.value = null
  categoryCounts.value = {}
  try {
    const res = await authFetch<{ data: VendorCategory[] }>(
      `/api/admin/vendors/${selectedVendorId.value}/categories`,
      { query: { search: categorySearch.value || undefined, limit: 100 } },
    )
    categories.value = res.data
    loadCategoryCounts(res.data).catch(() => {})
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
      {
        query: {
          source_category_id: category.source_category_id,
          catalog: catalogMode.value,
          limit: 100,
        },
      },
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

function reportImportResult(result: ImportResult) {
  const parts = [`створено: ${result.created}`, `оновлено: ${result.updated}`]
  if (result.restored) parts.push(`відновлено: ${result.restored}`)
  if (result.skipped) parts.push(`пропущено: ${result.skipped}`)
  if (result.failed) parts.push(`помилок: ${result.failed}`)

  const text = parts.join(', ')
  if (result.failed) {
    message.warning(`Імпорт завершено з помилками (${text})`)
  } else if (result.truncated) {
    message.warning(
      `${text}. Категорія більша за ліміт — запустіть імпорт ще раз, щоб дотягнути решту`,
    )
  } else {
    message.success(`Імпортовано: ${text}`)
  }
}

async function importCategory(category: VendorCategory) {
  if (!selectedVendorId.value) return
  importingCategoryId.value = category.source_category_id
  try {
    const res = await authFetch<{ data: ImportResult }>(
      `/api/admin/vendors/${selectedVendorId.value}/products/import`,
      {
        method: 'POST',
        body: {
          source_category_id: category.source_category_id,
          catalog: catalogMode.value,
          max_products: importLimit.value,
        },
      },
    )
    reportImportResult(res.data)
    await loadCategories()
    if (selectedCategory.value?.source_category_id === category.source_category_id) {
      await selectCategory(category)
    }
  } catch (err: any) {
    message.error(err?.data?.error?.message ?? 'Не вдалося імпортувати категорію')
  } finally {
    importingCategoryId.value = null
  }
}

async function importProduct(product: VendorProduct) {
  if (!selectedVendorId.value) return
  importingProductCode.value = product.source_code
  try {
    const res = await authFetch<{ data: ImportResult }>(
      `/api/admin/vendors/${selectedVendorId.value}/products/import`,
      {
        method: 'POST',
        body: { source_codes: [product.source_code], catalog: catalogMode.value },
      },
    )
    reportImportResult(res.data)
    await loadCategories()
    if (selectedCategory.value) await selectCategory(selectedCategory.value)
  } catch (err: any) {
    message.error(err?.data?.error?.message ?? 'Не вдалося імпортувати товар')
  } finally {
    importingProductCode.value = null
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

watch(catalogMode, async () => {
  await loadCategoryCounts(categories.value)
  if (selectedCategory.value) await selectCategory(selectedCategory.value)
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
      <div class="admin-vendors__toolbar">
        <a-radio-group
          v-model:value="catalogMode"
          button-style="solid"
        >
          <a-radio-button value="all">Весь маркетплейс</a-radio-button>
          <a-radio-button value="my">Мій каталог</a-radio-button>
        </a-radio-group>

        <label class="admin-vendors__limit">
          Ліміт на категорію:
          <a-input-number
            v-model:value="importLimit"
            :min="1"
            :max="2000"
          />
        </label>
      </div>

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
            <template v-else-if="column.key === 'vendor_count'">
              <a-spin
                v-if="categoryCountsLoading[record.source_category_id]"
                size="small"
              />
              <span v-else>{{ categoryCounts[record.source_category_id] ?? '—' }}</span>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button
                  size="small"
                  @click.stop="openMappingModal(record)"
                >
                  Додати категорію
                </a-button>
                <a-button
                  v-if="record.mapping?.import_action === 'map'"
                  size="small"
                  type="primary"
                  :loading="importingCategoryId === record.source_category_id"
                  @click.stop="importCategory(record)"
                >
                  Імпортувати
                </a-button>
              </a-space>
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
            <template v-else-if="column.key === 'actions'">
              <a-button
                v-if="!record.in_our_catalog"
                size="small"
                type="primary"
                :disabled="!record.target_category.id"
                :title="!record.target_category.id ? 'Спочатку прив\'яжіть категорію' : undefined"
                :loading="importingProductCode === record.source_code"
                @click.stop="importProduct(record)"
              >
                Імпортувати
              </a-button>
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

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 20px;
  }

  &__limit {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
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

<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { Product, Category } from '~/types/product'
import type { Brand } from '~/contracts/brands'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Админка — Товары' })

const { authFetch } = useAuthFetch()
const config = useRuntimeConfig()

const products = ref<Product[]>([])
const loading = ref(false)
const categories = ref<Category[]>([])
const brands = ref<Brand[]>([])

const modalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)

const emptyForm = () => ({
  title: '',
  slug: '',
  description: '',
  sku: '',
  price: 0,
  compareAtPrice: undefined as number | undefined,
  stock: 0,
  status: 'draft' as 'active' | 'draft' | 'archived',
  categoryId: undefined as number | undefined,
  brandId: undefined as number | undefined,
  thumbnailUrl: '',
})
const form = reactive(emptyForm())

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: 'Название', dataIndex: 'title', key: 'title' },
  { title: 'Цена', dataIndex: 'price', key: 'price', width: 120 },
  { title: 'Остаток', dataIndex: 'stock', key: 'stock', width: 100 },
  { title: 'Статус', dataIndex: 'status', key: 'status', width: 120 },
  { title: '', key: 'actions', width: 160 },
]

async function loadProducts() {
  loading.value = true
  try {
    const res = await authFetch<{ data: Product[] }>('/api/products/admin?limit=100')
    products.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  const [categoriesRes, brandsRes] = await Promise.all([
    $fetch<{ data: Category[] }>(`${config.public.apiBase}/api/categories/`),
    $fetch<{ data: Brand[] }>(`${config.public.apiBase}/api/brands`),
  ])
  categories.value = categoriesRes.data
  brands.value = brandsRes.data
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  modalOpen.value = true
}

function openEdit(product: Product) {
  editingId.value = product.id
  Object.assign(form, {
    title: product.title,
    slug: product.slug,
    description: product.description,
    sku: product.sku ?? '',
    price: product.price ?? 0,
    compareAtPrice: product.compareAtPrice ?? undefined,
    stock: product.stock,
    status: (product.status as 'active' | 'draft' | 'archived') ?? 'draft',
    categoryId: product.categoryId ?? undefined,
    brandId: product.brandId ?? undefined,
    thumbnailUrl: product.thumbnail ?? '',
  })
  modalOpen.value = true
}

async function submit() {
  submitting.value = true
  try {
    const body = {
      title: form.title,
      slug: form.slug,
      description: form.description || undefined,
      sku: form.sku || undefined,
      price: form.price,
      compareAtPrice: form.compareAtPrice || undefined,
      stock: form.stock,
      status: form.status,
      categoryId: form.categoryId,
      brandId: form.brandId,
      thumbnailUrl: form.thumbnailUrl || undefined,
    }

    if (editingId.value) {
      await authFetch(`/api/products/${editingId.value}`, { method: 'PATCH', body })
    } else {
      await authFetch('/api/products', { method: 'POST', body })
    }

    modalOpen.value = false
    await loadProducts()
    message.success('Сохранено')
  } catch {
    message.error('Не удалось сохранить товар')
  } finally {
    submitting.value = false
  }
}

async function remove(product: Product) {
  await authFetch(`/api/products/${product.id}`, { method: 'DELETE' })
  await loadProducts()
  message.success('Товар удалён')
}

onMounted(() => {
  loadProducts()
  loadOptions()
})
</script>

<template>
  <div class="admin-products">
    <div class="admin-products__header">
      <h1 class="admin-products__title">Товары</h1>
      <a-button type="primary" @click="openCreate">Добавить товар</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="products"
      :loading="loading"
      row-key="id"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button size="small" @click="openEdit(record)">Редактировать</a-button>
            <a-popconfirm title="Удалить товар?" @confirm="remove(record)">
              <a-button size="small" danger>Удалить</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="editingId ? 'Редактировать товар' : 'Новый товар'"
      :confirm-loading="submitting"
      @ok="submit"
    >
      <a-form layout="vertical">
        <a-form-item label="Название">
          <a-input v-model:value="form.title" />
        </a-form-item>
        <a-form-item label="Slug">
          <a-input v-model:value="form.slug" />
        </a-form-item>
        <a-form-item label="Описание">
          <a-textarea v-model:value="form.description" :rows="3" />
        </a-form-item>
        <a-form-item label="SKU">
          <a-input v-model:value="form.sku" />
        </a-form-item>
        <a-form-item label="Цена">
          <a-input-number v-model:value="form.price" :min="0" class="admin-products__number" />
        </a-form-item>
        <a-form-item label="Цена до скидки">
          <a-input-number
            v-model:value="form.compareAtPrice"
            :min="0"
            class="admin-products__number"
          />
        </a-form-item>
        <a-form-item label="Остаток">
          <a-input-number v-model:value="form.stock" :min="0" class="admin-products__number" />
        </a-form-item>
        <a-form-item label="Статус">
          <a-select v-model:value="form.status">
            <a-select-option value="draft">Черновик</a-select-option>
            <a-select-option value="active">Активен</a-select-option>
            <a-select-option value="archived">Архив</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Категория">
          <a-select v-model:value="form.categoryId" allow-clear>
            <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Бренд">
          <a-select v-model:value="form.brandId" allow-clear>
            <a-select-option v-for="brand in brands" :key="brand.id" :value="brand.id">
              {{ brand.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="Изображение">
          <AdminImageUpload v-model="form.thumbnailUrl" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.admin-products {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
  }

  &__number {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { message } from 'ant-design-vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface AdminBanner {
  id: number
  section: string
  title: string
  description: string | null
  mediaUrl: string | null
  mediaType: string
  linkUrl: string | null
  buttonText: string | null
  gradient: string | null
  sortOrder: number
  isActive: boolean
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Главный баннер',
  special_1: 'Спец-баннер 1',
  special_2: 'Спец-баннер 2',
  promo: 'Промо-плитки',
  hot: 'Горячие позиции',
}

const route = useRoute()
const section = computed(() => String(route.params.section))
const isSingle = computed(() => section.value === 'special_1' || section.value === 'special_2')
const showMedia = computed(() => section.value !== 'promo')
const showGradient = computed(() => section.value === 'promo' || section.value === 'hot')
const title = computed(() => SECTION_LABELS[section.value] ?? section.value)

useHead(() => ({ title: `Админка — ${title.value}` }))

const { authFetch } = useAuthFetch()

const banners = ref<AdminBanner[]>([])
const loading = ref(false)

const modalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)

const emptyForm = () => ({
  title: '',
  description: '',
  mediaUrl: '',
  mediaType: 'image' as 'image' | 'video',
  linkUrl: '',
  buttonText: '',
  gradient: '',
  sortOrder: 0,
  isActive: true,
})
const form = reactive(emptyForm())

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: 'Название', dataIndex: 'title', key: 'title' },
  { title: 'Порядок', dataIndex: 'sortOrder', key: 'sortOrder', width: 100 },
  { title: 'Активен', dataIndex: 'isActive', key: 'isActive', width: 100 },
  { title: '', key: 'actions', width: 160 },
]

async function load() {
  loading.value = true
  try {
    const res = await authFetch<{ data: AdminBanner[] }>(
      `/api/banners/admin?section=${section.value}`,
    )
    banners.value = res.data
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, emptyForm())
  modalOpen.value = true
}

function openEdit(banner: AdminBanner) {
  editingId.value = banner.id
  Object.assign(form, {
    title: banner.title,
    description: banner.description ?? '',
    mediaUrl: banner.mediaUrl ?? '',
    mediaType: (banner.mediaType as 'image' | 'video') ?? 'image',
    linkUrl: banner.linkUrl ?? '',
    buttonText: banner.buttonText ?? '',
    gradient: banner.gradient ?? '',
    sortOrder: banner.sortOrder,
    isActive: banner.isActive,
  })
  modalOpen.value = true
}

function editSingle() {
  const existing = banners.value[0]
  if (existing) openEdit(existing)
  else openCreate()
}

async function submit() {
  submitting.value = true
  try {
    const body = {
      section: section.value,
      title: form.title,
      description: form.description || undefined,
      mediaUrl: form.mediaUrl || undefined,
      mediaType: form.mediaType,
      linkUrl: form.linkUrl || undefined,
      buttonText: form.buttonText || undefined,
      gradient: form.gradient || undefined,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    }

    if (editingId.value) {
      await authFetch(`/api/banners/admin/${editingId.value}`, { method: 'PATCH', body })
    } else {
      await authFetch('/api/banners/admin', { method: 'POST', body })
    }

    modalOpen.value = false
    await load()
    message.success('Сохранено')
  } catch {
    message.error('Не удалось сохранить баннер')
  } finally {
    submitting.value = false
  }
}

async function remove(banner: AdminBanner) {
  await authFetch(`/api/banners/admin/${banner.id}`, { method: 'DELETE' })
  await load()
  message.success('Баннер удалён')
}

watch(section, load, { immediate: true })
</script>

<template>
  <div class="admin-banners">
    <div class="admin-banners__header">
      <h1 class="admin-banners__title">{{ title }}</h1>
      <a-button v-if="isSingle" type="primary" @click="editSingle">
        {{ banners[0] ? 'Редактировать' : 'Создать' }}
      </a-button>
      <a-button v-else type="primary" @click="openCreate">Добавить слайд</a-button>
    </div>

    <a-table
      v-if="!isSingle"
      :columns="columns"
      :data-source="banners"
      :loading="loading"
      row-key="id"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'isActive'">
          {{ record.isActive ? 'Да' : 'Нет' }}
        </template>
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button size="small" @click="openEdit(record)">Редактировать</a-button>
            <a-popconfirm title="Удалить баннер?" @confirm="remove(record)">
              <a-button size="small" danger>Удалить</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-empty v-else-if="!loading && !banners.length" description="Баннер ещё не создан" />

    <a-modal
      v-model:open="modalOpen"
      :title="editingId ? 'Редактировать баннер' : 'Новый баннер'"
      :confirm-loading="submitting"
      @ok="submit"
    >
      <a-form layout="vertical">
        <a-form-item label="Заголовок">
          <a-input v-model:value="form.title" />
        </a-form-item>
        <a-form-item label="Описание">
          <a-textarea v-model:value="form.description" :rows="3" />
        </a-form-item>
        <template v-if="showMedia">
          <a-form-item label="Тип медиа">
            <a-select v-model:value="form.mediaType">
              <a-select-option value="image">Изображение</a-select-option>
              <a-select-option value="video">Видео</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item v-if="form.mediaType === 'image'" label="Изображение">
            <AdminImageUpload v-model="form.mediaUrl" />
          </a-form-item>
          <a-form-item v-else label="Ссылка на видео">
            <a-input v-model:value="form.mediaUrl" />
          </a-form-item>
        </template>
        <a-form-item v-if="showGradient" label="Градиент (CSS)">
          <a-input v-model:value="form.gradient" placeholder="linear-gradient(...)" />
        </a-form-item>
        <a-form-item label="Ссылка при клике">
          <a-input v-model:value="form.linkUrl" />
        </a-form-item>
        <a-form-item label="Текст кнопки">
          <a-input v-model:value="form.buttonText" />
        </a-form-item>
        <a-form-item v-if="!isSingle" label="Порядок сортировки">
          <a-input-number v-model:value="form.sortOrder" :min="0" class="admin-banners__number" />
        </a-form-item>
        <a-form-item label="Активен">
          <a-switch v-model:checked="form.isActive" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
.admin-banners {
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

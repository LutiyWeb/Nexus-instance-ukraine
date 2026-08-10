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

// Real backend shapes (see banner.serializer.ts) — only `hero` (-> MainBanner)
// and `special_1`/`special_2` (-> SpecialBanner) exist server-side. `promo`
// and `hot` have no backend model yet; those two keep calling the old
// (nonexistent) /api/banners/admin endpoint until that's built.
interface ApiMainBanner {
  id: number
  title: string
  description: string | null
  media_url: string
  media_type: 'image' | 'video'
  link_url: string | null
  sort_order: number
  is_active: boolean
}
interface ApiSpecialBanner {
  slug: string
  title: string
  image_url: string
  link_url: string | null
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Головний банер',
  special_1: 'Спец-банер 1',
  special_2: 'Спец-банер 2',
  promo: 'Промо-плитки',
  hot: 'Гарячі позиції',
}

const route = useRoute()
const section = computed(() => String(route.params.section))
const isMainSection = computed(() => section.value === 'hero')
const isSpecialSection = computed(
  () => section.value === 'special_1' || section.value === 'special_2',
)
const isSingle = computed(() => isSpecialSection.value)
const showMedia = computed(() => section.value !== 'promo')
const showGradient = computed(() => section.value === 'promo' || section.value === 'hot')
const title = computed(() => SECTION_LABELS[section.value] ?? section.value)

useHead(() => ({ title: `Адмінка — ${title.value}` }))

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
  { title: 'Назва', dataIndex: 'title', key: 'title' },
  { title: 'Порядок', dataIndex: 'sortOrder', key: 'sortOrder', width: 100 },
  { title: 'Активний', dataIndex: 'isActive', key: 'isActive', width: 100 },
  { title: '', key: 'actions', width: 160 },
]

function fromApiMain(b: ApiMainBanner): AdminBanner {
  return {
    id: b.id,
    section: 'hero',
    title: b.title,
    description: b.description,
    mediaUrl: b.media_url,
    mediaType: b.media_type,
    linkUrl: b.link_url,
    buttonText: null,
    gradient: null,
    sortOrder: b.sort_order,
    isActive: b.is_active,
  }
}

function fromApiSpecial(b: ApiSpecialBanner): AdminBanner {
  return {
    id: 0,
    section: b.slug,
    title: b.title,
    description: null,
    mediaUrl: b.image_url,
    mediaType: 'image',
    linkUrl: b.link_url,
    buttonText: null,
    gradient: null,
    sortOrder: 0,
    isActive: true,
  }
}

async function load() {
  loading.value = true
  try {
    if (isMainSection.value) {
      const res = await authFetch<{ data: ApiMainBanner[] }>('/api/admin/banners/main')
      banners.value = res.data.map(fromApiMain)
    } else if (isSpecialSection.value) {
      const res = await authFetch<{ data: ApiSpecialBanner[] }>('/api/admin/banners/special')
      const row = res.data.find((b) => b.slug === section.value)
      banners.value = row ? [fromApiSpecial(row)] : []
    } else {
      const res = await authFetch<{ data: AdminBanner[] }>(
        `/api/banners/admin?section=${section.value}`,
      )
      banners.value = res.data
    }
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
    if (isMainSection.value) {
      const body = {
        title: form.title,
        description: form.description || undefined,
        media_url: form.mediaUrl || undefined,
        media_type: form.mediaType,
        link_url: form.linkUrl || null,
        sort_order: form.sortOrder,
        is_active: form.isActive,
      }
      if (editingId.value) {
        await authFetch(`/api/admin/banners/main/${editingId.value}`, { method: 'PATCH', body })
      } else {
        await authFetch('/api/admin/banners/main', { method: 'POST', body })
      }
    } else if (isSpecialSection.value) {
      const body = {
        title: form.title,
        image_url: form.mediaUrl,
        link_url: form.linkUrl || null,
      }
      await authFetch(`/api/admin/banners/special/${section.value}`, { method: 'PUT', body })
    } else {
      // promo/hot — no backend model yet, unchanged legacy call.
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
    }

    modalOpen.value = false
    await load()
    message.success('Збережено')
  } catch {
    message.error('Не вдалося зберегти банер')
  } finally {
    submitting.value = false
  }
}

async function remove(banner: AdminBanner) {
  if (isMainSection.value) {
    await authFetch(`/api/admin/banners/main/${banner.id}`, { method: 'DELETE' })
  } else if (isSpecialSection.value) {
    await authFetch(`/api/admin/banners/special/${section.value}`, { method: 'DELETE' })
  } else {
    await authFetch(`/api/banners/admin/${banner.id}`, { method: 'DELETE' })
  }
  await load()
  message.success('Банер видалено')
}

watch(section, load, { immediate: true })
</script>

<template>
  <div class="admin-banners">
    <div class="admin-banners__header">
      <h1 class="admin-banners__title">{{ title }}</h1>
      <a-button
        v-if="isSingle"
        type="primary"
        @click="editSingle"
      >
        {{ banners[0] ? 'Редагувати' : 'Створити' }}
      </a-button>
      <a-button
        v-else
        type="primary"
        @click="openCreate"
        >Додати слайд</a-button
      >
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
          {{ record.isActive ? 'Так' : 'Ні' }}
        </template>
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button
              size="small"
              @click="openEdit(record)"
              >Редагувати</a-button
            >
            <a-popconfirm
              title="Видалити банер?"
              @confirm="remove(record)"
            >
              <a-button
                size="small"
                danger
                >Видалити</a-button
              >
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-empty
      v-else-if="!loading && !banners.length"
      description="Банер ще не створено"
    />

    <a-modal
      v-model:open="modalOpen"
      :title="editingId ? 'Редагувати банер' : 'Новий банер'"
      :confirm-loading="submitting"
      @ok="submit"
    >
      <a-form layout="vertical">
        <a-form-item label="Заголовок">
          <a-input v-model:value="form.title" />
        </a-form-item>
        <a-form-item label="Опис">
          <a-textarea
            v-model:value="form.description"
            :rows="3"
          />
        </a-form-item>
        <template v-if="showMedia">
          <a-form-item label="Тип медіа">
            <a-select v-model:value="form.mediaType">
              <a-select-option value="image">Зображення</a-select-option>
              <a-select-option value="video">Відео</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item
            v-if="form.mediaType === 'image'"
            label="Зображення"
          >
            <AdminImageUpload v-model="form.mediaUrl" />
          </a-form-item>
          <a-form-item
            v-else
            label="Посилання на відео"
          >
            <a-input v-model:value="form.mediaUrl" />
          </a-form-item>
        </template>
        <a-form-item
          v-if="showGradient"
          label="Градієнт (CSS)"
        >
          <a-input
            v-model:value="form.gradient"
            placeholder="linear-gradient(...)"
          />
        </a-form-item>
        <a-form-item label="Посилання при кліку">
          <a-input v-model:value="form.linkUrl" />
        </a-form-item>
        <a-form-item label="Текст кнопки">
          <a-input v-model:value="form.buttonText" />
        </a-form-item>
        <a-form-item
          v-if="!isSingle"
          label="Порядок сортування"
        >
          <a-input-number
            v-model:value="form.sortOrder"
            :min="0"
            class="admin-banners__number"
          />
        </a-form-item>
        <a-form-item label="Активний">
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

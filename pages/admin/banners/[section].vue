<script setup lang="ts">
import { message } from 'ant-design-vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface AdminBanner {
  id: number
  slug: string | null
  title: string
  subtitle: string | null
  description: string | null
  mediaUrl: string | null
  mediaType: string
  linkUrl: string | null
  sortOrder: number
  isActive: boolean
}

// Real backend shapes (see banner.serializer.ts) — hero -> MainBanner,
// special_1/special_2 -> SpecialBanner, promo -> PromoTile (3 fixed slots),
// hot -> HotTile (5 fixed slots).
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
interface ApiPromoTile {
  slug: string
  title: string
  subtitle: string
  link_url: string | null
  is_configured: boolean
}
interface ApiHotTile {
  slug: string
  label: string
  image_url: string
  link_url: string | null
  is_configured: boolean
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
const isPromoSection = computed(() => section.value === 'promo')
const isHotSection = computed(() => section.value === 'hot')
const isFixedSlotSection = computed(() => isPromoSection.value || isHotSection.value)
const isSingle = computed(() => isSpecialSection.value)
const showMedia = computed(() => section.value !== 'promo')
const title = computed(() => SECTION_LABELS[section.value] ?? section.value)

useHead(() => ({ title: `Адмінка — ${title.value}` }))

const { authFetch } = useAuthFetch()

const banners = ref<AdminBanner[]>([])
const loading = ref(false)

const modalOpen = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
// promo/hot rows have no numeric id (fixed slug-keyed slots) — PUT targets
// this instead of editingId.
const editingSlug = ref<string | null>(null)

const emptyForm = () => ({
  title: '',
  subtitle: '',
  description: '',
  mediaUrl: '',
  mediaType: 'image' as 'image' | 'video',
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
})
const form = reactive(emptyForm())

function fromApiMain(b: ApiMainBanner): AdminBanner {
  return {
    id: b.id,
    slug: null,
    title: b.title,
    subtitle: null,
    description: b.description,
    mediaUrl: b.media_url,
    mediaType: b.media_type,
    linkUrl: b.link_url,
    sortOrder: b.sort_order,
    isActive: b.is_active,
  }
}

function fromApiSpecial(b: ApiSpecialBanner): AdminBanner {
  return {
    id: 0,
    slug: b.slug,
    title: b.title,
    subtitle: null,
    description: null,
    mediaUrl: b.image_url,
    mediaType: 'image',
    linkUrl: b.link_url,
    sortOrder: 0,
    isActive: true,
  }
}

function fromApiPromo(t: ApiPromoTile): AdminBanner {
  return {
    id: 0,
    slug: t.slug,
    title: t.title,
    subtitle: t.subtitle,
    description: null,
    mediaUrl: null,
    mediaType: 'image',
    linkUrl: t.link_url,
    sortOrder: 0,
    isActive: t.is_configured,
  }
}

function fromApiHot(t: ApiHotTile): AdminBanner {
  return {
    id: 0,
    slug: t.slug,
    title: t.label,
    subtitle: null,
    description: null,
    mediaUrl: t.image_url,
    mediaType: 'image',
    linkUrl: t.link_url,
    sortOrder: 0,
    isActive: t.is_configured,
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
    } else if (isPromoSection.value) {
      const res = await authFetch<{ data: ApiPromoTile[] }>('/api/admin/banners/promo')
      banners.value = res.data.map(fromApiPromo)
    } else {
      const res = await authFetch<{ data: ApiHotTile[] }>('/api/admin/banners/hot')
      banners.value = res.data.map(fromApiHot)
    }
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  editingSlug.value = null
  Object.assign(form, emptyForm())
  modalOpen.value = true
}

function openEdit(banner: AdminBanner) {
  editingId.value = banner.id
  editingSlug.value = banner.slug
  Object.assign(form, {
    title: banner.title,
    subtitle: banner.subtitle ?? '',
    description: banner.description ?? '',
    mediaUrl: banner.mediaUrl ?? '',
    mediaType: (banner.mediaType as 'image' | 'video') ?? 'image',
    linkUrl: banner.linkUrl ?? '',
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
    } else if (isPromoSection.value) {
      const body = {
        title: form.title,
        subtitle: form.subtitle,
        link_url: form.linkUrl || null,
      }
      await authFetch(`/api/admin/banners/promo/${editingSlug.value}`, { method: 'PUT', body })
    } else {
      const body = {
        label: form.title,
        image_url: form.mediaUrl,
        link_url: form.linkUrl || null,
      }
      await authFetch(`/api/admin/banners/hot/${editingSlug.value}`, { method: 'PUT', body })
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
    await load()
    message.success('Банер видалено')
  } else if (isSpecialSection.value) {
    await authFetch(`/api/admin/banners/special/${section.value}`, { method: 'DELETE' })
    await load()
    message.success('Банер видалено')
  } else {
    // promo/hot slots are fixed — DELETE clears the row instead of removing it.
    const kind = isPromoSection.value ? 'promo' : 'hot'
    await authFetch(`/api/admin/banners/${kind}/${banner.slug}`, { method: 'DELETE' })
    await load()
    message.success('Слот очищено')
  }
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
        v-else-if="isMainSection"
        type="primary"
        @click="openCreate"
        >Додати слайд</a-button
      >
    </div>

    <a-empty
      v-if="!loading && !banners.length"
      description="Банер ще не створено"
    />

    <div
      v-else-if="isMainSection"
      class="admin-banners__list"
    >
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="admin-banners__item"
      >
        <div class="admin-banners__item-media">
          <img
            v-if="banner.mediaUrl"
            :src="banner.mediaUrl"
            :alt="banner.title"
            class="admin-banners__item-img"
          />
        </div>
        <div class="admin-banners__item-body">
          <p class="admin-banners__item-title">{{ banner.title }}</p>
          <p
            v-if="banner.linkUrl"
            class="admin-banners__item-link"
          >
            {{ banner.linkUrl }}
          </p>
          <p class="admin-banners__item-meta">
            Порядок: {{ banner.sortOrder }} · Активний: {{ banner.isActive ? 'Так' : 'Ні' }}
          </p>
        </div>
        <div class="admin-banners__item-actions">
          <a-button
            size="small"
            @click="openEdit(banner)"
            >Редагувати</a-button
          >
          <a-popconfirm
            title="Видалити банер?"
            @confirm="remove(banner)"
          >
            <a-button
              size="small"
              danger
              >Видалити</a-button
            >
          </a-popconfirm>
        </div>
      </div>
    </div>

    <div
      v-else-if="isFixedSlotSection"
      class="admin-banners__list"
    >
      <div
        v-for="banner in banners"
        :key="banner.slug ?? banner.id"
        class="admin-banners__item"
      >
        <div
          v-if="isHotSection"
          class="admin-banners__item-media"
        >
          <img
            v-if="banner.mediaUrl"
            :src="banner.mediaUrl"
            :alt="banner.title"
            class="admin-banners__item-img"
          />
        </div>
        <div class="admin-banners__item-body">
          <p class="admin-banners__item-title">{{ banner.title || '(порожньо)' }}</p>
          <p
            v-if="banner.subtitle"
            class="admin-banners__item-subtitle"
          >
            {{ banner.subtitle }}
          </p>
          <p
            v-if="banner.linkUrl"
            class="admin-banners__item-link"
          >
            {{ banner.linkUrl }}
          </p>
          <p class="admin-banners__item-meta">
            {{ banner.isActive ? 'Заповнено' : 'Порожній слот' }}
          </p>
        </div>
        <div class="admin-banners__item-actions">
          <a-button
            size="small"
            @click="openEdit(banner)"
            >Редагувати</a-button
          >
          <a-popconfirm
            title="Очистити слот?"
            @confirm="remove(banner)"
          >
            <a-button
              size="small"
              danger
              >Очистити</a-button
            >
          </a-popconfirm>
        </div>
      </div>
    </div>

    <div
      v-else-if="banners.length"
      class="admin-banners__item"
    >
      <div class="admin-banners__item-media">
        <img
          v-if="banners[0].mediaUrl"
          :src="banners[0].mediaUrl"
          :alt="banners[0].title"
          class="admin-banners__item-img"
        />
      </div>
      <div class="admin-banners__item-body">
        <p class="admin-banners__item-title">{{ banners[0].title }}</p>
        <p
          v-if="banners[0].linkUrl"
          class="admin-banners__item-link"
        >
          {{ banners[0].linkUrl }}
        </p>
      </div>
    </div>

    <a-modal
      v-model:open="modalOpen"
      :title="
        isFixedSlotSection
          ? 'Редагувати слот'
          : editingId !== null
            ? 'Редагувати банер'
            : 'Новий банер'
      "
      :confirm-loading="submitting"
      @ok="submit"
    >
      <a-form layout="vertical">
        <a-form-item label="Заголовок">
          <a-input v-model:value="form.title" />
        </a-form-item>
        <a-form-item
          v-if="isPromoSection"
          label="Підзаголовок"
        >
          <a-input v-model:value="form.subtitle" />
        </a-form-item>
        <a-form-item
          v-if="isMainSection"
          label="Опис"
        >
          <a-textarea
            v-model:value="form.description"
            :rows="3"
          />
        </a-form-item>
        <template v-if="showMedia">
          <a-form-item
            v-if="isMainSection"
            label="Тип медіа"
          >
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
        <a-form-item label="Посилання при кліку">
          <a-input v-model:value="form.linkUrl" />
        </a-form-item>
        <a-form-item
          v-if="isMainSection"
          label="Порядок сортування"
        >
          <a-input-number
            v-model:value="form.sortOrder"
            :min="0"
            class="admin-banners__number"
          />
        </a-form-item>
        <a-form-item
          v-if="isMainSection"
          label="Активний"
        >
          <a-switch v-model:checked="form.isActive" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;

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

  // Multiple hero slides stack as a list of __item cards; a special-slot
  // banner (single record) reuses the same __item card standalone.
  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  // Read-only snapshot of a banner so an admin can see what's live —
  // thumbnail, title, link — without opening the edit modal.
  &__item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $color-gray-50;
  }

  &__item-media {
    flex: 0 0 96px;
    width: 96px;
    height: 96px;
    border-radius: $radius-md;
    overflow: hidden;
    background: $color-gray-100;
  }

  &__item-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__item-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1 1 auto;
  }

  &__item-title {
    margin: 0;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__item-subtitle {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-gray-600;
  }

  &__item-link {
    margin: 0;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-500;
    word-break: break-all;
  }

  &__item-meta {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-gray-400;
  }

  &__item-actions {
    display: flex;
    flex: 0 0 auto;
    gap: 8px;
  }
}
</style>

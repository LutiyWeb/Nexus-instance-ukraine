<script setup lang="ts">
import { Paperclip, X } from 'lucide-vue-next'

// Temporary storage: posts straight to this app's own /api/bug-reports (Nuxt
// server route → Supabase table), not to shopmarker-backend — see TODOS.md
// for the plan to move this to a real backend endpoint later.
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const toastStore = useToastStore()

const title = ref('')
const description = ref('')
const screenshot = ref<File | null>(null)
const error = ref('')
const submitting = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) return
    title.value = ''
    description.value = ''
    screenshot.value = null
    error.value = ''
  },
)

function close() {
  emit('update:open', false)
}

function onScreenshotChange(e: Event) {
  screenshot.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function submit() {
  if (!title.value.trim() || !description.value.trim()) {
    error.value = 'Заповніть заголовок і опис проблеми'
    return
  }
  error.value = ''

  const body = new FormData()
  body.append('title', title.value.trim())
  body.append('description', description.value.trim())
  if (screenshot.value) body.append('screenshot', screenshot.value)

  submitting.value = true
  try {
    await $fetch('/api/bug-reports', { method: 'POST', body })
    toastStore.add('Дякуємо! Звіт про проблему надіслано', 'success')
    close()
  } catch {
    toastStore.add('Не вдалося надіслати звіт. Спробуйте ще раз.', 'error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <h3 class="report-bug-form__title">Повідомити про проблему</h3>
    <p class="report-bug-form__sub">Опишіть, що пішло не так — за потреби додайте скрін.</p>

    <form
      class="app-modal__form"
      @submit.prevent="submit"
    >
      <div class="report-bug-form__field">
        <label class="report-bug-form__field-label">Заголовок</label>
        <input
          v-model="title"
          type="text"
          class="report-bug-form__input"
          placeholder="Наприклад: не працює кнопка «Купити»"
        />
      </div>

      <div class="report-bug-form__field">
        <label class="report-bug-form__field-label">Опис проблеми</label>
        <textarea
          v-model="description"
          class="report-bug-form__textarea"
          rows="4"
          placeholder="Наприклад: не натискається кнопка «Купити» на сторінці товару"
        />
        <span
          v-if="error"
          class="app-modal__error"
          >{{ error }}</span
        >
      </div>

      <label class="report-bug-form__file">
        <input
          type="file"
          accept="image/*"
          class="report-bug-form__file-input"
          @change="onScreenshotChange"
        />
        <Paperclip
          :size="16"
          class="report-bug-form__file-icon"
        />
        <span class="report-bug-form__file-name">{{ screenshot?.name ?? 'Прикріпити скрін' }}</span>
        <button
          v-if="screenshot"
          type="button"
          class="report-bug-form__file-clear"
          @click.prevent="screenshot = null"
        >
          <X :size="12" />
        </button>
      </label>

      <div class="report-bug-form__actions">
        <AppButton
          type="button"
          variant="outline"
          size="md"
          @click="close"
          >Скасувати</AppButton
        >
        <AppButton
          type="submit"
          variant="primary"
          size="md"
          :loading="submitting"
        >
          Надіслати
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.report-bug-form {
  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin: 0 0 8px;
  }

  &__sub {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin: 0 0 20px;
    max-width: 380px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__field-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__textarea,
  &__input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid $color-gray-300;
    border-radius: $radius-md;
    font-size: $font-size-base;
    font-family: $font-family-base;
    color: $color-gray-900;
    background: $color-white;
    outline: none;
    transition: border-color $transition-base;

    &::placeholder {
      color: $color-gray-400;
    }

    &:focus {
      border-color: $color-primary;
    }
  }

  &__textarea {
    resize: vertical;
  }

  &__file {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    padding: 0 12px;
    border: 1px dashed $color-gray-300;
    border-radius: $radius-md;
    color: $color-gray-600;
    cursor: pointer;
    transition: border-color $transition-fast;

    &:hover {
      border-color: $color-primary;
    }
  }

  &__file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  &__file-icon {
    flex-shrink: 0;
    color: $color-gray-400;
  }

  &__file-name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: $font-size-sm;
  }

  &__file-clear {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: $radius-full;
    background: $color-gray-100;
    color: $color-gray-500;

    &:hover {
      background: $color-gray-200;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;

    .app-btn {
      --btn-min-width: 0;
      flex: 1;
    }
  }
}
</style>

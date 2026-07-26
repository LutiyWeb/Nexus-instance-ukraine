<script setup lang="ts">
import { message } from 'ant-design-vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const { authFetch } = useAuthFetch()
const uploading = ref(false)

async function customRequest(options: {
  file: File
  onSuccess?: (body: unknown) => void
  onError?: (err: unknown) => void
}) {
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    const res = await authFetch<{ data: { url: string } }>('/api/uploads', {
      method: 'POST',
      body: formData,
    })
    emit('update:modelValue', res.data.url)
    options.onSuccess?.(res)
  } catch (err) {
    message.error('Не удалось загрузить файл')
    options.onError?.(err)
  } finally {
    uploading.value = false
  }
}

function remove() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="admin-image-upload">
    <div v-if="modelValue" class="admin-image-upload__preview">
      <img :src="modelValue" alt="" class="admin-image-upload__img" />
      <a-button size="small" danger @click="remove">Удалить</a-button>
    </div>
    <a-upload-dragger
      v-else
      :custom-request="customRequest"
      :show-upload-list="false"
      :disabled="uploading"
      accept="image/*"
    >
      <p class="admin-image-upload__hint">
        {{ uploading ? 'Загрузка...' : 'Перетащите изображение сюда или нажмите для выбора' }}
      </p>
    </a-upload-dragger>
  </div>
</template>

<style lang="scss" scoped>
.admin-image-upload {
  &__preview {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__img {
    max-width: 160px;
    max-height: 90px;
    object-fit: cover;
    border-radius: 4px;
  }

  &__hint {
    margin: 0;
    padding: 8px;
  }
}
</style>

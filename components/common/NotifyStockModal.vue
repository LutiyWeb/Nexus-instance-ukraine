<script setup lang="ts">
import { notifyStockSchema } from '~/contracts/stockNotifications'

interface Props {
  open: boolean
  productId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [boolean]
}>()

const config = useRuntimeConfig()
const toastStore = useToastStore()

const email = ref('')
const error = ref('')
const submitting = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    email.value = ''
    error.value = ''
  },
)

function close() {
  emit('update:open', false)
}

async function submit() {
  const result = notifyStockSchema.safeParse({ email: email.value })
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? 'Некоректний email'
    return
  }
  error.value = ''

  submitting.value = true
  try {
    await $fetch(`${config.public.apiBase}/api/products/${props.productId}/notify-stock`, {
      method: 'POST',
      body: { email: result.data.email },
    })
    toastStore.add("Ми повідомимо вас, коли товар з'явиться в наявності", 'success')
    close()
  } catch {
    toastStore.add('Не вдалося зберегти email, спробуйте ще раз', 'error')
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
    <h3 class="notify-stock-modal__title">Повідомити про наявність</h3>
    <p class="notify-stock-modal__sub">
      Залиште email — напишемо, щойно товар зʼявиться в наявності.
    </p>

    <form
      class="app-modal__form"
      @submit.prevent="submit"
    >
      <AppInputText
        v-model="email"
        label="Електронна пошта"
        placeholder="you@example.com"
        :error="error"
      />

      <div class="notify-stock-modal__actions">
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
          Повідомити
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.notify-stock-modal {
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

  &__actions {
    display: flex;
    gap: 8px;

    .app-btn {
      flex: 1;
    }
  }
}
</style>

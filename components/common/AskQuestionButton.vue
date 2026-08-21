<script setup lang="ts">
import { MessageCircleQuestion } from 'lucide-vue-next'

interface Props {
  productId: number
}

defineProps<Props>()
const emit = defineEmits<{ submitted: [] }>()

const authStore = useAuthStore()
const uiStore = useUiStore()
const open = ref(false)

function handleClick() {
  if (!authStore.isLoggedIn) {
    uiStore.authModalOpen = true
    return
  }
  open.value = true
}
</script>

<template>
  <AppButton
    variant="primary"
    size="md"
    @click="handleClick"
  >
    <MessageCircleQuestion :size="16" />
    Поставити запитання
  </AppButton>
  <AskQuestionModal
    v-model:open="open"
    :product-id="productId"
    @submitted="emit('submitted')"
  />
</template>

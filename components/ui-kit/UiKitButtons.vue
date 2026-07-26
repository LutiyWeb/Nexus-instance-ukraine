<script setup lang="ts">
import { Trash2, Plus, ArrowRight } from 'lucide-vue-next'

const loadingDemo = ref(false)
function triggerLoading() {
  loadingDemo.value = true
  setTimeout(() => {
    loadingDemo.value = false
  }, 2000)
}

const VARIANTS_CODE = `<AppButton variant="primary">Основний</AppButton>
<AppButton variant="secondary">Другорядний</AppButton>
<AppButton variant="outline">Outline</AppButton>
<AppButton variant="ghost">Ghost</AppButton>
<AppButton variant="danger">Danger</AppButton>`

const SIZES_CODE = `<AppButton size="sm">Small</AppButton>
<AppButton size="md">Medium</AppButton>
<AppButton size="lg">Large</AppButton>`

const STATES_CODE = `<AppButton :loading="true">Завантаження...</AppButton>
<AppButton :disabled="true">Недоступна</AppButton>`

const ICON_CODE = `<AppButton variant="primary">
  <Plus :size="16" /> Додати
</AppButton>
<AppButton variant="outline">
  Далі <ArrowRight :size="16" />
</AppButton>
<AppButton variant="danger">
  <Trash2 :size="16" />
</AppButton>`

const PROPS = [
  {
    name: 'variant',
    type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'",
    default: "'primary'",
    description: 'Візуальний стиль кнопки',
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Розмір кнопки' },
  { name: 'tag', type: "'button' | 'a' | 'span'", default: "'button'", description: 'HTML тег' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Заблокувати кнопку' },
  {
    name: 'loading',
    type: 'boolean',
    default: 'false',
    description: 'Стан завантаження (показує спінер)',
  },
]
</script>

<template>
  <div class="uikit-buttons">
    <UiKitSection
      title="Варіанти"
      description="Усі доступні візуальні стилі компонента AppButton"
    >
      <template #preview>
        <AppButton variant="primary">Основний</AppButton>
        <AppButton variant="secondary">Другорядний</AppButton>
        <AppButton variant="outline">Outline</AppButton>
        <AppButton variant="ghost">Ghost</AppButton>
        <AppButton variant="danger">Danger</AppButton>
      </template>
      <template #code>
        <UiKitCodeBlock :code="VARIANTS_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection title="Розміри">
      <template #preview>
        <AppButton size="sm">Small</AppButton>
        <AppButton size="md">Medium</AppButton>
        <AppButton size="lg">Large</AppButton>
      </template>
      <template #code>
        <UiKitCodeBlock :code="SIZES_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection title="Стани" description="Натисни на кнопку 'Завантаження' для демонстрації">
      <template #preview>
        <AppButton :loading="loadingDemo" @click="triggerLoading">
          {{ loadingDemo ? 'Завантажується...' : 'Натисни для завантаження' }}
        </AppButton>
        <AppButton :disabled="true">Недоступна</AppButton>
      </template>
      <template #code>
        <UiKitCodeBlock :code="STATES_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection title="З іконками">
      <template #preview>
        <AppButton variant="primary"><Plus :size="16" /> Додати</AppButton>
        <AppButton variant="outline">Далі <ArrowRight :size="16" /></AppButton>
        <AppButton variant="danger"><Trash2 :size="16" /></AppButton>
      </template>
      <template #code>
        <UiKitCodeBlock :code="ICON_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection title="Пропси">
      <UiKitPropsTable :rows="PROPS" />
    </UiKitSection>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.uikit-buttons {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
</style>

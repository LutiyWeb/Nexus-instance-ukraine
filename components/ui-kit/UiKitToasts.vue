<script setup lang="ts">
const toastStore = useToastStore()

const customMessage = ref('Моє повідомлення')
const customType = ref<'success' | 'error' | 'warning'>('success')

const USAGE_CODE = `import { useToastStore } from '~/stores/toast'

const toastStore = useToastStore()

// Додати тост
toastStore.add('Товар додано до кошика', 'success')
toastStore.add('Недостатньо товару на складі', 'error')
toastStore.add('Товар додано до обраного', 'warning')`

const STORE_CODE = `// stores/toast.ts
export type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
}

// Тост автоматично зникає через 3.5 секунди`
</script>

<template>
  <div class="uikit-toasts">
    <UiKitSection
      title="Види тостів"
      description="Три типи сповіщень: успіх, помилка, попередження"
    >
      <template #preview>
        <div style="display: flex; flex-wrap: wrap; gap: 12px">
          <AppButton
            variant="primary"
            size="sm"
            @click="toastStore.add('Товар успішно додано до кошика', 'success')"
          >
            Success
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            @click="toastStore.add('Не вдалося виконати операцію', 'error')"
          >
            Error
          </AppButton>
          <AppButton
            variant="outline"
            size="sm"
            @click="toastStore.add('Товар додано до обраного', 'warning')"
          >
            Warning
          </AppButton>
        </div>
      </template>
    </UiKitSection>

    <UiKitSection
      title="Конструктор тоста"
      description="Створи своє повідомлення"
    >
      <template #preview>
        <div
          style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 480px"
        >
          <AppInputText
            v-model="customMessage"
            label="Текст повідомлення"
          />
          <div style="display: flex; gap: 8px">
            <label
              v-for="t in ['success', 'error', 'warning']"
              :key="t"
              class="uikit-toasts__radio"
            >
              <input
                v-model="customType"
                type="radio"
                :value="t"
              />
              {{ t }}
            </label>
          </div>
          <AppButton
            variant="outline"
            size="sm"
            style="align-self: flex-start"
            @click="toastStore.add(customMessage || 'Порожнє повідомлення', customType)"
          >
            Показати тост
          </AppButton>
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock
          :code="USAGE_CODE"
          language="ts"
        />
      </template>
    </UiKitSection>

    <UiKitSection title="API тостів">
      <UiKitPropsTable
        :rows="[
          {
            name: 'add(message, type)',
            type: 'function',
            description: 'Показати тост. Зникає через 3.5 сек',
          },
          { name: 'remove(id)', type: 'function', description: 'Видалити тост за id' },
          { name: 'toasts', type: 'Toast[]', description: 'Поточний список тостів' },
        ]"
      />
      <UiKitCodeBlock
        :code="STORE_CODE"
        language="ts"
      />
    </UiKitSection>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.uikit-toasts {
  display: flex;
  flex-direction: column;
  gap: 40px;

  &__radio {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: $font-size-sm;
    color: $color-gray-700;
    cursor: pointer;

    input {
      accent-color: $color-primary;
      cursor: pointer;
    }
  }
}
</style>

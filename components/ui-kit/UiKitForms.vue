<script setup lang="ts">
import { z } from 'zod'

const text1 = ref('')
const text2 = ref('')
const text3 = ref('')
const password = ref('')
const checkbox = ref(false)
const radio = ref('option1')
const select = ref('')

// Zod error state demo
const zodSchema = z.object({
  email: z.string().email('Введіть коректний email'),
  name: z.string().min(2, 'Мінімум 2 символи'),
})
const zodForm = reactive({ email: '', name: '' })
const zodErrors = ref<Record<string, string>>({})

function validateZod() {
  const result = zodSchema.safeParse(zodForm)
  zodErrors.value = {}
  if (!result.success) {
    result.error.issues.forEach(e => {
      const key = e.path[0] as string
      if (!zodErrors.value[key]) zodErrors.value[key] = e.message
    })
  } else {
    zodErrors.value = {}
  }
}

const INPUT_CODE = `<AppInputText
  v-model="value"
  label="Назва поля"
  placeholder="Введіть значення"
  :error="errors.field"
/>`

const ZOD_CODE = `const schema = z.object({
  email: z.string().email('Введіть коректний email'),
})
const errors = ref({})

function validate() {
  const result = schema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach(e => {
      errors.value[e.path[0]] = e.message
    })
  }
}`

const PROPS = [
  { name: 'modelValue', type: 'string', description: 'Значення (v-model)' },
  { name: 'label', type: 'string', description: 'Текст мітки над полем' },
  { name: 'placeholder', type: 'string', description: 'Плейсхолдер' },
  { name: 'error', type: 'string', description: 'Текст помилки валідації' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Заблокувати поле' },
]
</script>

<template>
  <div class="uikit-forms">

    <UiKitSection title="AppInputText" description="Текстове поле на базі PrimeVue InputText">
      <template #preview>
        <div style="display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 400px">
          <AppInputText v-model="text1" label="Нормальний стан" placeholder="Введіть текст" />
          <AppInputText v-model="text2" label="З помилкою" placeholder="Введіть текст" error="Це поле обов'язкове" />
          <AppInputText v-model="text3" label="Заблоковано" placeholder="Недоступно" :disabled="true" />
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="INPUT_CODE" />
      </template>
      <template #props>
        <UiKitPropsTable :rows="PROPS" />
      </template>
    </UiKitSection>

    <UiKitSection title="AppPasswordInput" description="Поле пароля з перемикачем видимості">
      <template #preview>
        <div style="width: 100%; max-width: 400px">
          <AppPasswordInput v-model="password" label="Пароль" placeholder="Введіть пароль" />
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code='`<AppPasswordInput v-model="password" label="Пароль" />`' />
      </template>
    </UiKitSection>

    <UiKitSection title="Checkbox і Radio" description="Нативні елементи зі стилями проєкту">
      <template #preview>
        <div style="display: flex; flex-direction: column; gap: 12px">
          <label class="uk-form-check">
            <input v-model="checkbox" type="checkbox" class="uk-form-check__input" />
            <span>Погоджуюсь з умовами</span>
          </label>
          <label class="uk-form-check">
            <input v-model="radio" type="radio" value="option1" class="uk-form-check__input" />
            <span>Варіант 1</span>
          </label>
          <label class="uk-form-check">
            <input v-model="radio" type="radio" value="option2" class="uk-form-check__input" />
            <span>Варіант 2</span>
          </label>
        </div>
        <div style="font-size: 13px; color: #6b7280; margin-top: 8px">
          checkbox: {{ checkbox }} · radio: {{ radio }}
        </div>
      </template>
    </UiKitSection>

    <UiKitSection title="Zod-валідація" description="Натисни 'Перевірити' щоб побачити помилки валідації">
      <template #preview>
        <div style="display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 400px">
          <AppInputText v-model="zodForm.name" label="Ім'я" placeholder="Іван" :error="zodErrors.name" />
          <AppInputText v-model="zodForm.email" label="Email" placeholder="example@mail.com" :error="zodErrors.email" />
          <AppButton variant="outline" size="sm" @click="validateZod">Перевірити валідацію</AppButton>
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="ZOD_CODE" language="ts" />
      </template>
    </UiKitSection>

  </div>
</template>

<style lang="scss">
@use "~/assets/styles/variables" as *;
@use "~/assets/styles/mixins" as mixins;
.uikit-forms { display: flex; flex-direction: column; gap: 40px; }

.uk-form-check {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: $font-size-sm;
  color: $color-gray-700;

  &__input {
    width: 16px;
    height: 16px;
    accent-color: $color-primary;
    cursor: pointer;
  }
}
</style>

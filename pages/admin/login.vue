<script setup lang="ts">
import { z } from 'zod'
import type AppCaptcha from '~/components/common/AppCaptcha.vue'

definePageMeta({ layout: 'empty', middleware: 'admin' })

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const captchaToken = ref('')
const captchaError = ref('')
const accessError = ref('')
const captchaRef = ref<InstanceType<typeof AppCaptcha> | null>(null)

const submitted = ref(false)
const errors = ref<Record<string, string>>({})

const loginSchema = z.object({
  email: z.string().min(1, 'Введіть email').email('Некоректний email'),
  password: z.string().min(1, 'Введіть пароль'),
})

function validate(): boolean {
  const result = loginSchema.safeParse({ email: email.value, password: password.value })
  if (result.success) {
    errors.value = {}
    return true
  }
  const fieldErrors = result.error.flatten().fieldErrors
  errors.value = Object.fromEntries(
    Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? '']),
  )
  return false
}

watch([email, password], () => {
  if (submitted.value) validate()
})

function onCaptchaVerify(token: string) {
  captchaToken.value = token
  captchaError.value = ''
}

function onCaptchaExpired() {
  captchaToken.value = ''
}

async function submit() {
  submitted.value = true
  accessError.value = ''
  if (!validate()) return

  if (!captchaToken.value) {
    captchaError.value = 'Пройдіть перевірку капчі'
    return
  }

  try {
    await authStore.login(email.value, password.value, captchaToken.value)

    if (authStore.user?.role !== 'admin') {
      authStore.logout()
      accessError.value = 'Доступ лише для адміністраторів'
      return
    }

    await navigateTo('/admin')
  } catch {
    // authStore.error вже заповнений
  } finally {
    captchaToken.value = ''
    captchaError.value = ''
    captchaRef.value?.reset()
  }
}
</script>

<template>
  <div class="admin-login">
    <form class="admin-login__form" @submit.prevent="submit">
      <h1 class="admin-login__title">Вхід в адмінку</h1>

      <AppInputText v-model="email" label="Email" placeholder="email@example.com" :error="errors.email" />
      <AppPasswordInput v-model="password" label="Пароль" placeholder="Пароль" :error="errors.password" />

      <AppCaptcha ref="captchaRef" @verify="onCaptchaVerify" @expired="onCaptchaExpired" />

      <p v-if="captchaError || accessError || authStore.error" class="admin-login__error">
        {{ captchaError || accessError || authStore.error }}
      </p>

      <AppButton type="submit" variant="primary" size="md" :loading="authStore.loading">
        Увійти
      </AppButton>
    </form>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;

.admin-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 16px;

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 360px;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__error {
    font-size: $font-size-sm;
    color: $color-danger;
  }
}
</style>

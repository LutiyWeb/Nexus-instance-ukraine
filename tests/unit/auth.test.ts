// @vitest-environment happy-dom

import axios from 'axios'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia } from 'pinia'
import { afterEach, expect, it, vi } from 'vitest'
import type { User } from '~/contracts/auth'
import { useAuthStore } from '~/stores/auth'

mockNuxtImport('useRuntimeConfig', () => () => ({
  public: { apiBase: 'https://api.example.com' },
}))

mockNuxtImport('useWishlistsStore', () => () => ({
  syncGuest: vi.fn().mockResolvedValue(undefined),
}))

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

it('marks a guest as logged in after a successful login', async () => {
  localStorage.clear()

  const user: User = {
    id: 1,
    firstName: 'Test',
    lastName: 'Customer',
    email: 'customer@example.com',
    role: 'customer',
  }
  const apiClient = axios.create()
  vi.spyOn(apiClient, 'post').mockResolvedValue({
    data: { data: { accessToken: 'test-access-token', user } },
  })
  vi.spyOn(axios, 'create').mockReturnValue(apiClient)

  const authStore = useAuthStore(createPinia())
  expect(authStore.isLoggedIn).toBe(false)

  await authStore.login(user.email, 'test-password')

  expect(authStore.isLoggedIn).toBe(true)
})

it('keeps a guest logged out and shows an error after a failed login', async () => {
  const serverError = {
    isAxiosError: true,
    response: { data: { error: { message: 'Невірний пароль' } } },
  }
  const apiClient = axios.create()
  vi.spyOn(apiClient, 'post').mockRejectedValue(serverError)
  vi.spyOn(axios, 'create').mockReturnValue(apiClient)

  const authStore = useAuthStore(createPinia())

  await expect(authStore.login('customer@example.com', 'wrong-password')).rejects.toBe(serverError)

  expect(authStore.isLoggedIn).toBe(false)
  expect(authStore.error).toBe('Невірний пароль')
})

it('restores the session from localStorage after a page reload', () => {
  const user: User = {
    id: 1,
    firstName: 'Test',
    lastName: 'Customer',
    email: 'customer@example.com',
    role: 'customer',
  }
  localStorage.setItem('access_token', 'saved-access-token')
  localStorage.setItem('auth_user', JSON.stringify(user))

  const authStore = useAuthStore(createPinia())

  expect(authStore.isLoggedIn).toBe(true)
})

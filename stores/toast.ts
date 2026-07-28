import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'warning'

export interface ToastAction {
  label: string
  to: string
}

export interface Toast {
  id: number
  message: string
  type: ToastType
  action?: ToastAction
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let counter = 0

  function add(message: string, type: ToastType = 'success', action?: ToastAction) {
    const id = ++counter
    toasts.value.push({ id, message, type, action })
    setTimeout(() => remove(id), 3500)
  }

  function remove(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx >= 0) toasts.value.splice(idx, 1)
  }

  return { toasts, add, remove }
})

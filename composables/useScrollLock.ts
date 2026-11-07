export function useScrollLock(locked: Ref<boolean> | ComputedRef<boolean>) {
  watch(locked, (val) => {
    if (!import.meta.client) return
    document.body.style.overflow = val ? 'hidden' : ''
  })

  onUnmounted(() => {
    if (import.meta.client) document.body.style.overflow = ''
  })
}

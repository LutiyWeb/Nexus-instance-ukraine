export function useEditableQty(getValue: () => number, setValue: (value: number) => void, min = 1) {
  const editing = ref(false)
  const draft = ref('')
  const inputRef = ref<HTMLInputElement | null>(null)

  function startEdit() {
    draft.value = String(getValue())
    editing.value = true
    nextTick(() => inputRef.value?.focus())
  }

  function commit() {
    const parsed = parseInt(draft.value, 10)
    if (!Number.isNaN(parsed)) {
      const next = Math.max(min, parsed)
      if (next !== getValue()) setValue(next)
    }
    editing.value = false
  }

  function cancel() {
    editing.value = false
  }

  return { editing, draft, inputRef, startEdit, commit, cancel }
}

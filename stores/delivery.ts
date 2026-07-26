import { defineStore } from 'pinia'
import type { Settlement, Warehouse } from '~/contracts/delivery'

export type { Settlement, Warehouse }

/**
 * Nova Poshta reference data, proxied through our backend (the NP key must stay
 * server-side and NP sends no CORS headers).
 */
export const useDeliveryStore = defineStore('delivery', () => {
  const config = useRuntimeConfig()
  const BASE = config.public.apiBase

  const settlements = ref<Settlement[]>([])
  const warehouses = ref<Warehouse[]>([])
  const loadingSettlements = ref(false)
  const loadingWarehouses = ref(false)
  /** Set when the provider itself is unavailable, so the UI can offer a fallback. */
  const unavailable = ref(false)

  // Type-ahead fires per keystroke; only the newest response may write to state.
  let settlementRequestId = 0

  async function searchSettlements(query: string) {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      settlements.value = []
      return
    }

    const requestId = ++settlementRequestId
    loadingSettlements.value = true

    try {
      const res = await $fetch<{ data: Settlement[] }>(`${BASE}/api/delivery/np/settlements`, {
        query: { q: trimmed },
      })
      if (requestId !== settlementRequestId) return
      settlements.value = res.data
      unavailable.value = false
    } catch (err: unknown) {
      if (requestId !== settlementRequestId) return
      settlements.value = []
      unavailable.value = (err as { statusCode?: number })?.statusCode === 503
    } finally {
      if (requestId === settlementRequestId) loadingSettlements.value = false
    }
  }

  async function fetchWarehouses(cityRef: string, type: 'branch' | 'postomat') {
    loadingWarehouses.value = true
    warehouses.value = []

    try {
      const res = await $fetch<{ data: Warehouse[] }>(`${BASE}/api/delivery/np/warehouses`, {
        query: { cityRef, type },
      })
      warehouses.value = res.data
      unavailable.value = false
    } catch (err: unknown) {
      warehouses.value = []
      unavailable.value = (err as { statusCode?: number })?.statusCode === 503
    } finally {
      loadingWarehouses.value = false
    }
  }

  function clearWarehouses() {
    warehouses.value = []
  }

  function reset() {
    settlements.value = []
    warehouses.value = []
    unavailable.value = false
  }

  return {
    settlements,
    warehouses,
    loadingSettlements,
    loadingWarehouses,
    unavailable,
    searchSettlements,
    fetchWarehouses,
    clearWarehouses,
    reset,
  }
})

import type { NpSettlement, NpStreet, NpWarehouse } from '~/contracts/delivery'

export function useNovaPoshta() {
  const config = useRuntimeConfig()
  const base = `${config.public.apiBase}/api/delivery/np`

  async function searchSettlements(q: string, limit = 20) {
    const res = await $fetch<{ data: NpSettlement[] }>(`${base}/settlements`, {
      query: { q, limit },
    })
    return res.data
  }

  async function searchStreets(cityRef: string, q: string, limit = 20) {
    const res = await $fetch<{ data: NpStreet[] }>(`${base}/streets`, {
      query: { cityRef, q, limit },
    })
    return res.data
  }

  async function getWarehouses(cityRef: string, type: 'all' | 'branch' | 'postomat' = 'branch') {
    const res = await $fetch<{ data: NpWarehouse[] }>(`${base}/warehouses`, {
      query: { cityRef, type },
    })
    return res.data
  }

  return { searchSettlements, searchStreets, getWarehouses }
}

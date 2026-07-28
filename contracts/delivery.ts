export interface NpSettlement {
  ref: string
  present: string
  name: string
  area: string
  region: string
  deliveryCityRef: string
  warehouseCount: number
}

export interface NpWarehouse {
  ref: string
  number: string
  description: string
  shortAddress: string
  phone: string
  isPostomat: boolean
  maxWeight: number | null
  longitude: number | null
  latitude: number | null
}

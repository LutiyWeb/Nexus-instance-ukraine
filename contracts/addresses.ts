import { z } from 'zod'
import type { DeliveryMethod } from './delivery'

export interface Address {
  id: number
  city: string
  /** Empty for Nova Poshta warehouse addresses — see the `np*` fields. */
  street: string
  house: string
  apartment: string | null
  recipientName: string | null
  phone: string | null
  deliveryMethod: DeliveryMethod
  npCityRef: string | null
  npWarehouseRef: string | null
  npWarehouseNumber: string | null
  npWarehouseAddress: string | null
  isDefault: boolean
}

export const addressSchema = z.object({
  city: z.string().min(1, 'Введите город').max(128),
  street: z.string().min(1, 'Введите улицу').max(128),
  house: z.string().min(1, 'Введите дом').max(32),
  apartment: z.string().max(32).optional(),
  isDefault: z.boolean().optional(),
})

export type AddressForm = z.infer<typeof addressSchema>

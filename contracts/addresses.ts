import { z } from 'zod'

export interface Address {
  id: number
  city: string
  street: string
  house: string
  apartment: string | null
  recipientName: string | null
  phone: string | null
  isDefault: boolean
}

export const addressSchema = z.object({
  city: z.string().min(1, 'Введіть місто').max(128),
  street: z.string().min(1, 'Введіть вулицю').max(128),
  house: z.string().min(1, 'Введіть будинок').max(32),
  apartment: z.string().max(32).optional(),
  isDefault: z.boolean().optional(),
})

export type AddressForm = z.infer<typeof addressSchema>

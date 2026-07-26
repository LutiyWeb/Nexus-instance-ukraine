import { z } from 'zod'

/** Nova Poshta settlement, from `AddressGeneral.searchSettlements`. */
export interface Settlement {
  ref: string
  /** Full display label, e.g. "м. Київ, Київська обл." */
  present: string
  name: string
  area: string
  region: string
  /**
   * Ref to use when fetching warehouses. Differs from `ref` for villages,
   * which are served by a branch in a nearby city.
   */
  deliveryCityRef: string
  warehouseCount: number
}

/** Nova Poshta warehouse — either a branch (відділення) or a parcel locker (поштомат). */
export interface Warehouse {
  ref: string
  number: string
  description: string
  shortAddress: string
  phone: string
  isPostomat: boolean
  /** Per-parcel weight limit in kg. Lockers are far more restrictive than branches. */
  maxWeight: number | null
  longitude: number | null
  latitude: number | null
}

export interface Street {
  ref: string
  name: string
  type: string
}

export const DELIVERY_METHODS = ['courier', 'np_branch', 'np_postomat', 'np_courier'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

/** Warehouse pickup needs a warehouse ref; door delivery needs a street address. */
export function isWarehouseMethod(method: DeliveryMethod) {
  return method === 'np_branch' || method === 'np_postomat'
}

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  courier: 'Курьер по адресу',
  np_branch: 'Отделение Новой Почты',
  np_postomat: 'Почтомат Новой Почты',
  np_courier: 'Курьер Новой Почты',
}

/**
 * Checkout validation. The shape of a valid address depends on the delivery method,
 * so street/warehouse fields are optional at the field level and enforced in `superRefine`.
 */
export const checkoutSchema = z
  .object({
    recipientName: z.string().trim().min(2, 'Введите имя получателя'),
    phone: z.string().trim().min(10, 'Введите корректный номер телефона'),
    deliveryMethod: z.enum(DELIVERY_METHODS),
    city: z.string().trim().min(1, 'Выберите город'),
    street: z.string().trim().optional(),
    house: z.string().trim().optional(),
    apartment: z.string().trim().optional(),
    npCityRef: z.string().trim().optional(),
    npWarehouseRef: z.string().trim().optional(),
    npWarehouseNumber: z.string().trim().optional(),
    npWarehouseAddress: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (isWarehouseMethod(value.deliveryMethod)) {
      if (!value.npCityRef) {
        ctx.addIssue({ code: 'custom', path: ['city'], message: 'Выберите город из списка' })
      }
      if (!value.npWarehouseRef) {
        ctx.addIssue({
          code: 'custom',
          path: ['npWarehouseRef'],
          message:
            value.deliveryMethod === 'np_postomat' ? 'Выберите почтомат' : 'Выберите отделение',
        })
      }
      return
    }

    if (!value.street) {
      ctx.addIssue({ code: 'custom', path: ['street'], message: 'Введите улицу' })
    }
    if (!value.house) {
      ctx.addIssue({ code: 'custom', path: ['house'], message: 'Введите номер дома' })
    }
  })

export type CheckoutForm = z.infer<typeof checkoutSchema>

export const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  ADDRESS_NOT_FOUND: 'Адрес не найден. Выберите другой.',
  CART_EMPTY: 'Корзина пуста.',
  CART_ITEM_UNAVAILABLE: 'Один из товаров больше недоступен.',
  NOT_ENOUGH_STOCK: 'Недостаточно товара на складе.',
}

export const DELIVERY_UNAVAILABLE_MESSAGE =
  'Сервис Новой Почты временно недоступен. Попробуйте позже или выберите курьерскую доставку.'

import { z } from 'zod'
import type { CartEntry } from '~/contracts/cart'
import type { NpSettlement, NpWarehouse } from '~/contracts/delivery'

export const checkoutSchema = z.object({
  recipientName: z.string().trim().min(2, "Введіть ім'я отримувача"),
  phone: z.string().trim().min(10, 'Введіть коректний номер телефону'),
  notes: z.string().optional(),
})

export type CheckoutForm = z.infer<typeof checkoutSchema>

export const CHECKOUT_ERROR_MESSAGES: Record<string, string> = {
  ADDRESS_NOT_FOUND: 'Адресу не знайдено. Оберіть іншу.',
  CART_EMPTY: 'Кошик порожній.',
  CART_ITEM_UNAVAILABLE: 'Один із товарів більше недоступний.',
  NOT_ENOUGH_STOCK: 'Недостатньо товару на складі.',
}

export interface BuildOrderPayloadInput {
  isLoggedIn: boolean
  cartItems: Pick<CartEntry, 'product' | 'qty'>[]
  form: {
    recipientName: string
    phone: string
    street: string
    house: string
    apartment: string
    notes: string
  }
  deliveryMethod: 'np_branch' | 'np_courier'
  selectedAddressId: number | null
  selectedCity: Pick<NpSettlement, 'present' | 'deliveryCityRef'> | null
  selectedWarehouse: Pick<NpWarehouse, 'ref' | 'number' | 'shortAddress'> | null
  paymentMethod: 'cod' | 'card'
  noCallback: boolean
}

export function buildOrderPayload(input: BuildOrderPayloadInput) {
  const {
    isLoggedIn,
    cartItems,
    form,
    deliveryMethod,
    selectedAddressId,
    selectedCity,
    selectedWarehouse,
    paymentMethod,
    noCallback,
  } = input
  const usingSavedAddress = !!selectedAddressId

  return {
    ...(!isLoggedIn
      ? {
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.qty,
          })),
          customer: {
            firstName: form.recipientName,
            phone: form.phone,
          },
        }
      : {}),
    ...(usingSavedAddress
      ? { addressId: selectedAddressId }
      : {
          deliveryAddress: {
            recipientName: form.recipientName,
            phone: form.phone,
            deliveryMethod,
            city: selectedCity?.present ?? '',
            npCityRef: selectedCity?.deliveryCityRef,
            ...(deliveryMethod === 'np_branch'
              ? {
                  npWarehouseRef: selectedWarehouse?.ref,
                  npWarehouseNumber: selectedWarehouse?.number,
                  npWarehouseAddress: selectedWarehouse?.shortAddress,
                }
              : {
                  street: form.street,
                  house: form.house,
                  apartment: form.apartment || undefined,
                }),
          },
        }),
    // Not yet persisted by the backend — see checkout notes.
    paymentMethod,
    noCallback,
    notes: form.notes || undefined,
  }
}

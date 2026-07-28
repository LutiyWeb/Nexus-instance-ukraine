import { z } from 'zod'

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

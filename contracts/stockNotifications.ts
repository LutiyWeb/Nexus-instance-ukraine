import { z } from 'zod'

export const notifyStockSchema = z.object({
  email: z.string().trim().min(1, 'Введіть email').email('Некоректний email'),
})

export type NotifyStockForm = z.infer<typeof notifyStockSchema>

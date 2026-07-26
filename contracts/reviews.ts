import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Оберіть оцінку').max(5),
  text: z.string().trim().min(10, 'Мінімум 10 символів').max(1000, 'Максимум 1000 символів'),
})

export type ReviewForm = z.infer<typeof reviewSchema>

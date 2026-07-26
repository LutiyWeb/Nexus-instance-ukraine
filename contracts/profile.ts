import { z } from 'zod'

export const profileSchema = z.object({
  firstName: z.string().min(1, "Введіть ім'я").max(64),
  lastName: z.string().min(1, 'Введіть прізвище').max(64),
  email: z.string().email('Невірний формат email').max(255),
  phone: z.string().optional(),
})

export const passwordSchema = z
  .object({
    current: z.string().min(1, 'Введіть поточний пароль'),
    next: z.string().min(8, 'Мінімум 8 символів'),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: 'Паролі не збігаються', path: ['confirm'] })

export type ProfileForm = z.infer<typeof profileSchema>
export type PasswordForm = z.infer<typeof passwordSchema>

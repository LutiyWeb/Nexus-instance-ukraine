export interface LandingCard {
  id: number
  title: string
  description: string
  badge: string
  imageRight?: boolean
}

export const POPULAR_CARDS: LandingCard[] = [
  {
    id: 1,
    title: 'Vue 3 Starter Kit',
    description:
      'Production-ready boilerplate з TypeScript, Pinia та Vue Router. Стартуй за хвилини без зайвих налаштувань.',
    badge: 'Free',
  },
  {
    id: 2,
    title: 'Admin Dashboard',
    description:
      'Повноцінний шаблон панелі адміністратора: таблиці, графіки, аналітика — все готово до роботи.',
    badge: 'Pro',
    imageRight: true,
  },
  {
    id: 3,
    title: 'E-Commerce Template',
    description: 'Повноцінний інтернет-магазин: каталог товарів, кошик та оформлення замовлення.',
    badge: 'Pro',
  },
  {
    id: 4,
    title: 'Blog Starter',
    description: 'Мінімалістичний блог із горизонтальними картками для лістингу статей.',
    badge: 'Free',
    imageRight: true,
  },
]

export const ARTICLES_CARDS: LandingCard[] = [
  {
    id: 1,
    title: 'Як почати з Vue 3',
    description:
      'Повний посібник зі старту проєкту на Vue 3 з нуля: налаштування, структура, перші компоненти.',
    badge: 'Гайд',
  },
  {
    id: 2,
    title: 'Pinia vs Vuex',
    description:
      'Порівнюємо два підходи до керування станом і обираємо відповідний для твого проєкту.',
    badge: 'Стаття',
    imageRight: true,
  },
  {
    id: 3,
    title: 'TypeScript у Vue 3',
    description: 'Типізація пропсів, емітів та стору — практичні приклади з реальних проєктів.',
    badge: 'Гайд',
  },
  {
    id: 4,
    title: 'Оптимізація збірки',
    description: 'Vite, code splitting та lazy loading: як прискорити завантаження в продакшені.',
    badge: 'Стаття',
    imageRight: true,
  },
]

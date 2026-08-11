import svgLoader from 'vite-svg-loader'
import { $fetch } from 'ofetch'

const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000'

async function fetchSitemapUrls() {
  try {
    const [{ data: categories }, firstPage] = await Promise.all([
      $fetch<{ data: { slug: string }[] }>(`${apiBase}/api/categories/`),
      $fetch<{ data: { id: number }[]; meta: { totalPages: number } }>(`${apiBase}/api/products/`, {
        query: { limit: 100, page: 1 },
      }),
    ])

    const productPages = [
      firstPage,
      ...(await Promise.all(
        Array.from({ length: firstPage.meta.totalPages - 1 }, (_, i) =>
          $fetch<{ data: { id: number }[] }>(`${apiBase}/api/products/`, {
            query: { limit: 100, page: i + 2 },
          }),
        ),
      )),
    ]

    const categoryCounts = await Promise.all(
      categories.map((c) =>
        $fetch<{ meta: { total: number } }>(`${apiBase}/api/products/`, {
          query: { categories: c.slug, limit: 1 },
        }).then((res) => [c.slug, res.meta.total] as const),
      ),
    )

    return [
      ...categoryCounts.filter(([, total]) => total > 0).map(([slug]) => `/catalog/${slug}`),
      ...productPages.flatMap((page) => page.data.map((p) => `/product/${p.id}`)),
    ]
  } catch {
    // Backend unreachable at build/request time — ship the static routes only
    // rather than failing the whole sitemap.
    return []
  }
}

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,

  modules: ['@pinia/nuxt', '@nuxt/image', '@nuxtjs/sitemap', '@nuxtjs/robots'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://honey-store.ua',
  },

  sitemap: {
    urls: fetchSitemapUrls,
  },

  robots: {
    disallow: [
      '/admin',
      '/cabinet',
      '/checkout',
      '/cart',
      '/order',
      '/reset-password',
      '/ui',
      '/search',
    ],
  },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&display=swap',
        },
      ],
    },
  },

  image: {
    quality: 80,
    format: ['webp', 'jpg'],
    domains: ['images.unsplash.com', 'image.hubber.pro'],
  },

  css: [
    'modern-normalize/modern-normalize.css',
    'swiper/css',
    'swiper/css/navigation',
    'swiper/css/pagination',
    '~/assets/styles/main.scss',
    '~/assets/styles/globals.scss',
  ],

  features: {
    inlineStyles: false,
  },

  vite: {
    plugins: [svgLoader()],
    server: {
      hmr: { port: 24678 },
    },
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },
  },

  postcss: {
    plugins: { autoprefixer: {} },
  },

  routeRules: {
    '/admin/**': { ssr: false },
    '/about': { prerender: true },
    '/contacts': { prerender: true },
    '/legal': { prerender: true },
    '/privacy-policy': { prerender: true },
    '/public-offer': { prerender: true },
    '/returns-exchanges': { prerender: true },
    '/payment-delivery': { prerender: true },
    '/rules-questions': { prerender: true },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://honey-store.ua',
      isDev: process.env.NODE_ENV !== 'production',
      hcaptchaSiteKey:
        process.env.NODE_ENV === 'production'
          ? process.env.NUXT_PUBLIC_HCAPTCHA_SITE_KEY
          : '10000000-ffff-ffff-ffff-000000000001',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    },
  },

  components: {
    dirs: [{ path: '~/components', pathPrefix: false }],
  },

  imports: {
    dirs: ['stores', 'composables'],
  },
})

import svgLoader from 'vite-svg-loader'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,

  modules: ['@pinia/nuxt', '@nuxt/image'],

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

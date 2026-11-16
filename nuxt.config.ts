import svgLoader from 'vite-svg-loader'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,

  modules: ['@pinia/nuxt', '@nuxt/image', '@nuxtjs/sitemap', '@nuxtjs/robots', 'nuxt-gtag'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://honey-store.ua',
  },

  // Google Analytics 4. No-op until NUXT_PUBLIC_GTAG_ID is set — see .env.
  // Disabled outside production so local/dev browsing doesn't pollute real GA data.
  gtag: {
    id: process.env.NUXT_PUBLIC_GTAG_ID || '',
    enabled: process.env.NODE_ENV === 'production',
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
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
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
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
    // Without this, @nuxt/image auto-detects Vercel at build time and routes
    // every image through Vercel's paid optimization endpoint (/_vercel/image)
    // instead of processing them itself — that endpoint's quota is exhausted
    // in production (402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED on every image).
    provider: 'ipx',
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
    // Server-only (never exposed to the client bundle) — used by server/api/bug-reports.*
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'banners',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://honey-store.ua',
      isDev: process.env.NODE_ENV !== 'production',
      hcaptchaSiteKey:
        process.env.NUXT_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001',
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

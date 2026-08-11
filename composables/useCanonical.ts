export function useCanonical(path?: string) {
  const route = useRoute()
  const config = useRuntimeConfig()

  useHead({
    link: [
      {
        rel: 'canonical',
        href: () => `${config.public.siteUrl}${path ?? route.path}`,
      },
    ],
  })
}

export default defineEventHandler(async () => {
  const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000'

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
    // Backend unreachable — ship the static routes only rather than failing the sitemap.
    return []
  }
})

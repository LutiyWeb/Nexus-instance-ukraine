<script setup lang="ts">
const config = useRuntimeConfig()

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Honey Store',
  url: config.public.siteUrl,
})

useJsonLd({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Honey Store',
  url: config.public.siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${config.public.siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

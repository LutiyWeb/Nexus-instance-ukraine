type JsonLdInput = Record<string, unknown> | Record<string, unknown>[]

export function useJsonLd(data: JsonLdInput | (() => JsonLdInput | null | undefined)) {
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: () => {
          const value = typeof data === 'function' ? data() : data
          if (!value) return ''
          return JSON.stringify(value).replace(/</g, '\\u003c')
        },
      },
    ],
  })
}

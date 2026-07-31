<script setup lang="ts">
import { ImageOff } from 'lucide-vue-next'

interface Breakpoint {
  w: number
  h: number
}

interface Props {
  src: string
  alt?: string
  lazy?: boolean
  imgClass?: string
  sizes?: {
    mobile?: Breakpoint
    tablet?: Breakpoint
    desktop?: Breakpoint
  }
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  lazy: true,
  imgClass: '',
  sizes: () => ({}),
})

const sizesAttr = computed(() => {
  const parts: string[] = []
  if (props.sizes.mobile) parts.push(`(max-width: 767px) ${props.sizes.mobile.w}px`)
  if (props.sizes.tablet) parts.push(`(max-width: 1023px) ${props.sizes.tablet.w}px`)
  if (props.sizes.desktop) parts.push(`${props.sizes.desktop.w}px`)
  return parts.join(', ')
})

const width = computed(
  () => props.sizes.desktop?.w ?? props.sizes.tablet?.w ?? props.sizes.mobile?.w,
)
const height = computed(
  () => props.sizes.desktop?.h ?? props.sizes.tablet?.h ?? props.sizes.mobile?.h,
)

// External vendor CDNs (e.g. image.hubber.pro) aren't ours to guarantee uptime for —
// fall back to a placeholder instead of a broken-image icon.
const hasError = ref(false)
watch(
  () => props.src,
  () => {
    hasError.value = false
  },
)

const imgAttrs = computed(() => ({
  class: ['app-image__img', props.imgClass].filter(Boolean).join(' '),
  decoding: 'async' as const,
  onError: () => {
    hasError.value = true
  },
}))
</script>

<template>
  <NuxtPicture
    v-if="!hasError"
    class="app-image"
    :src="src"
    :alt="alt"
    :loading="lazy ? 'lazy' : 'eager'"
    :sizes="sizesAttr || undefined"
    :width="width"
    :height="height"
    :img-attrs="imgAttrs"
    format="webp,jpg"
  />
  <div v-else class="app-image app-image__fallback" :aria-label="alt">
    <ImageOff :size="24" />
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.app-image {
  display: contents;

  &__img {
    display: block;
    width: var(--ai-width, 100%);
    max-width: 100%;
    height: var(--ai-height, auto);
    object-fit: var(--ai-fit, cover);
    aspect-ratio: var(--ai-ratio, auto);
  }

  // Overrides the `display: contents` above — this needs its own box to
  // occupy the same space the <img> would have.
  &__fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ai-width, 100%);
    max-width: 100%;
    height: var(--ai-height, auto);
    aspect-ratio: var(--ai-ratio, auto);
    background: $color-gray-100;
    color: $color-gray-400;
  }
}
</style>

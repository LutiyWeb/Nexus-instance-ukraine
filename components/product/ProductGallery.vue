<script setup lang="ts">
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Thumbs, Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import { X } from 'lucide-vue-next'

interface Props {
  images: string[]
  title: string
  outOfStock?: boolean
}

withDefaults(defineProps<Props>(), { outOfStock: false })

const { isMd } = useBreakpoints()
const thumbsSwiper = ref<SwiperType | null>(null)

const lightboxOpen = ref(false)
const lightboxActiveIndex = ref(0)
const lightboxThumbsSwiper = ref<SwiperType | null>(null)

function openLightbox(index: number) {
  lightboxActiveIndex.value = index
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
  lightboxThumbsSwiper.value = null
}

function handleLightboxKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeLightbox()
}

watch(lightboxOpen, (open) => {
  if (open) window.addEventListener('keydown', handleLightboxKey)
  else window.removeEventListener('keydown', handleLightboxKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleLightboxKey)
})
</script>

<template>
  <div class="product-gallery">
    <div
      v-if="outOfStock"
      class="product-gallery__oos"
    >
      <span class="product-gallery__oos-badge">Немає в наявності</span>
    </div>

    <ClientOnly>
      <Swiper
        :modules="[Thumbs, Navigation]"
        :thumbs="isMd ? { swiper: thumbsSwiper } : undefined"
        navigation
        class="product-gallery__main-swiper swiper-nav-bg swiper-nav-image"
      >
        <SwiperSlide
          v-for="(img, i) in images"
          :key="i"
          class="product-gallery__main-slide"
          @click="openLightbox(i)"
        >
          <AppImage
            :src="img"
            :alt="title"
            :lazy="i !== 0"
            :sizes="{ mobile: { w: 600, h: 450 }, desktop: { w: 800, h: 600 } }"
          />
        </SwiperSlide>
      </Swiper>

      <Swiper
        v-if="isMd"
        :modules="[Thumbs]"
        slides-per-view="auto"
        :space-between="8"
        watch-slides-progress
        class="product-gallery__thumbs"
        @swiper="thumbsSwiper = $event"
      >
        <SwiperSlide
          v-for="(img, i) in images"
          :key="i"
          class="product-gallery__thumb-slide"
        >
          <AppImage
            :src="img"
            :alt="`thumb ${i}`"
            img-class="product-gallery__thumb-img"
            :sizes="{ mobile: { w: 72, h: 72 }, desktop: { w: 72, h: 72 } }"
          />
        </SwiperSlide>
      </Swiper>
    </ClientOnly>

    <!-- Fullscreen gallery lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxOpen"
        class="product-lightbox"
      >
        <button
          class="product-lightbox__close"
          type="button"
          @click="closeLightbox"
        >
          <X :size="20" />
        </button>
        <div class="product-lightbox__main">
          <Swiper
            :modules="[Thumbs, Navigation]"
            :initial-slide="lightboxActiveIndex"
            :thumbs="{ swiper: lightboxThumbsSwiper }"
            navigation
            class="product-lightbox__swiper swiper-nav-image"
          >
            <SwiperSlide
              v-for="(img, i) in images"
              :key="i"
            >
              <img
                :src="img"
                :alt="title"
                class="product-lightbox__img"
              />
            </SwiperSlide>
          </Swiper>
        </div>
        <div class="product-lightbox__thumb-strip">
          <Swiper
            :modules="[Thumbs]"
            slides-per-view="auto"
            :space-between="8"
            watch-slides-progress
            class="product-lightbox__thumb-swiper"
            @swiper="lightboxThumbsSwiper = $event"
          >
            <SwiperSlide
              v-for="(img, i) in images"
              :key="i"
              class="product-lightbox__thumb-slide"
            >
              <img
                :src="img"
                class="product-lightbox__thumb-img"
              />
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;

.product-gallery {
  min-width: 0;
  width: 100%;
  position: relative;

  &__oos {
    position: absolute;
    inset: 0;
    z-index: 10;
    border-radius: $radius-xl;
    background: rgb(0 0 0 / 35%);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  &__oos-badge {
    padding: 8px 20px;
    background: $color-white;
    color: $color-gray-700;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;
    letter-spacing: 0.03em;
  }

  &__main-swiper {
    --swiper-theme-color: $color-primary;
    --swiper-navigation-size: 20px;

    width: 100%;
    border-radius: $radius-xl;
    overflow: hidden;
    background: $color-gray-50;
    --ai-ratio: 4/3;
  }

  &__main-slide {
    cursor: zoom-in;
  }

  &__thumbs {
    margin-top: 8px;
  }

  &__thumb-slide {
    width: 72px;
  }

  &__thumb-img {
    object-fit: cover;
    border-radius: $radius-md;
    border: 2px solid $color-gray-200;
    cursor: pointer;
    transition: border-color $transition-fast;
    .swiper-slide-thumb-active & {
      border-color: $color-primary;
    }
  }
}

.product-lightbox {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgb(0 0 0 / 93%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 56px 24px 24px;

  &__close {
    position: absolute;
    top: 12px;
    right: 16px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-full;
    background: rgb(255 255 255 / 12%);
    color: $color-white;
    cursor: pointer;
    transition: background $transition-fast;
    z-index: 1;

    &:hover {
      background: rgb(255 255 255 / 25%);
    }
  }

  &__main {
    flex: 1;
    min-height: 0;
  }

  &__swiper {
    width: 100%;
    height: 100%;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  &__thumb-strip {
    flex-shrink: 0;
  }

  &__thumb-slide {
    width: 72px !important;
    height: 72px;
  }

  &__thumb-img {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: $radius-md;
    border: 2px solid rgb(255 255 255 / 20%);
    cursor: pointer;
    display: block;
    transition: border-color $transition-fast;

    .swiper-slide-thumb-active & {
      border-color: $color-white;
    }
  }
}
</style>

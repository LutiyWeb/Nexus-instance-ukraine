<script setup lang="ts">
import { Download, Eraser } from 'lucide-vue-next'
import { toPng } from 'html-to-image'

useSeoMeta({ title: 'Макет — Honey Store', robots: 'noindex, nofollow' })

const toastStore = useToastStore()

type Device = 'monitor' | 'tablet' | 'phone'
type FrameHandle = { clear: () => void }

const DEVICES: Device[] = ['monitor', 'tablet', 'phone']
// Devices that should just drop out of the composition (not sit there empty)
// when the export doesn't include a screenshot for them. The monitor is the
// anchor shot and always stays, even empty.
const OPTIONAL_DEVICES: Device[] = ['tablet', 'phone']

const stageRef = ref<HTMLElement | null>(null)
const exporting = ref(false)
const hasAnyImage = ref(false)
const imagesByDevice = ref<Record<Device, File | null>>({
  monitor: null,
  tablet: null,
  phone: null,
})
const frameRefs = {} as Record<Device, FrameHandle | null>

function onImage(device: Device, file: File | null) {
  imagesByDevice.value[device] = file
  hasAnyImage.value = Object.values(imagesByDevice.value).some(Boolean)
}

function clearAll() {
  for (const device of DEVICES) frameRefs[device]?.clear()
}

async function exportMockup() {
  if (!stageRef.value || exporting.value) return
  exporting.value = true
  // The --exporting class hides editor-only chrome (the caption/clear-button
  // row) so the PNG is portfolio-ready — wait a tick so Vue actually flushes
  // that class to the DOM before html-to-image reads it.
  await nextTick()
  try {
    const dataUrl = await toPng(stageRef.value, {
      pixelRatio: 2,
      backgroundColor: '#f5f0ea',
      // Skip web-font embedding: it tries to read cssRules from the
      // cross-origin Google Fonts stylesheet, which the browser blocks
      // (CORS) and throws — the frame UI doesn't depend on that font anyway.
      skipFonts: true,
    })
    const link = document.createElement('a')
    link.download = 'mockup.png'
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('[mockup] export failed', err)
    toastStore.add('Не вдалося згенерувати макет', 'error')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="mockup-page container">
    <div class="mockup-page__header">
      <h1 class="mockup-page__title">Макет для портфоліо</h1>
      <p class="mockup-page__subtitle">
        Завантажте скріни для кожного пристрою — і скачайте готовий макет одним зображенням.
      </p>
    </div>

    <div
      ref="stageRef"
      class="mockup-page__stage"
      :class="{ 'mockup-page__stage--exporting': exporting }"
    >
      <MockupDeviceFrame
        v-for="item in DEVICES"
        :key="item"
        :ref="(el) => (frameRefs[item] = el as FrameHandle | null)"
        :device="item"
        :class="[
          `mockup-page__device mockup-page__device--${item}`,
          {
            'mockup-page__device--empty': OPTIONAL_DEVICES.includes(item) && !imagesByDevice[item],
          },
        ]"
        @update:image="(file) => onImage(item, file)"
      />
    </div>

    <div class="mockup-page__actions">
      <button
        v-if="hasAnyImage"
        type="button"
        class="mockup-page__clear-all"
        @click="clearAll"
      >
        <Eraser :size="16" />
        Стерти все
      </button>

      <button
        type="button"
        class="mockup-page__export"
        :disabled="!hasAnyImage || exporting"
        @click="exportMockup"
      >
        <Download :size="18" />
        {{ exporting ? 'Готуємо...' : 'Завантажити макет' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.mockup-page {
  padding-block: $spacing-10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-8;
  text-align: center;

  &__header {
    max-width: 520px;
  }

  &__title {
    font-size: $title-size-m;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 $spacing-2;
  }

  &__subtitle {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin: 0;
  }

  &__stage {
    position: relative;
    width: 100%;
    max-width: 1100px;
    aspect-ratio: 2.2 / 1;
    border-radius: $radius-2xl;
    background: $color-gray-200;
    padding: 0 $spacing-6 $spacing-10;
  }

  &__device {
    position: absolute;
  }

  &__device--monitor {
    top: 0;
    left: 50%;
    z-index: 1;
    width: 46%;
    transform: translateX(-50%);
  }

  &__device--tablet {
    bottom: 12%;
    left: 13%;
    z-index: 2;
    width: 19%;
  }

  &__device--phone {
    bottom: 10%;
    right: 16%;
    z-index: 2;
    width: 15%;
  }

  &__stage--exporting {
    .mockup-frame__caption {
      display: none;
    }

    .mockup-page__device--empty {
      display: none;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-3;
  }

  &__clear-all {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: 12px 20px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: transparent;
    color: $color-gray-500;
    font-weight: $font-weight-semibold;
    font-size: $font-size-sm;
    cursor: pointer;
    transition:
      background $transition-fast,
      border-color $transition-fast;

    &:hover {
      background: $color-gray-50;
      border-color: $color-gray-300;
    }
  }

  &__export {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: 12px 24px;
    border: none;
    border-radius: $radius-md;
    background: $color-primary;
    color: $color-white;
    font-weight: $font-weight-semibold;
    font-size: $font-size-sm;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover:not(:disabled) {
      background: $color-primary-dark;
    }

    &:disabled {
      background: $color-gray-200;
      color: $color-gray-400;
      cursor: not-allowed;
    }
  }
}
</style>

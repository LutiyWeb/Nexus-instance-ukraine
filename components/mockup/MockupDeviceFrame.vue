<script setup lang="ts">
import { Upload, X } from 'lucide-vue-next'

type Device = 'monitor' | 'tablet' | 'phone'

// Bezel PNGs are real device photos (Meta "Design at Meta" device library)
// with a transparent cutout where the screen sits. Aspect ratio and screen
// inset % (in the <style> block below) were measured directly off each
// file's alpha channel (center-scanline scan for the interior transparent
// run), not eyeballed — keep them in sync if the source files are swapped.
const DEVICE_CONFIG: Record<Device, { src: string }> = {
  monitor: { src: '/mockup-devices/monitor.png' },
  tablet: { src: '/mockup-devices/tablet.png' },
  phone: { src: '/mockup-devices/phone.png' },
}

const props = defineProps<{
  device: Device
}>()

const emit = defineEmits<{
  'update:image': [file: File | null]
}>()

const config = DEVICE_CONFIG[props.device]

const fileInput = ref<HTMLInputElement | null>(null)
const imageUrl = ref<string | null>(null)
const caption = ref('')

function triggerUpload() {
  fileInput.value?.click()
}

function applyFile(file: File) {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageUrl.value = URL.createObjectURL(file)
  caption.value = file.name
  emit('update:image', file)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  applyFile(file)
}

// Lets you screenshot something, then click the frame and hit Ctrl+V instead
// of saving the clipboard image to disk first just to re-upload it.
function onPaste(e: ClipboardEvent) {
  const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'))
  const file = item?.getAsFile()
  if (!file) return
  e.preventDefault()
  applyFile(file)
}

function clear() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageUrl.value = null
  caption.value = ''
  if (fileInput.value) fileInput.value.value = ''
  emit('update:image', null)
}

onBeforeUnmount(() => {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
})

defineExpose({ clear })
</script>

<template>
  <div
    class="mockup-frame"
    :class="`mockup-frame--${props.device}`"
  >
    <div
      class="mockup-frame__screen"
      :class="{ 'mockup-frame__screen--empty': !imageUrl }"
      role="button"
      tabindex="0"
      @click="!imageUrl && triggerUpload()"
      @keydown.enter="!imageUrl && triggerUpload()"
      @paste="onPaste"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        class="mockup-frame__img"
        alt=""
      />
      <div
        v-else
        class="mockup-frame__placeholder"
      >
        <Upload :size="20" />
        <span>Завантажити скрін</span>
        <span class="mockup-frame__hint">або Ctrl+V, коли рамка обрана</span>
      </div>
    </div>

    <img
      :src="config.src"
      class="mockup-frame__bezel"
      alt=""
    />

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="mockup-frame__input"
      hidden
      @change="onFileChange"
    />

    <div
      v-if="imageUrl"
      class="mockup-frame__caption"
    >
      <input
        v-model="caption"
        class="mockup-frame__caption-input"
        placeholder="Назва скріну"
      />
      <button
        type="button"
        class="mockup-frame__clear"
        title="Прибрати скрін"
        @click="clear"
      >
        <X :size="14" />
      </button>
    </div>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;

// The frame's own box is exactly the device photo's box (aspect-ratio
// driven) — the label and caption are absolutely positioned just outside
// it (above / below) so they take no layout space and don't shift where
// the photo sits. That matters here: the parent page positions each frame
// by this box (top/left/width) to build the overlapping composition, so
// the box must equal the photo, not the photo-plus-chrome.
.mockup-frame {
  position: relative;
  width: 100%;
  filter: drop-shadow(0 16px 24px rgba($color-black, 0.18));

  &--monitor {
    aspect-ratio: 2960 / 2640;
  }

  &--tablet {
    aspect-ratio: 1836 / 2708;
  }

  &--phone {
    aspect-ratio: 1050 / 1934;
  }

  // ── Screen (the uploaded screenshot, cropped to the photo's screen cutout) ─
  // The bezel PNG (below) layers on top, so its own rounded corners / notch /
  // home button mask this layer's square edges — no border-radius needed here.
  &__screen {
    position: absolute;
    overflow: hidden;
    z-index: 1;
    background: $color-gray-100;

    .mockup-frame--monitor & {
      inset: 22.5% 6.76% 22.73% 6.76%;
    }

    .mockup-frame--tablet & {
      inset: 12.19% 7.8% 11.9% 7.17%;
    }

    .mockup-frame--phone & {
      inset: 15.51% 13.38% 15.56% 13.29%;
    }
  }

  &__screen--empty {
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-gray-200;
    }
  }

  // Focus = "armed for paste" — the frame you just clicked is the one
  // Ctrl+V lands in, so make that state visible.
  &__screen:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: -2px;
  }

  &__hint {
    font-size: 10px;
    color: $color-gray-300;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-2;
    color: $color-gray-400;
    font-size: $font-size-xs;
    text-align: center;
    padding: $spacing-2;
  }

  &__bezel {
    position: absolute;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }

  &__input {
    display: none;
  }

  // ── Caption row ────────────────────────────────────────────────────────────
  &__caption {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: $spacing-2;
    display: flex;
    align-items: center;
    gap: $spacing-1;
    white-space: nowrap;
  }

  &__caption-input {
    width: 140px;
    padding: 3px 8px;
    font-size: $font-size-xs;
    color: $color-gray-600;
    text-align: center;
    border: 1px solid transparent;
    border-radius: $radius-sm;
    background: transparent;
    transition: border-color $transition-fast;

    &:hover,
    &:focus {
      border-color: $color-gray-200;
      outline: none;
    }
  }

  &__clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    border: none;
    border-radius: $radius-full;
    background: $color-gray-100;
    color: $color-gray-500;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-danger;
      color: $color-white;
    }
  }
}
</style>

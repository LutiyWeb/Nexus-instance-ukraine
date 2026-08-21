<script setup lang="ts">
// Silent for the first few seconds (normal warm-backend latency), then
// explains itself — only shown at all while a parent's `loading`/`pending`
// state keeps this mounted, so no props/state needed beyond a local timer.
const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  timer = setTimeout(() => {
    visible.value = true
  }, 4000)
})

onBeforeUnmount(() => {
  clearTimeout(timer)
})

// Matches every other full-screen overlay in the app (header auth modal,
// sidebar, search) — see stores/ui.ts's useScrollLock(overlayVisible).
useScrollLock(visible)
</script>

<template>
  <AppModal
    :open="visible"
    :closable="false"
    @update:open="visible = false"
  >
    <div class="cold-start-modal">
      <AppHexPattern
        variant="cluster"
        class="cold-start-modal__hex"
      />
      <p class="cold-start-modal__title">Please wait</p>
      <p class="cold-start-modal__text">
        First load can take up to a minute — this is a one-time "wake up" of our free server. Thanks
        for your patience!
      </p>
    </div>
  </AppModal>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;

.cold-start-modal {
  // min-height is load-bearing: the hex is position: absolute, so it's out
  // of flow and contributes nothing to this box's height on its own.
  // Clipping happens up on .app-modal (not here) — that's the element whose
  // rounded corners the hex should bleed off of; a boundary drawn here would
  // sit 32px inside the real card edge (.app-modal's own padding).
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.cold-start-modal__hex {
  position: absolute;
  z-index: -1;
  // Offsets are relative to this wrapper, which sits 32px inside the real
  // card edge (.app-modal's own padding). To land ~30% of the hex's 211px
  // width past that real edge: 32px to clear the padding + 211*0.3≈63px to
  // hang off it = -95px.
  top: -95px;
  right: -95px;
  width: 211px;
  opacity: 0.45;
  pointer-events: none;
}

.cold-start-modal__title {
  margin: 0 0 $spacing-2;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-heading;
}

.cold-start-modal__text {
  margin: 0;
  font-size: $font-size-sm;
  line-height: $line-height-relaxed;
  color: $color-gray-600;
}
</style>

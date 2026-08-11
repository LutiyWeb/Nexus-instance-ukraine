<script setup lang="ts">
import { ArrowUp, Bug } from 'lucide-vue-next'

const SCROLL_TOP_THRESHOLD = 480

const showScrollTop = ref(false)
const reportModalOpen = ref(false)

function onScroll() {
  showScrollTop.value = window.scrollY > SCROLL_TOP_THRESHOLD
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="floating-actions">
    <Transition name="floating-actions__fade">
      <button
        v-if="showScrollTop"
        class="floating-actions__btn floating-actions__btn--scroll-top"
        type="button"
        aria-label="Нагору"
        @click="scrollToTop"
      >
        <ArrowUp
          :size="18"
          class="floating-actions__btn-icon"
        />
      </button>
    </Transition>

    <button
      class="floating-actions__btn floating-actions__btn--report"
      type="button"
      aria-label="Повідомити про проблему"
      @click="reportModalOpen = true"
    >
      <Bug
        :size="18"
        class="floating-actions__btn-icon"
      />
      <span class="floating-actions__btn-label">Повідомити про проблему</span>
    </button>

    <ReportBugModal v-model:open="reportModalOpen" />
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.floating-actions {
  position: fixed;
  z-index: $z-dropdown;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;

  // Icon-only circle at rest for every button — padding/gap only show up on
  // --report's hover, once there's actually a label to make room for.
  // Without this, a zero-width label still claims its flex gap, so the
  // "circle" was really a 54×44 oval even with no text visible.
  &__btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    background: $color-white;
    color: $color-gray-600;
    box-shadow: $shadow-md;
    cursor: pointer;
    transition:
      color $transition-fast,
      border-color $transition-fast,
      box-shadow $transition-fast,
      width $transition-base,
      gap $transition-base,
      padding $transition-base;

    &:hover {
      color: $color-primary;
      border-color: $color-primary-light;
      box-shadow: $shadow-lg;
    }
  }

  &__btn--report:hover {
    width: auto;
    gap: 8px;
    padding: 0 13px;
  }

  &__btn-icon {
    flex-shrink: 0;
  }

  // Icon-only at rest; the label is an inline row so it never needs its own
  // wrapping/truncation rules — it just grows/shrinks the button's own width.
  &__btn-label {
    max-width: 0;
    overflow: hidden;
    white-space: nowrap;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    transition: max-width $transition-base;
  }

  &__btn--report:hover &__btn-label {
    max-width: 220px;
  }
}

.floating-actions__fade-enter-active,
.floating-actions__fade-leave-active {
  transition:
    opacity $transition-fast,
    transform $transition-fast;
}
.floating-actions__fade-enter-from,
.floating-actions__fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

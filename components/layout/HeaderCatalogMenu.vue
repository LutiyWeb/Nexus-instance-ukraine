<script setup lang="ts">
import { ChevronRight, Tag } from 'lucide-vue-next'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const categoriesStore = useCategoriesStore()
const activeId = ref<number | null>(null)

const activeCat = computed(
  () => categoriesStore.categories.find((c) => c.id === activeId.value) ?? null,
)

function isNew(cat: { slug?: string; name?: string }) {
  return cat.slug?.includes('new') || cat.name?.toLowerCase().includes('новин')
}

// Neither open nor close applies the instant the mouse enters/leaves — each is
// scheduled a short beat later, and the other event cancels whichever timer is
// still pending. That's what survives the cursor briefly leaving the shared
// hover area while crossing from a category to its subcategory column.
let openTimer: ReturnType<typeof setTimeout> | null = null
let closeTimer: ReturnType<typeof setTimeout> | null = null

function scheduleOpen(id: number) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  if (openTimer) clearTimeout(openTimer)
  openTimer = setTimeout(() => {
    activeId.value = id
    openTimer = null
  }, 300)
}

function scheduleClose() {
  if (openTimer) {
    clearTimeout(openTimer)
    openTimer = null
  }
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    activeId.value = null
    closeTimer = null
  }, 300)
}

// The cursor crossing over an earlier item on its way to the subcategory
// panel can leave that item's openTimer ticking even after arrival — this
// cancels it (and any pending close) the moment the panel is actually reached.
function keepOpen() {
  if (openTimer) {
    clearTimeout(openTimer)
    openTimer = null
  }
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

onBeforeUnmount(() => {
  if (openTimer) clearTimeout(openTimer)
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<template>
  <Transition name="catalog-menu">
    <div
      v-if="open"
      class="catalog-menu container"
      @click.self="$emit('close')"
    >
      <div
        class="catalog-menu__inner"
        @mouseleave="scheduleClose"
      >
        <!-- Лівий стовпець: список категорій -->
        <div class="catalog-menu__cats">
          <NuxtLink
            v-for="cat in categoriesStore.categories"
            :key="cat.id"
            :to="`/catalog/${cat.slug}`"
            :class="[
              'catalog-menu__parent',
              { 'catalog-menu__parent--active': activeId === cat.id },
              { 'catalog-menu__parent--new': isNew(cat) },
            ]"
            @mouseenter="scheduleOpen(cat.id)"
            @click="$emit('close')"
          >
            {{ cat.name }}
            <span
              v-if="isNew(cat)"
              class="catalog-menu__new-badge"
              >NEW</span
            >
            <ChevronRight
              v-if="cat.subcategories?.length"
              :size="14"
              class="catalog-menu__group-icon"
            />
          </NuxtLink>

          <div class="catalog-menu__divider" />

          <NuxtLink
            to="/promo"
            class="catalog-menu__parent"
            @mouseenter="scheduleClose"
            @click="$emit('close')"
          >
            <Tag :size="14" />
            Акції
          </NuxtLink>
        </div>

        <!-- Правий стовпець: підкатегорії активної категорії -->
        <Transition name="catalog-subs">
          <div
            v-if="activeCat?.subcategories?.length"
            class="catalog-menu__subs"
            @mouseenter="keepOpen"
          >
            <NuxtLink
              v-for="sub in activeCat.subcategories"
              :key="sub.id"
              :to="`/catalog/${sub.slug}`"
              class="catalog-menu__sub"
              @click="$emit('close')"
              >{{ sub.name }}</NuxtLink
            >
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.catalog-menu {
  position: absolute;
  top: 100%;
  inset-inline: 0;
  z-index: $z-dropdown;
  background: $color-white;
  border-top: 1px solid $color-gray-100;
  box-shadow: $shadow-lg;

  &__inner {
    display: flex;
    padding-block: 8px;
    min-height: 120px;
    max-height: calc(100vh - 64px);
    overflow-y: auto;
  }

  &__cats {
    width: 100%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;

    @include mixins.respond-to(tablet) {
      width: 220px;
    }
  }

  &__divider {
    height: 1px;
    background: $color-gray-100;
    margin: 6px 16px;
  }

  &__parent {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 16px;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    border-radius: $radius-md;
    cursor: pointer;
    transition:
      color $transition-fast,
      background $transition-fast;

    &:hover,
    &--active {
      color: $color-primary;
      background: $color-gray-50;
    }

    &--new {
      color: $color-primary;
    }
  }

  &__new-badge {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    padding: 1px 5px;
    border-radius: $radius-sm;
    background: $color-primary;
    color: $color-white;
    font-size: 9px;
    font-weight: $font-weight-bold;
    letter-spacing: 0.04em;
    line-height: 1.6;
  }

  // Hints that hovering opens a nested subcategory panel — otherwise nothing
  // on the item itself signals it behaves differently from a plain link.
  &__group-icon {
    margin-left: auto;
    flex-shrink: 0;
    color: $color-gray-400;
    transition: color $transition-fast;
  }

  &__parent:hover &__group-icon,
  &__parent--active &__group-icon {
    color: $color-primary;
  }

  &__subs {
    display: none;

    @include mixins.respond-to(tablet) {
      display: flex;
      flex: 1;
      flex-direction: column;
      max-width: 220px;
      padding: 0 16px;
      border-left: 1px solid $color-gray-100;
      overflow-y: auto;
    }
  }

  &__sub {
    padding: 9px 12px;
    font-size: $font-size-sm;
    color: $color-gray-500;
    border-radius: $radius-md;
    transition:
      color $transition-fast,
      background $transition-fast;

    &:hover {
      color: $color-primary;
      background: $color-gray-50;
    }
  }
}

.catalog-menu-enter-active,
.catalog-menu-leave-active {
  transition:
    opacity $transition-fast,
    transform $transition-fast;
}
.catalog-menu-enter-from,
.catalog-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.catalog-subs-enter-active,
.catalog-subs-leave-active {
  transition: opacity $transition-fast;
}
.catalog-subs-enter-from,
.catalog-subs-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { X, Tag } from 'lucide-vue-next'

defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const categoriesStore = useCategoriesStore()

function isNew(cat: { slug?: string; name?: string }) {
  return cat.slug?.includes('new') || cat.name?.toLowerCase().includes('новин')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="catalog-sidebar">
      <div
        v-if="open"
        class="catalog-sidebar"
      >
        <div class="catalog-sidebar__header">
          <span class="catalog-sidebar__title">Каталог</span>
          <button
            class="catalog-sidebar__close"
            type="button"
            @click="$emit('close')"
          >
            <X :size="20" />
          </button>
        </div>

        <div class="catalog-sidebar__body">
          <NuxtLink
            v-for="cat in categoriesStore.categories"
            :key="cat.id"
            :to="`/catalog/${cat.slug}`"
            class="catalog-sidebar__link"
            @click="$emit('close')"
          >
            {{ cat.name }}
            <span
              v-if="isNew(cat)"
              class="catalog-sidebar__new-badge"
              >NEW</span
            >
          </NuxtLink>

          <div class="catalog-sidebar__divider" />

          <NuxtLink
            to="/promo"
            class="catalog-sidebar__link"
            @click="$emit('close')"
          >
            <Tag :size="14" />
            Акції
          </NuxtLink>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="open"
        class="catalog-sidebar__backdrop"
        @click="$emit('close')"
      />
    </Transition>
  </Teleport>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.catalog-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100dvh;
  background: $color-white;
  z-index: $z-modal;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-xl;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid $color-gray-100;
    height: 64px;
    flex-shrink: 0;
  }

  &__title {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-heading;
  }

  &__close {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-md;
    background: none;
    border: none;
    color: $color-gray-500;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-gray-100;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 20px;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    text-decoration: none;
    transition:
      background $transition-fast,
      color $transition-fast;

    &:hover {
      background: $color-gray-50;
      color: $color-primary;
    }

    &.router-link-active {
      color: $color-primary-dark;
    }
  }

  &__new-badge {
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

  &__divider {
    height: 1px;
    background: $color-gray-100;
    margin: 6px 20px;
  }

  &__backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 40%);
    z-index: calc(#{$z-modal} - 1);
  }
}

.catalog-sidebar-enter-active,
.catalog-sidebar-leave-active {
  transition: transform $transition-base;
}

.catalog-sidebar-enter-from,
.catalog-sidebar-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

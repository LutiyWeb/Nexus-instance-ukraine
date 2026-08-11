<script setup lang="ts">
defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const NuxtLink = resolveComponent('NuxtLink')

const categoriesStore = useCategoriesStore()
const activeId = ref<number | null>(null)

const activeCat = computed(
  () => categoriesStore.categories.find((c) => c.id === activeId.value) ?? null,
)

function isNew(cat: { slug?: string; name?: string }) {
  return cat.slug?.includes('new') || cat.name?.toLowerCase().includes('новин')
}
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
        @mouseleave="activeId = null"
      >
        <!-- Лівий стовпець: список категорій -->
        <div class="catalog-menu__cats">
          <component
            :is="cat.subcategories?.length ? 'div' : NuxtLink"
            v-for="cat in categoriesStore.categories"
            :key="cat.id"
            v-bind="cat.subcategories?.length ? {} : { to: `/catalog/${cat.slug}` }"
            :class="[
              'catalog-menu__parent',
              { 'catalog-menu__parent--active': activeId === cat.id },
              { 'catalog-menu__parent--new': isNew(cat) },
              { 'catalog-menu__parent--group': cat.subcategories?.length },
            ]"
            @mouseenter="activeId = cat.id"
            @click="!cat.subcategories?.length && $emit('close')"
          >
            {{ cat.name }}
            <span
              v-if="isNew(cat)"
              class="catalog-menu__new-badge"
              >NEW</span
            >
          </component>
        </div>

        <!-- Правий стовпець: підкатегорії активної категорії -->
        <Transition name="catalog-subs">
          <div
            v-if="activeCat?.subcategories?.length"
            class="catalog-menu__subs"
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

    // Has real subcategories, so it's a hover trigger (no href of its own)
    // rather than a link — its own product listing is empty by design.
    &--group {
      cursor: default;
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

<script setup lang="ts">
interface Props {
  image: string
  label: string
  description?: string | null
  linkLabel?: string | null
  gradient: string
  to?: string
  shape?: 'vertical' | 'horizontal' | 'square'
}

withDefaults(defineProps<Props>(), {
  to: '/',
  description: null,
  linkLabel: null,
  shape: 'square',
})

const { isXl } = useBreakpoints()
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const showImage = computed(() => mounted.value && isXl.value)
</script>

<template>
  <NuxtLink
    :to="to"
    :class="['promo-tile', `promo-tile--${shape}`]"
  >
    <AppImage
      v-if="showImage"
      :src="image"
      :alt="label"
      img-class="promo-tile__img"
      :sizes="{ desktop: { w: 300, h: 300 } }"
    />
    <div class="promo-tile__content">
      <p
        v-if="description"
        class="promo-tile__desc"
      >
        {{ description }}
      </p>
      <h3 class="promo-tile__title">{{ label }}</h3>
      <span
        v-if="linkLabel"
        class="promo-tile__link"
        >{{ linkLabel }}</span
      >
    </div>
  </NuxtLink>
</template>

<style lang="scss" scoped>
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;

.promo-tile {
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  border-radius: $radius-md;
  overflow: hidden;
  flex: 0 0 300px;
  height: 170px;
  text-decoration: none;
  color: $color-gray-900;
  cursor: pointer;
  box-shadow: $shadow-lg;
  transition: transform $transition-base;
  padding: 8px 12px;

  &::before {
    position: absolute;
    z-index: -1;
    inset: 0;
    background-image: url('/public/bg-image/tech-bg.jpg');
    background-size: cover;
    background-repeat: no-repeat;
    content: '';
  }

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    background-color: var(--promo-title-bg);
    opacity: 0.1;
  }

  @include mixins.respond-to(notebook) {
    padding: 0 16px 16px;
    height: 230px;
  }

  &:hover {
    transform: translateY(-2px);
  }

  &--vertical {
    --promo-title-bg: #{$color-gray-700};

    align-items: center;
    justify-content: center;
    grid-row: span 2;
    height: 100%;

    .app-image {
      max-width: 250px;
      display: block;
    }
  }

  &--horizontal {
    --promo-title-bg: #{$color-gray-400};
    flex-direction: row-reverse;
    justify-content: space-between;
    grid-column: span 2;

    .app-image {
      max-width: 200px;
      display: block;
    }

    .promo-tile__content {
      align-items: flex-start;
    }

    .promo-tile__desc,
    .promo-tile__title,
    .promo-tile__link {
      text-align: left;
    }
  }

  &--square {
    --promo-title-bg: #{$color-gray-100};

    align-items: center;
    justify-content: center;

    .app-image {
      --ai-width: 50%;
      display: block;
    }

    :deep(.promo-tile__img) {
      margin: 0 auto 8px;
    }
  }

  &:hover {
    :deep(.promo-tile__img) {
      transform: scale(1.05);
    }
  }

  :deep(.promo-tile__img) {
    mix-blend-mode: multiply;
    transition: transform 0.5s ease;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1 1 50%;
    min-width: 0;

    @include mixins.respond-to(notebook) {
      flex: 0 1 auto;
    }
  }

  &__desc {
    margin: 0;
    text-align: center;
  }

  &__title {
    text-align: center;
    color: $color-heading;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0;
    line-height: 1.2;
    text-shadow: 0 1px 12px rgb(255 255 255 / 60%);

    @include mixins.respond-to(notebook) {
      font-size: $font-size-xl;
    }
  }

  &__link {
    margin: 0;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #0072ff;

    @include mixins.respond-to(notebook) {
      font-size: 10px;
    }
  }
}
</style>

<script setup lang="ts">
import type { Product } from '~/types/product'

const MOCK_PRODUCTS: Product[] = Array.from({ length: 6 }, (_, i) => ({
  id: 8000 + i,
  title: `Товар для слайдера ${i + 1}`,
  slug: `slider-product-${i + 1}`,
  description: 'Опис товару в слайдері',
  sku: `SKU-${i + 1}`,
  category: 'Електроніка',
  categoryId: 1,
  categorySlug: 'electronics',
  brand: 'Brand',
  brandId: 1,
  price: 1000 + i * 500,
  compareAtPrice: i % 2 === 0 ? 1500 + i * 500 : null,
  discountPercentage: i % 2 === 0 ? 20 : null,
  rating: 4 + (i % 2) * 0.5,
  stock: 5,
  inStock: true,
  status: 'active',
  thumbnail: `https://picsum.photos/seed/nav${i}/400/400`,
  images: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

const RIBBON_CODE = `<!-- CategoryRibbon читає дані з categoriesStore автоматично -->
<CategoryRibbon />`

const SLIDER_CODE = `<AppSlider
  title="Рекомендуємо"
  :slides="products"
  :space-between="16"
  :breakpoints="{
    0:    { slidesPerView: 2 },
    640:  { slidesPerView: 3 },
    1024: { slidesPerView: 4 },
    1280: { slidesPerView: 5 },
  }"
>
  <template #default="{ slide }">
    <TheProductCard :product="slide" />
  </template>
</AppSlider>`

const ARROW_CODE = `<!-- AppArrow — універсальна стрілка для всіх слайдерів -->
<AppArrow direction="left" @click="swiper.slidePrev()" />
<AppArrow direction="right" @click="swiper.slideNext()" />

<!-- Стани -->
<AppArrow direction="left" :disabled="isBeginning" />
<AppArrow direction="right" :disabled="isEnd" />`
</script>

<template>
  <div class="uikit-nav">
    <UiKitSection
      title="CategoryRibbon"
      description="Горизонтальна стрічка категорій з іконками та стрілками прокрутки"
    >
      <template #preview>
        <div style="width: 100%; overflow: hidden">
          <CategoryRibbon />
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="RIBBON_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection
      title="AppSlider"
      description="Swiper.js слайдер з товарами, адаптивними брейкпоінтами та стрілками"
    >
      <template #preview>
        <div style="width: 100%; overflow: hidden">
          <AppSlider
            title="Приклад слайдера"
            :slides="MOCK_PRODUCTS"
            :space-between="16"
            :breakpoints="{
              0: { slidesPerView: 2 },
              640: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
            }"
          >
            <template #default="slotProps">
              <TheProductCard
                v-if="slotProps?.slide"
                :product="slotProps.slide as any"
              />
            </template>
          </AppSlider>
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="SLIDER_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection
      title="AppArrow"
      description="Універсальний компонент стрілок — використовується у всіх слайдерах"
    >
      <template #preview>
        <div style="display: flex; gap: 12px; align-items: center">
          <AppArrow direction="left" />
          <AppArrow direction="right" />
          <span style="color: #9ca3af; font-size: 13px; margin-left: 8px">активні</span>
        </div>
        <div style="display: flex; gap: 12px; align-items: center">
          <AppArrow
            direction="left"
            :disabled="true"
          />
          <AppArrow
            direction="right"
            :disabled="true"
          />
          <span style="color: #9ca3af; font-size: 13px; margin-left: 8px">disabled</span>
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="ARROW_CODE" />
      </template>
      <template #props>
        <UiKitPropsTable
          :rows="[
            {
              name: 'direction',
              type: `'left' | 'right'`,
              required: true,
              description: 'Напрямок стрілки',
            },
            {
              name: 'disabled',
              type: 'boolean',
              default: 'false',
              description: 'Заблокувати стрілку',
            },
          ]"
        />
      </template>
    </UiKitSection>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.uikit-nav {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
</style>

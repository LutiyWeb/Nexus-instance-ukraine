<script setup lang="ts">
import type { Product } from '~/types/product'

const MOCK_PRODUCT: Product = {
  id: 9999,
  title: 'Бездротові навушники Pro X',
  slug: 'wireless-headphones-pro-x',
  description: 'Преміальні навушники з активним шумозаглушенням та 30 годинами роботи',
  sku: 'HP-001',
  category: 'Електроніка',
  categoryId: 1,
  categorySlug: 'electronics',
  brand: 'SoundMax',
  brandId: 1,
  price: 4999,
  compareAtPrice: 6499,
  discountPercentage: 23,
  rating: 4.5,
  stock: 10,
  inStock: true,
  status: 'active',
  thumbnail: 'https://picsum.photos/seed/kit-product/400/400',
  images: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const VERTICAL_CODE = `<TheProductCard :product="product" />`

const HORIZONTAL_CODE = `<TheCardHorizontal
  title="Заголовок картки"
  description="Опис картки з деталями"
  badge="Новинка"
  image="/path/to/image.jpg"
  :image-right="false"
/>`

const SHADOW_CODE = `// _variables.scss
$shadow-card:       -6px 0 16px -6px rgb(0 0 0 / 8%),
                     6px 0 16px -6px rgb(0 0 0 / 8%),
                     0 8px 20px -4px rgb(0 0 0 / 10%);

$shadow-card-hover: -6px 0 24px -6px rgb(0 0 0 / 12%),
                     6px 0 24px -6px rgb(0 0 0 / 12%),
                     0 14px 28px -4px rgb(0 0 0 / 16%);

// Використання
.my-card {
  box-shadow: $shadow-card;
  &:hover { box-shadow: $shadow-card-hover; }
}`
</script>

<template>
  <div class="uikit-cards">
    <UiKitSection
      title="TheProductCard (вертикальна)"
      description="Картка товару в сітці каталогу та слайдерах"
    >
      <template #preview>
        <div style="display: grid; grid-template-columns: repeat(3, 240px); gap: 16px">
          <TheProductCard :product="MOCK_PRODUCT" />
          <TheProductCard
            :product="{
              ...MOCK_PRODUCT,
              id: 9998,
              compareAtPrice: null,
              discountPercentage: null,
              rating: null,
              thumbnail: null,
            }"
          />
          <TheProductCard
            :product="{
              ...MOCK_PRODUCT,
              id: 9997,
              title: 'Дуже довга назва товару, яка обрізається',
              thumbnail: 'https://picsum.photos/seed/kit2/400/400',
            }"
          />
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="VERTICAL_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection
      title="TheCardHorizontal (горизонтальна)"
      description="Картка для банерів та промо-блоків"
    >
      <template #preview>
        <div style="width: 100%; display: flex; flex-direction: column; gap: 16px">
          <TheCardHorizontal
            title="Літній розпродаж"
            description="Знижки до 50% на електроніку, гаджети та аксесуари. Встигни купити!"
            badge="Акція"
            image="https://picsum.photos/seed/banner1/560/320"
          />
          <TheCardHorizontal
            title="Нова колекція"
            description="Ексклюзивні товари щойно надійшли на склад"
            badge="Новинка"
            image="https://picsum.photos/seed/banner2/560/320"
            :image-right="true"
          />
          <TheCardHorizontal :loading="true" />
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="HORIZONTAL_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection
      title="Тіні карток"
      description="Універсальні SCSS-змінні для всіх карток проєкту"
    >
      <template #preview>
        <div style="display: flex; gap: 24px">
          <div class="uikit-cards__shadow-demo">
            <span>$shadow-card</span>
          </div>
          <div class="uikit-cards__shadow-demo uikit-cards__shadow-demo--hover">
            <span>$shadow-card-hover</span>
          </div>
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock
          :code="SHADOW_CODE"
          language="scss"
        />
      </template>
    </UiKitSection>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.uikit-cards {
  display: flex;
  flex-direction: column;
  gap: 40px;

  &__shadow-demo {
    width: 160px;
    height: 96px;
    background: $color-white;
    border-radius: $radius-xl;
    box-shadow: $shadow-card;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-500;

    &--hover {
      box-shadow: $shadow-card-hover;
    }
  }
}
</style>

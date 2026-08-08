<script setup lang="ts">
const uiStore = useUiStore()

const AUTH_CODE = `<!-- Відкрити з будь-якого місця -->
<AppButton @click="uiStore.authModalOpen = true">Увійти</AppButton>

<!-- Компонент підключено в TheHeader -->
<HeaderAuthModal v-model:open="uiStore.authModalOpen" />`

const FORGOT_CODE = `<!-- Відкрити з будь-якого місця -->
<AppButton @click="uiStore.forgotPasswordModalOpen = true">Забули пароль?</AppButton>

<!-- Компонент підключено в TheHeader -->
<HeaderForgotPasswordModal v-model:open="uiStore.forgotPasswordModalOpen" />`

const SEARCH_CODE = `<!-- Відкрити пошук -->
<AppButton @click="uiStore.searchOpen = true">Пошук</AppButton>

<!-- Компонент підключено в TheHeader -->
<HeaderSearchOverlay :open="uiStore.searchOpen" @close="uiStore.searchOpen = false" />`

const CATALOG_CODE = `<!-- Відкрити меню каталогу -->
<AppButton @click="uiStore.catalogOpen = true">Каталог</AppButton>

<!-- Компонент підключено в TheHeader -->
<HeaderCatalogMenu :open="uiStore.catalogOpen" @close="uiStore.catalogOpen = false" />`

const MODAL_CODE = `<!-- Базовий компонент, перевикористовується в усіх модалках -->
<AppModal :open="myModalOpen" @update:open="myModalOpen = $event">
  <!-- Контент модалки -->
  <h2>Заголовок</h2>
  <form class="app-modal__form">
    <!-- поля -->
    <p class="app-modal__error">Помилка</p>
    <AppButton type="submit">Зберегти</AppButton>
    <button class="app-modal__secondary-btn">Вторинна дія</button>
  </form>
</AppModal>`
</script>

<template>
  <div class="uikit-modals">
    <UiKitSection
      title="AppModal"
      description="Базовий компонент модалки: оверлей, контейнер, хрестик, анімація. Усі інші модалки будуються на його основі."
    >
      <template #preview>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start">
          <span style="font-size: 13px; color: #9ca3af"
            >Базовий компонент — відкрий Auth Modal або Forgot Password нижче</span
          >
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="MODAL_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection
      title="Auth Modal"
      description="Модалка входу/реєстрації. Керується через uiStore.authModalOpen"
    >
      <template #preview>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start">
          <AppButton
            variant="primary"
            @click="uiStore.authModalOpen = true"
          >
            Відкрити Auth Modal
          </AppButton>
          <span style="font-size: 13px; color: #9ca3af">uiStore.authModalOpen = true</span>
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="AUTH_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection
      title="Forgot Password Modal"
      description="Модалка відновлення пароля. Керується через uiStore.forgotPasswordModalOpen"
    >
      <template #preview>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start">
          <AppButton
            variant="outline"
            @click="uiStore.forgotPasswordModalOpen = true"
          >
            Відкрити Forgot Password Modal
          </AppButton>
          <span style="font-size: 13px; color: #9ca3af"
            >uiStore.forgotPasswordModalOpen = true</span
          >
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="FORGOT_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection
      title="Search Overlay"
      description="Пошуковий оверлей з історією, категоріями та трендовими товарами"
    >
      <template #preview>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start">
          <AppButton
            variant="outline"
            @click="uiStore.searchOpen = true"
          >
            Відкрити Search Overlay
          </AppButton>
          <span style="font-size: 13px; color: #9ca3af">uiStore.searchOpen = true</span>
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="SEARCH_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection
      title="Catalog Menu"
      description="Випадаюче меню каталогу з категоріями та підкатегоріями"
    >
      <template #preview>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start">
          <AppButton
            variant="outline"
            @click="uiStore.catalogOpen = true"
          >
            Відкрити Catalog Menu
          </AppButton>
          <span style="font-size: 13px; color: #9ca3af">uiStore.catalogOpen = true</span>
        </div>
      </template>
      <template #code>
        <UiKitCodeBlock :code="CATALOG_CODE" />
      </template>
    </UiKitSection>

    <UiKitSection
      title="UiStore API"
      description="Централізоване керування всіма оверлеями"
    >
      <UiKitPropsTable
        :rows="[
          {
            name: 'authModalOpen',
            type: 'boolean',
            default: 'false',
            description: 'Auth Modal відкрита',
          },
          {
            name: 'forgotPasswordModalOpen',
            type: 'boolean',
            default: 'false',
            description: 'Forgot Password Modal відкрита',
          },
          {
            name: 'catalogOpen',
            type: 'boolean',
            default: 'false',
            description: 'Каталог відкритий',
          },
          { name: 'searchOpen', type: 'boolean', default: 'false', description: 'Пошук відкритий' },
          {
            name: 'sidebarOpen',
            type: 'boolean',
            default: 'false',
            description: 'Мобільний сайдбар відкритий',
          },
          { name: 'closeAll()', type: 'function', description: 'Закрити всі оверлеї' },
        ]"
      />
    </UiKitSection>
  </div>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as mixins;
.uikit-modals {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
</style>

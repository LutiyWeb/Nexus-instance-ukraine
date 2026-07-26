<script setup lang="ts">
import 'ant-design-vue/dist/reset.css'

const authStore = useAuthStore()
const route = useRoute()

const NAV_ITEMS = [
  { key: '/admin/products', label: 'Товари' },
  { key: '/admin/banners/hero', label: 'Головний банер' },
  { key: '/admin/banners/special_1', label: 'Спец-банер 1' },
  { key: '/admin/banners/special_2', label: 'Спец-банер 2' },
  { key: '/admin/banners/promo', label: 'Промо-плитки' },
  { key: '/admin/banners/hot', label: 'Гарячі позиції' },
]

const selectedKeys = computed(() => [route.path])

function handleLogout() {
  authStore.logout()
  navigateTo('/admin/login')
}
</script>

<template>
  <a-layout class="admin-layout">
    <a-layout-sider class="admin-layout__sider" theme="light" width="240">
      <div class="admin-layout__logo">Адмінка</div>
      <a-menu :selected-keys="selectedKeys" mode="inline">
        <a-menu-item v-for="item in NAV_ITEMS" :key="item.key">
          <NuxtLink :to="item.key">{{ item.label }}</NuxtLink>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="admin-layout__header">
        <span class="admin-layout__user">{{ authStore.user?.email }}</span>
        <a-button @click="handleLogout">Вийти</a-button>
      </a-layout-header>
      <a-layout-content class="admin-layout__content">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style lang="scss">
.admin-layout {
  min-height: 100vh;

  &__logo {
    padding: 16px;
    font-weight: 600;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    padding-inline: 24px;
  }

  &__content {
    padding: 24px;
  }
}
</style>

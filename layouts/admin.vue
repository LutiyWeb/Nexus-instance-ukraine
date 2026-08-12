<script setup lang="ts">
import 'ant-design-vue/dist/reset.css'

const authStore = useAuthStore()
const route = useRoute()

const NAV_ITEMS = [
  { key: '/admin/products', label: 'Товари' },
  { key: '/admin/vendors', label: 'Вендори' },
  { key: '/admin/banners/hero', label: 'Головний банер' },
  { key: '/admin/banners/special_1', label: 'Спец-банер 1' },
  { key: '/admin/banners/special_2', label: 'Спец-банер 2' },
  { key: '/admin/banners/promo', label: 'Промо-плитки' },
  { key: '/admin/banners/hot', label: 'Гарячі позиції' },
  { key: '/admin/bug-reports', label: 'Баг-репорти' },
]

const selectedKeys = computed(() => [route.path])

function handleLogout() {
  authStore.logout()
  navigateTo('/admin/login')
}

// Reskins Ant Design Vue to the storefront's own palette (assets/styles/_variables.scss)
// instead of its default blue — must be kept in sync with $color-primary /
// $color-primary-dark / $color-white / $color-gray-50/900 by hand, since Ant's
// theme tokens are plain JS and can't @use the SCSS file directly.
const ADMIN_THEME = {
  token: {
    colorPrimary: 'rgb(217 143 43)',
    colorPrimaryHover: 'rgb(152 100 30)',
  },
  components: {
    Layout: {
      // Ant's real token names (verified in ant-design-vue/es/layout/style/index.js) —
      // colorBgHeader defaults to '#001529', not derived from colorPrimary,
      // so it has to be set explicitly or the header stays navy regardless
      // of the primary-color override above.
      colorBgHeader: 'rgb(255 255 255)',
      colorBgBody: 'rgb(250 248 245)',
      colorBgTrigger: 'rgb(245 240 234)',
    },
  },
}
</script>

<template>
  <a-config-provider :theme="ADMIN_THEME">
    <a-layout class="admin-layout">
      <a-layout-sider
        class="admin-layout__sider"
        theme="light"
        width="240"
      >
        <div class="admin-layout__logo">Адмінка</div>
        <a-menu
          :selected-keys="selectedKeys"
          mode="inline"
        >
          <a-menu-item
            v-for="item in NAV_ITEMS"
            :key="item.key"
          >
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
  </a-config-provider>
</template>

<style lang="scss">
@use '~/assets/styles/variables' as *;

.admin-layout {
  min-height: 100vh;

  &__logo {
    // 28px left = Ant's .ant-menu-item box (4px) + its own left padding
    // (24px) below — matches where the nav item labels actually start.
    padding: 16px 16px 16px 28px;
    font-weight: 600;
  }

  // Descendant selector (.admin-layout .admin-layout__header) beats Ant
  // Design's built-in .ant-layout-header default (padding: 0 50px) on
  // specificity — a bare &__header ties with it and loses on source order,
  // leaving "Вийти" sitting 26px further right than the page content's edge.
  .admin-layout__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    padding-inline: 24px;
    border-bottom: 1px solid $color-gray-100;
  }

  &__content {
    padding: 24px;
  }
}
</style>

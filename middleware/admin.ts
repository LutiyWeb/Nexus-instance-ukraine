export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return
  const authStore = useAuthStore()

  if (!authStore.isLoggedIn) {
    if (to.path === '/admin/login') return
    return navigateTo('/admin/login')
  }

  if (authStore.user?.role !== 'admin') {
    return navigateTo('/')
  }

  if (to.path === '/admin/login') {
    return navigateTo('/admin')
  }
})

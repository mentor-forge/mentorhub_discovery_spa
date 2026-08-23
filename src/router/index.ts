import { createRouter, createWebHistory } from 'vue-router'
import { hasStoredRole, redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/pages/DiscoveryHomePage.vue'),
      meta: { requiresAuth: true, cardSource: 'home', title: 'Home' },
    },
    {
      path: '/resources',
      name: 'Resources',
      component: () => import('@/pages/DiscoveryHomePage.vue'),
      meta: { requiresAuth: true, cardSource: 'resources', title: 'Resources' },
    },
    {
      path: '/paths',
      name: 'Paths',
      component: () => import('@/pages/DiscoveryHomePage.vue'),
      meta: { requiresAuth: true, cardSource: 'paths', title: 'Paths' },
    },
    {
      path: '/plans',
      name: 'Plans',
      component: () => import('@/pages/DiscoveryHomePage.vue'),
      meta: { requiresAuth: true, cardSource: 'plans', title: 'Plans' },
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/pages/AdminPage.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    redirectToIdpLogin(window.location.origin + to.fullPath)
    next(false)
    return
  }

  const requiredRole = to.meta.requiresRole as string | undefined
  if (requiredRole && !hasStoredRole(requiredRole)) {
    next({ name: 'Home' })
    return
  }

  next()
})

export default router

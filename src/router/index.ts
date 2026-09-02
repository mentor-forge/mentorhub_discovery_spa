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
      path: '/events',
      name: 'Events',
      component: () => import('@/pages/DiscoveryHomePage.vue'),
      meta: { requiresAuth: true, cardSource: 'events', title: 'Events' },
    },
    {
      path: '/members',
      alias: '/members/',
      name: 'Members',
      component: () => import('@/pages/DiscoveryHomePage.vue'),
      meta: { requiresAuth: true, cardSource: 'members', title: 'Members' },
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
      path: '/products',
      name: 'Products',
      component: () => import('@/pages/DiscoveryHomePage.vue'),
      meta: { requiresAuth: true, cardSource: 'products', title: 'Products' },
    },
    {
      path: '/notifications',
      name: 'Notifications',
      component: () => import('@/pages/DiscoveryHomePage.vue'),
      meta: { requiresAuth: true, cardSource: 'notifications', title: 'Notifications' },
    },
    {
      path: '/config',
      alias: '/admin',
      name: 'Admin',
      component: () => import('@/pages/AdminPage.vue'),
      meta: { requiresAuth: true, requiresRole: 'admin' },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    const base = import.meta.env.BASE_URL
    const routePath = to.fullPath === '/' ? '' : to.fullPath.replace(/^\//, '')
    redirectToIdpLogin(`${window.location.origin}${base}${routePath}`)
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

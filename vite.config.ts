import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/** Load container runtime config before the app module so spa_utils reads IDP_LOGIN_URI. */
function injectRuntimeConfig(): Plugin {
  let base = '/'

  return {
    name: 'inject-runtime-config',
    configResolved(config: ResolvedConfig) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string) {
        return html
          .replace(
            '<head>',
            `<head>
    <script>window.__MENTORHUB_RUNTIME__=window.__MENTORHUB_RUNTIME__||{};</script>
    <script src="${base}runtime-config.js"></script>`
          )
          .replace('href="/vite.svg"', `href="${base}vite.svg"`)
      },
    },
  }
}

export default defineConfig({
  base: '/discovery/',
  plugins: [vue(), injectRuntimeConfig()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8398,
    proxy: {
      '/discovery/api': {
        target: 'http://localhost:8397',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/discovery\/api/, '/api')
      },
      '/api': {
        target: 'http://localhost:8397',
        changeOrigin: true
      }
    }
  }
})

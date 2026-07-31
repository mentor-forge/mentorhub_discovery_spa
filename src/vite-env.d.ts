/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Type definitions for runtime-injected configuration (container mode)
declare global {
  interface Window {
    API_HOST?: string
    API_PORT?: string
    __MENTORHUB_RUNTIME__?: {
      IDP_LOGIN_URI?: string
    }
  }
}


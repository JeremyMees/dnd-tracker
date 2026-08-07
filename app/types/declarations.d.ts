import type { YbugApi } from 'ybug-vue'

declare module 'vue' {
  interface ComponentCustomProperties {
    $ybug: YbugApi
  }
}

export {}

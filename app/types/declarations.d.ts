import type md from 'markdown-it'
import type { YbugApi } from 'ybug-vue'

declare module 'vue' {
  interface ComponentCustomProperties {
    $ybug: YbugApi
    $md: ReturnType<typeof md>
  }
}

export {}

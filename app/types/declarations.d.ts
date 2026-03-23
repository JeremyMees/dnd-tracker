import type {
  ComponentCustomOptions as _ComponentCustomOptions,
  ComponentCustomProperties as _ComponentCustomProperties,
} from 'vue'

interface YbugInstance {
  boot(): void
  show(type?: string): void
  hide(type?: string): void
  open(type?: string): void
  destroy(): void
  close(): void
  on(event: string, callback: (...args: any[]) => void): void
  log(key: string, value: any): void
  setUser(user: Record<string, any>): void
  init(settings: Record<string, any>): void
}

declare module '@vue/runtime-core' {
  // Empty interfaces are necessary for TypeScript to recognize auto-imported functions in Vue components
  interface ComponentCustomProperties extends _ComponentCustomProperties {
    $ybug: YbugInstance
  }
  interface ComponentCustomOptions extends _ComponentCustomOptions {}
}

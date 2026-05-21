import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'nuxt',
    setupFiles: ['./test/nuxt/unit.setup.ts'],
    exclude: ['node_modules', 'test/e2e/**'],
    onConsoleLog: (l) => {
      return !l.startsWith('<Suspense>')
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
})

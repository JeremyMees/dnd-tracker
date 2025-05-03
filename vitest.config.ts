import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'nuxt',
    setupFiles: ['./test/unit/unit.setup.js'],
    exclude: ['node_modules', 'test/e2e/**'],
  },
})

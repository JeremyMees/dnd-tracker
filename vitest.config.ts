import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import vue from '@vitejs/plugin-vue'
import { offline } from 'c15t/vue'
import { skipStubEntryFsCache } from './test/nuxt/nuxt-env.ts'
import { nuxtAliases, nuxtAutoImports } from './test/unit/nuxt-env.ts'

const ignoredLogs = [
  /^<Suspense>/,
  /Cannot destructure property 'canonicalQueryWhitelist'.*seo-utils/,
  /Failed to load messages for locale/,
]

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [vue(), nuxtAutoImports()],
        resolve: { alias: nuxtAliases },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        plugins: [skipStubEntryFsCache()],
        test: {
          globals: true,
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              overrides: { c15t: { mode: offline(), colorScheme: 'light' } },
            },
          },
          setupFiles: ['./test/nuxt/unit.setup.ts'],
        },
      }),
    ],
    onConsoleLog: l => {
      return !ignoredLogs.some(p => p.test(l))
    },
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: [
        'sentry.client.config.ts',
        'test/**',
        'constants/**',
        'i18n/**',
        'app/assets/**',
        'app/tables/**',
        'app/components/ui/**',
        'app/components/animation/**',
        'app/emails/**/*.vue',
      ],
    },
  },
})

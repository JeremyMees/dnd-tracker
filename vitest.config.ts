import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { resolve } from 'node:path'
import Unimport from 'unimport/unplugin'

const ignoredLogs = [
  /^<Suspense>/,
  /Cannot destructure property 'canonicalQueryWhitelist'.*seo-utils/,
]

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          Unimport.vite({
            dirs: ['app/utils/**', 'shared/utils/**', 'server/utils/**'],
            imports: [
              'createError',
              'defineAbility',
              'useRuntimeConfig',
              'useI18n',
              'useSupabaseClient',
            ].map(name => ({ name, from: '#app' })),
            presets: ['vue'],
            dts: false,
          }),
        ],
        resolve: {
          alias: {
            '~': resolve(__dirname, 'app'),
            '~~': resolve(__dirname, '.'),
            '#app': resolve(__dirname, 'test/unit/stubs/nuxt.ts'),
          },
        },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          globals: true,
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          setupFiles: ['./test/nuxt/unit.setup.ts'],
        },
      }),
    ],
    onConsoleLog: l => {
      return !ignoredLogs.some(p => p.test(l))
    },
  },
})

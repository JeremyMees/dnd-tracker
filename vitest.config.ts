import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { nuxtAliases, nuxtAutoImports } from './test/unit/nuxt-env.ts'

const ignoredLogs = [
  /^<Suspense>/,
  /Cannot destructure property 'canonicalQueryWhitelist'.*seo-utils/,
]

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [nuxtAutoImports()],
        resolve: { alias: nuxtAliases },
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

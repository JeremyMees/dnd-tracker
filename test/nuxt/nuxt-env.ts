import type { Plugin } from 'vite'

const stubEntry = 'nuxt-vitest-app-entry'

export function skipStubEntryFsCache(): Plugin {
  return {
    name: 'skip-stub-entry-fs-cache',
    configureVitest({ defineCacheKeyGenerator }) {
      defineCacheKeyGenerator(({ id, sourceCode }) =>
        id.includes(stubEntry) || sourceCode.includes(stubEntry)
          ? false
          : undefined,
      )
    },
  }
}

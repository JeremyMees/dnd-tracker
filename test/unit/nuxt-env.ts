import { resolve } from 'node:path'
import MagicString from 'magic-string'
import { createUnimport } from 'unimport'
import type { Plugin } from 'vite'

const root = resolve(import.meta.dirname, '../..')

export const nuxtAliases = {
  '~': resolve(root, 'app'),
  '~~': root,
  '#app': resolve(import.meta.dirname, 'stubs/nuxt.ts'),
  '#nitro': resolve(import.meta.dirname, 'stubs/nitro.ts'),
}

export function nuxtAutoImports(): Plugin {
  const ctx = createUnimport({
    dirs: [
      resolve(root, 'app/utils/**'),
      resolve(root, 'shared/utils/**'),
      resolve(root, 'server/utils/**'),
    ],
    imports: [
      ...[
        'createError',
        'defineAbility',
        'useRuntimeConfig',
        'useI18n',
        'useSupabaseClient',
      ].map(name => ({ name, from: '#app' })),
      ...[
        'defineEventHandler',
        'sendRedirect',
        'readValidatedBody',
        'readBody',
        'readRawBody',
        'getQuery',
        'getRequestHeader',
        'getHeader',
        'getRequestIP',
        'setHeader',
      ].map(name => ({ name, from: 'h3' })),
      { name: 'useStorage', from: 'nitropack/runtime' },
      { name: 'defineCachedEventHandler', from: '#nitro' },
    ],
    presets: ['vue'],
  })

  return {
    name: 'nuxt-auto-imports',
    enforce: 'post',
    async buildStart() {
      await ctx.init()
    },
    async transform(code, id) {
      if (
        !/\.([jt]sx?|vue)($|\?)/.test(id) ||
        /[\\/]node_modules[\\/]/.test(id)
      )
        return

      const s = new MagicString(code)

      await ctx.injectImports(s, id)

      if (!s.hasChanged()) return

      return { code: s.toString(), map: s.generateMap({ hires: true }) }
    },
  }
}

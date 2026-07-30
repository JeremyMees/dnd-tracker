import { resolve } from 'node:path'
import Unimport from 'unimport/unplugin'
import type { Plugin } from 'vite'

const root = resolve(__dirname, '../..')

export const nuxtAliases = {
  '~': resolve(root, 'app'),
  '~~': root,
  '#app': resolve(__dirname, 'stubs/nuxt.ts'),
  '#supabase/server': resolve(__dirname, 'stubs/supabase-server.ts'),
}

export function nuxtAutoImports(): Plugin {
  return Unimport.vite({
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
      ...['defineEventHandler', 'sendRedirect'].map(name => ({
        name,
        from: 'h3',
      })),
    ],
    presets: ['vue'],
    dts: false,
  }) as Plugin
}

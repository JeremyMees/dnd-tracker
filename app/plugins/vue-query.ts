import type {
  DehydratedState,
  VueQueryPluginOptions,
} from '@tanstack/vue-query'
import {
  VueQueryPlugin,
  QueryClient,
  hydrate,
  dehydrate,
} from '@tanstack/vue-query'
import { FIVE_MINUTES, ONE_MINUTE } from '~~/constants/time'

export default defineNuxtPlugin({
  name: 'vue-query',
  parallel: true,
  setup(nuxt) {
    const vueQueryState = useState<DehydratedState | null>('vue-query')

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: ONE_MINUTE,
          gcTime: FIVE_MINUTES,
        },
      },
    })

    const options: VueQueryPluginOptions = { queryClient }

    nuxt.vueApp.use(VueQueryPlugin, options)

    if (import.meta.server) {
      nuxt.hooks.hook('app:rendered', () => {
        vueQueryState.value = dehydrate(queryClient)
      })
    }

    if (import.meta.client) {
      nuxt.hooks.hook('app:created', () => {
        hydrate(queryClient, vueQueryState.value)
      })
    }
  },
})

import type {
  DehydratedState,
  VueQueryPluginOptions,
} from '@tanstack/vue-query'
import {
  VueQueryPlugin,
  QueryClient,
  hydrate,
  dehydrate,
  timeoutManager,
} from '@tanstack/vue-query'
import { FIVE_MINUTES, ONE_MINUTE } from '~~/constants/time'

function detach<T>(timer: T): T {
  ;(timer as { unref?: () => void }).unref?.()
  return timer
}

if (import.meta.server) {
  timeoutManager.setTimeoutProvider({
    setTimeout: (callback, delay) => detach(setTimeout(callback, delay)),
    clearTimeout: timeoutId => clearTimeout(timeoutId),
    setInterval: (callback, delay) => detach(setInterval(callback, delay)),
    clearInterval: intervalId => clearInterval(intervalId),
  })
}

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
        queryClient.clear()
      })
    }

    if (import.meta.client) {
      nuxt.hooks.hook('app:created', () => {
        if (vueQueryState.value) {
          hydrate(queryClient, vueQueryState.value)
        }
      })
    }
  },
})

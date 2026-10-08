import { h } from 'vue'
import type { RouteLocationNamedI18n } from 'vue-router'

export function localeHref(to: RouteLocationNamedI18n): string {
  const route = useNuxtApp().$localeRoute(to)

  if (!route) throw new Error(`No route matches ${JSON.stringify(to)}`)

  return route.fullPath
}

export const NuxtLinkLocaleStub = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  setup(props, { slots }) {
    return () =>
      h(
        'a',
        { href: localeHref(props.to as RouteLocationNamedI18n) },
        slots.default?.(),
      )
  },
})

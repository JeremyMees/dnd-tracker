import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import type { Component, ComponentPublicInstance } from 'vue'
import { h, nextTick, reactive } from 'vue'
import TooltipProvider from '~/components/atoms/TooltipProvider.vue'

type MountOptions<T> = NonNullable<Parameters<typeof mountSuspended<T>>[1]>

type Instance<T> = T extends { new (...args: never[]): infer I }
  ? I
  : ComponentPublicInstance

export async function mountWithTooltips<T extends Component>(
  component: T,
  options: MountOptions<T> = {} as MountOptions<T>,
): Promise<VueWrapper<Instance<T>>> {
  const { props, slots, ...rest } = options as MountOptions<T> & {
    props?: Record<string, unknown>
    slots?: Record<string, unknown>
  }

  const currentProps = reactive({ ...props })

  const root = await mountSuspended<typeof TooltipProvider>(TooltipProvider, {
    ...rest,
    slots: { default: () => h(component, { ...currentProps }, slots ?? {}) },
  } as MountOptions<typeof TooltipProvider>)

  await flushPromises()

  const wrapper = root.findComponent(component)

  return new Proxy(wrapper, {
    get(target, prop, receiver) {
      if (prop === 'unmount') return () => root.unmount()

      if (prop === 'setProps') {
        return async (next: Record<string, unknown>) => {
          Object.assign(currentProps, next)
          await nextTick()
        }
      }

      const value = Reflect.get(target, prop, receiver)

      return typeof value === 'function' ? value.bind(target) : value
    },
  }) as unknown as VueWrapper<Instance<T>>
}

export async function hoverTooltip(trigger: ReturnType<VueWrapper['find']>) {
  await trigger.trigger('pointermove', { pointerType: 'mouse' })
}

export async function dismissTooltip(trigger: ReturnType<VueWrapper['find']>) {
  await trigger.trigger('click')
  await trigger.trigger('pointerleave')
}

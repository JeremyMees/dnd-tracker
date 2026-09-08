import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import FormWrapper from '~/components/ui/form/FormWrapper.vue'

const locale = ref('en')

mockNuxtImport('useI18n', () => () => ({
  locale,
  t: (key: string) => key,
}))

function messageOf(schema: z.ZodType, value: unknown): string {
  const result = schema.safeParse(value)

  return result.success ? '' : (result.error.issues[0]?.message ?? '')
}

describe('useZodLocale', () => {
  beforeEach(() => {
    locale.value = 'en'
  })

  it('Should install the zod compiler alongside the form layer', () => {
    expect(z.core.globalConfig.postProcessor).toBeTypeOf('function')

    const schema = z.object({ name: z.string().min(5) })

    schema.safeParse({ name: 'ab' })

    expect(schema._zod.bag.validator).toBeTypeOf('function')
  })

  it('Should apply the active locale to schema messages', async () => {
    locale.value = 'nl'

    const wrapper = await mountSuspended(FormWrapper)

    expect(messageOf(z.string().min(5), 'ab')).toContain('Te kort')

    wrapper.unmount()
  })

  it('Should follow locale changes on a compiled schema', async () => {
    const wrapper = await mountSuspended(FormWrapper)
    const schema = z.string().min(5)

    expect(messageOf(schema, 'ab')).toContain('Too small')

    locale.value = 'nl'
    await nextTick()

    expect(messageOf(schema, 'ab')).toContain('Te kort')

    wrapper.unmount()
  })
})

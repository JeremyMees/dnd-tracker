import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import LangSwitcher from '~/components/atoms/LangSwitcher.vue'
import { Select } from '~/components/ui/select'

const localeRef = ref('en')

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
}))

const { switchLocalePathMock } = vi.hoisted(() => ({
  switchLocalePathMock: vi.fn((lang: string) => `/${lang}`),
}))

mockNuxtImport('useI18n', () => () => ({
  locale: localeRef,
  locales: [
    { code: 'en', name: 'English' },
    { code: 'nl', name: 'Nederlands' },
  ],
}))

mockNuxtImport('useSwitchLocalePath', () => () => switchLocalePathMock)

mockNuxtImport('navigateTo', () => navigateToMock)

describe('LangSwitcher', async () => {
  beforeEach(() => {
    localeRef.value = 'en'
    navigateToMock.mockClear()
    switchLocalePathMock.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(LangSwitcher)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render select component', async () => {
    const component = await mountSuspended(LangSwitcher)

    const select = component.findComponent(Select)
    expect(select.exists()).toBeTruthy()
  })

  it('Should call navigateTo with correct path when language is changed to nl', async () => {
    const component = await mountSuspended(LangSwitcher)

    const select = component.findComponent(Select)
    await select.vm.$emit('update:modelValue', 'nl')

    expect(switchLocalePathMock).toHaveBeenCalledWith('nl')
    expect(navigateToMock).toHaveBeenCalledWith('/nl')
  })

  it('Should call navigateTo with correct path when language is changed to en', async () => {
    localeRef.value = 'nl'

    const component = await mountSuspended(LangSwitcher)

    const select = component.findComponent(Select)
    await select.vm.$emit('update:modelValue', 'en')

    expect(switchLocalePathMock).toHaveBeenCalledWith('en')
    expect(navigateToMock).toHaveBeenCalledWith('/en')
  })

  it('Should not navigate when invalid language is provided', async () => {
    const component = await mountSuspended(LangSwitcher)

    const select = component.findComponent(Select)
    await select.vm.$emit('update:modelValue', 'fr')

    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('Should not navigate when non-string value is provided', async () => {
    const component = await mountSuspended(LangSwitcher)

    const select = component.findComponent(Select)
    await select.vm.$emit('update:modelValue', 123)

    expect(navigateToMock).not.toHaveBeenCalled()
  })
})

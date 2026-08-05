import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Select } from '~/components/ui/select'
import Changelog from '~/pages/updates/changelog.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { useSeo, changelogs } = vi.hoisted(() => ({
  useSeo: vi.fn(),
  changelogs: [
    {
      version: 'v3.0.0',
      date: '2026-01-01',
      features: [{ title: 'New', items: [{ text: 'Feature A' }] }],
    },
    {
      version: 'v3.1.1',
      date: '2026-03-01',
      features: [{ title: 'Bug fixes', items: [{ text: 'Fix B' }] }],
    },
    {
      version: 'v2.0.0',
      date: '2025-01-01',
      features: [{ title: 'Improvements', items: [{ text: 'Improve C' }] }],
    },
  ] as Changelog[],
}))

mockNuxtImport('useSeo', () => useSeo)

vi.mock('~~/constants/changelogs', () => ({ changelogs }))

const stubs = { NuxtLayout: nuxtLayoutStub }

async function mountPage() {
  const component = await mountSuspended(Changelog, { global: { stubs } })

  await flushPromises()

  return {
    component,
    get entries() {
      return component.findAll('[data-test-entry]')
    },
    get versions() {
      return component
        .findAll('[data-test-version]')
        .map(version => version.text())
    },
    async selectMajor(major: number) {
      await component.findComponent(Select).vm.$emit('update:modelValue', major)
    },
  }
}

describe('Changelog page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Changelogs')
  })

  it('Should render the page copy', async () => {
    const { component } = await mountPage()

    expect(component.get('[data-test-title]').text()).toBe(
      'pages.changelog.title',
    )
    expect(component.get('[data-test-description]').text()).toBe(
      'pages.changelog.description',
    )
  })

  it('Should default to the highest major version, newest first', async () => {
    const { versions } = await mountPage()

    expect(versions).toEqual(['v3.1.1', 'v3.0.0'])
  })

  it('Should switch to the entries of the selected major version', async () => {
    const page = await mountPage()

    await page.selectMajor(2)

    expect(page.versions).toEqual(['v2.0.0'])
  })

  it('Should render no entries for a major version without changelogs', async () => {
    const page = await mountPage()

    await page.selectMajor(4)

    expect(page.entries).toHaveLength(0)
  })

  it('Should render the date of an entry', async () => {
    const { component } = await mountPage()

    expect(component.get('[data-test-date]').attributes('datetime')).toBe(
      new Date(changelogs[1]!.date).toISOString(),
    )
  })

  it('Should render the feature group titles and items of an entry', async () => {
    const { component } = await mountPage()

    const group = component.get('[data-test-feature-group]')

    expect(group.get('[data-test-feature-title]').text()).toBe('Bug fixes')
    expect(group.get('[data-test-feature-item]').text()).toBe('Fix B')
  })
})

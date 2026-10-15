import type { NuxtError } from '#app'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import Error from '~/error.vue'

const useSeoMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useSeo', () => useSeoMock)

describe('error', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(Error)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should set the page seo', async () => {
    await mountSuspended(Error)

    expect(useSeoMock).toHaveBeenCalledWith('Error')
  })

  it('Should render the error status when an error is provided', async () => {
    const component = await mountSuspended(Error, {
      props: {
        error: { statusCode: 404, status: 404 } as unknown as NuxtError,
      },
    })

    expect(component.text()).toContain('404')
  })

  it.each([
    [undefined, 'notFound'],
    [404, 'notFound'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [500, 'generic'],
    [429, 'generic'],
  ])('Should show the %s error text', async (status, variant) => {
    const component = await mountSuspended(Error, {
      props: {
        error: status
          ? ({ statusCode: status, status } as unknown as NuxtError)
          : undefined,
      },
    })

    expect(component.get('[test-id="title"]').text()).toBe(
      `pages.error.${variant}.title`,
    )
    expect(component.get('[test-id="text"]').text()).toBe(
      `pages.error.${variant}.text`,
    )
  })

  it('Should render no status when no error is provided', async () => {
    const component = await mountSuspended(Error)

    expect(component.text()).not.toContain('undefined')
  })

  it('Should link back to the home page', async () => {
    const component = await mountSuspended(Error)

    const link = component.get('a')

    expect(link.attributes('href')).toBe('/')
    expect(link.text()).toBe('pages.error.goHome')
  })
})

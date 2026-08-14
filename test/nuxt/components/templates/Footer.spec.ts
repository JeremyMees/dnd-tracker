import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Footer from '~/components/templates/Footer.vue'

describe('Footer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Footer)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the current year in the copyright text', async () => {
    const component = await mountSuspended(Footer)

    expect(component.get('[test-id="footer-copyright"]').text()).toContain(
      '2026',
    )
  })

  it('Should link to the home page from the logo', async () => {
    const component = await mountSuspended(Footer)

    expect(component.get('[test-id="footer-home"]').attributes('href')).toBe(
      '/',
    )
  })

  it('Should render the contact links', async () => {
    const component = await mountSuspended(Footer)

    expect(component.get('[test-id="footer-email"]').attributes('href')).toBe(
      'mailto:jeremy@dnd-tracker.com',
    )
    expect(component.get('[test-id="footer-contact"]').attributes('href')).toBe(
      '/contact',
    )
  })

  it('Should render the social links', async () => {
    const component = await mountSuspended(Footer)

    expect(
      component.get('[test-id="footer-instagram"]').attributes('href'),
    ).toBe('https://www.instagram.com/dnd.tracker/')
    expect(component.get('[test-id="footer-bluesky"]').attributes('href')).toBe(
      'https://bsky.app/profile/lilmees.bsky.social',
    )
    expect(component.get('[test-id="footer-kofi"]').attributes('href')).toBe(
      'https://ko-fi.com/jeremymees',
    )
  })

  it('Should render the update links', async () => {
    const component = await mountSuspended(Footer)

    expect(
      component.get('[test-id="footer-feature-request"]').attributes('href'),
    ).toBe('/updates/feature-request')
    expect(
      component.get('[test-id="footer-changelog"]').attributes('href'),
    ).toBe('/updates/changelog')
  })

  it('Should render the policy links', async () => {
    const component = await mountSuspended(Footer)

    expect(component.get('[test-id="footer-cookie"]').attributes('href')).toBe(
      '/policies/cookie',
    )
    expect(component.get('[test-id="footer-privacy"]').attributes('href')).toBe(
      '/policies/privacy',
    )
    expect(component.get('[test-id="footer-legal"]').attributes('href')).toBe(
      '/policies/legal',
    )
  })

  it('Should render the illustration credit and version links', async () => {
    const component = await mountSuspended(Footer)

    expect(
      component.get('[test-id="footer-illustration"]').attributes('href'),
    ).toBe('https://www.instagram.com/mount_lazarus/')
    expect(component.get('[test-id="footer-version"]').attributes('href')).toBe(
      '/updates/changelog',
    )
  })
})

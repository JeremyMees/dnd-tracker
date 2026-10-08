import { describe, expect, it } from 'vitest'
import { campaignUrl, encounterUrl } from '~/utils/url-generators'
import { localeHref } from '~~/test/nuxt/stubs/locale'

describe('url-generators routing', () => {
  it.each([
    ['encounters', '/campaigns/1-my-campaign/encounters'],
    ['homebrews', '/campaigns/1-my-campaign/homebrews'],
    ['notes', '/campaigns/1-my-campaign/notes'],
    ['settings', '/campaigns/1-my-campaign/settings'],
    ['danger-zone', '/campaigns/1-my-campaign/danger-zone'],
  ] as const)('resolves the campaign %s page', (page, path) => {
    expect(localeHref(campaignUrl({ id: 1, title: 'My Campaign' }, page))).toBe(
      path,
    )
  })

  it('resolves a campaign without a title', () => {
    expect(localeHref(campaignUrl({ id: 3, title: '' }, 'notes'))).toBe(
      '/campaigns/3-campaign/notes',
    )
  })

  it('resolves an encounter', () => {
    expect(localeHref(encounterUrl({ id: 1, title: 'Dragon Battle' }))).toBe(
      '/encounters/1-dragon-battle',
    )
  })

  it('resolves an encounter without a title', () => {
    expect(localeHref(encounterUrl({ id: 3, title: '' }))).toBe(
      '/encounters/3-encounter',
    )
  })
})

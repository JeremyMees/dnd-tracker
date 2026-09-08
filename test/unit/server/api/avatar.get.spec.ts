import { describe, expect, it } from 'vitest'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import handler from '~~/server/api/avatar.get'

function avatarEvent(query: string) {
  return mockEvent({ path: `/api/avatar?${query}` })
}

describe('GET /api/avatar', () => {
  it('renders the avatar for the picked options', async () => {
    const { url, extra } = await handler(
      avatarEvent('headVariant=pomp&skinColor=edb98a'),
    )

    expect(url).toContain('data:image/svg+xml')
    expect(extra).toMatchObject({
      headVariant: 'pomp',
      skinColor: '#edb98a',
    })
  })

  it('renders the seed default when nothing is picked', async () => {
    await expect(handler(avatarEvent(''))).resolves.toEqual(
      await handler(avatarEvent('unknown=value')),
    )
  })

  it('accepts options that were saved under their v9 name', async () => {
    await expect(handler(avatarEvent('head=pomp'))).resolves.toEqual(
      await handler(avatarEvent('headVariant=pomp')),
    )
  })

  it('caches at the generated asset tier', async () => {
    const event = avatarEvent('headVariant=pomp')

    await handler(event)

    expect(responseHeader(event, 'CDN-Cache-Control')).toBe(
      'public, s-maxage=604800, stale-while-revalidate=604800, stale-if-error=604800',
    )
  })

  it('rejects a query value that is too long to be an option', async () => {
    await expect(
      handler(avatarEvent(`headVariant=${'p'.repeat(51)}`)),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})

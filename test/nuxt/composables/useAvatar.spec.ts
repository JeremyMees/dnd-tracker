import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAvatarCreator } from '~/composables/useAvatar'
import {
  avatarRequests,
  flushAvatar,
  holdNextAvatar,
  stubAvatarEndpoint,
} from '~~/test/nuxt/stubs/avatar'

vi.mock('~/utils/array-utils', () => ({
  randomArrayItem: vi.fn(arr => arr[0]),
}))

stubAvatarEndpoint()

describe('useAvatar', () => {
  let avatar: ReturnType<typeof useAvatarCreator>

  beforeEach(() => {
    avatarRequests.length = 0
    avatar = useAvatarCreator()
  })

  it('should initialize with empty options', () => {
    expect(avatar.options.value).toEqual({})
    expect(avatar.avatar.value).toBeUndefined()
    expect(avatar.pending.value).toBe(false)
  })

  it('should update options and generate avatar when update is called', async () => {
    await avatar.update({ expressionVariant: 'smile', headVariant: 'pomp' })

    expect(avatar.options.value).toEqual({
      expressionVariant: 'smile',
      headVariant: 'pomp',
    })
    expect(avatar.avatar.value?.url).toContain('data:image/svg+xml')
    expect(avatar.avatar.value?.extra).toMatchObject({
      expressionVariant: 'smile',
      headVariant: 'pomp',
    })
    expect(avatar.pending.value).toBe(false)
  })

  it('should ask the server for exactly the picked options', async () => {
    await avatar.update({ headVariant: 'pomp' })

    expect(avatarRequests).toEqual([{ headVariant: 'pomp' }])
  })

  it('should normalize the options it is updated with', async () => {
    await avatar.update({ face: 'smile', head: 'pomp', style: 'open-peeps' })

    expect(avatar.options.value).toEqual({
      expressionVariant: 'smile',
      headVariant: 'pomp',
    })
  })

  it('should merge updates into the options that were already picked', async () => {
    await avatar.update({ headVariant: 'pomp' })
    await avatar.update({ expressionVariant: 'smile' })

    expect(avatar.options.value).toEqual({
      headVariant: 'pomp',
      expressionVariant: 'smile',
    })
  })

  it('should generate random avatar when random is called', async () => {
    await avatar.random()

    expect(randomArrayItem).toHaveBeenCalled()
    expect(avatar.avatar.value?.url).toContain('data:image/svg+xml')
    // randomArrayItem is mocked to pick the first value of every option
    expect(avatar.options.value).toEqual({
      accessoriesVariant: '',
      expressionVariant: 'angryWithFang',
      facialHairVariant: '',
      headVariant: 'afro',
      clothingColor: '8fa7df',
      skinColor: 'ffdbb4',
      backgroundColor: 'fee2e2',
    })
  })

  it('should replace the previously picked options when random is called', async () => {
    await avatar.update({ headVariant: 'pomp' })
    await avatar.random()

    expect(avatar.options.value.headVariant).toBe('afro')
  })

  it('should collapse a burst of picks into a single request', async () => {
    void avatar.update({ headVariant: 'pomp' })
    void avatar.update({ expressionVariant: 'smile' })
    await avatar.update({ facialHairVariant: 'chin' })

    expect(avatarRequests).toEqual([
      {
        headVariant: 'pomp',
        expressionVariant: 'smile',
        facialHairVariant: 'chin',
      },
    ])
  })

  it('should keep the avatar of the most recent pick when responses land late', async () => {
    const releaseFirst = holdNextAvatar()

    void avatar.update({ headVariant: 'pomp' })
    await flushAvatar()

    await avatar.update({ headVariant: 'afro' })

    releaseFirst()
    await flushAvatar()

    expect(avatarRequests).toHaveLength(2)
    expect(avatar.avatar.value?.extra).toMatchObject({ headVariant: 'afro' })
    expect(avatar.pending.value).toBe(false)
  })
})

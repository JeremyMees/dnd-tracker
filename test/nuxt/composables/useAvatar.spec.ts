import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAvatar } from '@dicebear/core'
import { useAvatarCreator } from '~/composables/useAvatar'

vi.mock('~/utils/array-utils', () => ({
  randomArrayItem: vi.fn(arr => arr[0]),
}))

vi.mock('@dicebear/core', () => ({
  createAvatar: vi.fn(() => ({
    toDataUri: () => 'data:image/svg+xml;base64,mock-data-uri',
    toJson: () => ({ extra: { test: 'value' } }),
  })),
}))

describe('useAvatar', () => {
  let avatar: ReturnType<typeof useAvatarCreator>

  beforeEach(() => {
    vi.clearAllMocks()
    avatar = useAvatarCreator()
  })

  it('should initialize with empty options', () => {
    expect(avatar.options.value).toEqual({})
    expect(avatar.avatar.value).toBeUndefined()
  })

  it('should update options and generate avatar when update is called', () => {
    const selectedOptions = { face: 'happy', hair: 'short' }
    avatar.update(selectedOptions)

    expect(avatar.options.value).toEqual(selectedOptions)
    expect(createAvatar).toHaveBeenCalled()
    expect(avatar.avatar.value).toEqual({
      url: 'data:image/svg+xml;base64,mock-data-uri',
      extra: { test: 'value' },
    })
  })

  it('should handle primaryBackgroundColor special case', () => {
    avatar.update({ primaryBackgroundColor: '#ffffff' })

    expect(avatar.options.value).toEqual({ backgroundColor: '#ffffff' })
  })

  it('should skip blacklisted keys when updating', () => {
    avatar.update({ style: 'test', face: 'happy' })

    expect(avatar.options.value).toEqual({ face: 'happy' })
    expect(avatar.options.value.style).toBeUndefined()
  })

  it('should generate random avatar when random is called', () => {
    avatar.random()

    expect(randomArrayItem).toHaveBeenCalled()
    expect(createAvatar).toHaveBeenCalled()
    expect(avatar.avatar.value).toEqual({
      url: 'data:image/svg+xml;base64,mock-data-uri',
      extra: { test: 'value' },
    })
  })

  it('should create correct avatar options with getAvatarOptions', () => {
    avatar.options.value = { face: 'happy', head: 'long' }

    const options = avatar.getAvatarOptions()

    expect(options).toMatchObject({
      size: 100,
      scale: 75,
      seed: 'dnd',
      face: ['happy'],
      head: ['long'],
    })
  })

  it('should handle array type options correctly', () => {
    vi.spyOn(avatar, 'configStyleOptions', 'get').mockReturnValue({
      head: {
        values: ['long', 'short'],
        isColor: false,
        isArray: true,
        hasProbability: false,
        probability: 100,
      },
    })

    avatar.options.value = { head: 'long' }
    const options = avatar.getAvatarOptions()

    expect(options.head).toEqual(['long'])
  })
})

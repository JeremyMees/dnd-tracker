import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAvatarCreator } from '~/composables/useAvatar'

vi.mock('~/utils/array-utils', () => ({
  randomArrayItem: vi.fn(arr => arr[0]),
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
    avatar.update({ expressionVariant: 'smile', headVariant: 'pomp' })

    expect(avatar.options.value).toEqual({
      expressionVariant: 'smile',
      headVariant: 'pomp',
    })
    expect(avatar.avatar.value?.url).toContain('data:image/svg+xml')
    expect(avatar.avatar.value?.extra).toMatchObject({
      expressionVariant: 'smile',
      headVariant: 'pomp',
    })
  })

  it('should normalize the options it is updated with', () => {
    avatar.update({ face: 'smile', head: 'pomp', style: 'open-peeps' })

    expect(avatar.options.value).toEqual({
      expressionVariant: 'smile',
      headVariant: 'pomp',
    })
  })

  it('should merge updates into the options that were already picked', () => {
    avatar.update({ headVariant: 'pomp' })
    avatar.update({ expressionVariant: 'smile' })

    expect(avatar.options.value).toEqual({
      headVariant: 'pomp',
      expressionVariant: 'smile',
    })
  })

  it('should generate random avatar when random is called', () => {
    avatar.random()

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

  it('should replace the previously picked options when random is called', () => {
    avatar.update({ headVariant: 'pomp' })
    avatar.random()

    expect(avatar.options.value.headVariant).toBe('afro')
  })
})

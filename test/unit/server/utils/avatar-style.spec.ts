import { describe, expect, it, vi } from 'vitest'
import { avatarStyleOptions } from '~~/constants/avatar-options'

describe('avatar-style', () => {
  describe('getAvatarStyle', () => {
    it('should reuse the same style instance', () => {
      expect(getAvatarStyle()).toBe(getAvatarStyle())
    })

    it('should return a style that can render an avatar', () => {
      expect(getAvatarStyle().colors().get('skin')?.values()).toContain(
        '#edb98a',
      )
    })

    it('should not build the style before something asks for it', async () => {
      vi.resetModules()

      let built = 0

      vi.doMock('@dicebear/core', async importOriginal => {
        const core = await importOriginal<typeof import('@dicebear/core')>()

        return {
          ...core,
          Style: class extends core.Style {
            constructor(data: unknown) {
              super(data)
              built++
            }
          },
        }
      })

      try {
        const avatar = await import('~~/server/utils/avatar-style')

        expect(built).toBe(0)

        avatar.getAvatarStyle()

        expect(built).toBe(1)

        avatar.buildStyleOptions()
        avatar.getAvatarStyle()

        expect(built).toBe(1)
      } finally {
        vi.doUnmock('@dicebear/core')
        vi.resetModules()
      }
    })
  })

  describe('buildStyleOptions', () => {
    it('should match the committed constant', () => {
      expect(buildStyleOptions()).toEqual(avatarStyleOptions)
    })

    it('should treat a variant without a matching component as always drawn', async () => {
      vi.resetModules()

      vi.doMock('@dicebear/core', async importOriginal => {
        const core = await importOriginal<typeof import('@dicebear/core')>()

        return {
          ...core,
          OptionsDescriptor: class extends core.OptionsDescriptor {
            override toJSON(): ReturnType<
              InstanceType<typeof core.OptionsDescriptor>['toJSON']
            > {
              return {
                ...super.toJSON(),
                ghostVariant: { type: 'enum', values: ['a', 'b'] },
              }
            }
          },
        }
      })

      try {
        const avatar = await import('~~/server/utils/avatar-style')

        expect(avatar.buildStyleOptions().ghostVariant).toEqual({
          isColor: false,
          hasProbability: false,
          values: ['a', 'b'],
        })
      } finally {
        vi.doUnmock('@dicebear/core')
        vi.resetModules()
      }
    })
  })
})

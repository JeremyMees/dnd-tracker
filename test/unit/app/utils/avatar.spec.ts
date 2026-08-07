import { describe, expect, it, vi } from 'vitest'
import { Avatar as DiceBearAvatar } from '@dicebear/core'

describe('avatar', () => {
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
        const avatar = await import('~/utils/avatar')

        expect(built).toBe(0)

        avatar.getAvatarStyle()

        expect(built).toBe(1)

        // Both accessors share the one instance and never rebuild it.
        avatar.getStyleOptions()
        avatar.getAvatarStyle()

        expect(built).toBe(1)
      } finally {
        vi.doUnmock('@dicebear/core')
        vi.resetModules()
      }
    })
  })

  describe('getStyleOptions', () => {
    it('should reuse the same options object', () => {
      expect(getStyleOptions()).toBe(getStyleOptions())
    })

    it('should only expose the selectable open peeps options', () => {
      expect(Object.keys(getStyleOptions())).toEqual([
        'accessoriesVariant',
        'expressionVariant',
        'facialHairVariant',
        'headVariant',
        'clothingColor',
        'skinColor',
        'backgroundColor',
      ])
    })

    it('should mark colors and use the palette of the style', () => {
      expect(getStyleOptions().skinColor).toEqual({
        isColor: true,
        hasProbability: false,
        values: ['ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '694d3d'],
      })
    })

    it('should fall back to our own palette for the background', () => {
      const backgroundColor = getStyleOptions().backgroundColor

      expect(backgroundColor?.isColor).toBe(true)
      expect(backgroundColor?.values).toHaveLength(40)
      expect(backgroundColor?.values).toContain('7dd3fc')
    })

    it('should add an empty value to components that are not always drawn', () => {
      const options = getStyleOptions()

      expect(options.accessoriesVariant?.hasProbability).toBe(true)
      expect(options.accessoriesVariant?.values[0]).toBe('')
      expect(options.headVariant?.hasProbability).toBe(false)
      expect(options.headVariant?.values[0]).toBe('afro')
    })
  })

  describe('normalizeStyleOptions', () => {
    it('should rename options that were saved under their v9 name', () => {
      expect(
        normalizeStyleOptions({
          accessories: 'glasses',
          face: 'smile',
          facialHair: 'chin',
          head: 'pomp',
          primaryBackgroundColor: '#7dd3fc',
        }),
      ).toEqual({
        accessoriesVariant: 'glasses',
        expressionVariant: 'smile',
        facialHairVariant: 'chin',
        headVariant: 'pomp',
        backgroundColor: '#7dd3fc',
      })
    })

    it('should drop unknown and blacklisted options', () => {
      expect(
        normalizeStyleOptions({
          style: 'open-peeps',
          backgroundType: 'solid',
          headContrastColor: '#2c1b18',
          maskVariant: 'respirator',
          skinColor: '#edb98a',
        }),
      ).toEqual({ skinColor: '#edb98a' })
    })

    it('should keep an already normalized set of options untouched', () => {
      const options = { headVariant: 'pomp', skinColor: '#edb98a' }

      expect(normalizeStyleOptions(options)).toEqual(options)
    })
  })

  describe('getAvatarOptions', () => {
    it('should always render the same size, scale and seed', () => {
      expect(getAvatarOptions({})).toEqual({
        size: 100,
        scale: 0.75,
        seed: 'dnd',
      })
    })

    it('should prefix colors and force the probability of picked components', () => {
      expect(
        getAvatarOptions({
          accessoriesVariant: 'glasses',
          headVariant: 'pomp',
          skinColor: 'edb98a',
          clothingColor: '#fdea6b',
        }),
      ).toEqual({
        size: 100,
        scale: 0.75,
        seed: 'dnd',
        accessoriesVariant: 'glasses',
        accessoriesProbability: 100,
        headVariant: 'pomp',
        skinColor: '#edb98a',
        clothingColor: '#fdea6b',
      })
    })

    it('should drop the component of an empty pick', () => {
      expect(
        getAvatarOptions({
          accessoriesVariant: '',
          facialHairVariant: '',
          headVariant: 'pomp',
        }),
      ).toEqual({
        size: 100,
        scale: 0.75,
        seed: 'dnd',
        accessoriesProbability: 0,
        facialHairProbability: 0,
        headVariant: 'pomp',
      })
    })

    it('should leave options that were not picked to the style itself', () => {
      expect(getAvatarOptions({ headVariant: '', unknown: 'value' })).toEqual({
        size: 100,
        scale: 0.75,
        seed: 'dnd',
      })
    })

    it('should be accepted by DiceBear', () => {
      const options = getAvatarOptions({
        accessoriesVariant: 'glasses',
        expressionVariant: 'smile',
        headVariant: 'pomp',
        backgroundColor: '7dd3fc',
      })

      expect(
        new DiceBearAvatar(getAvatarStyle(), options).toDataUri(),
      ).toContain('data:image/svg+xml')
    })
  })

  describe('getAvatarExtra', () => {
    it('should return the options DiceBear resolved', () => {
      const generated = new DiceBearAvatar(
        getAvatarStyle(),
        getAvatarOptions({ headVariant: 'pomp', skinColor: 'edb98a' }),
      )

      expect(getAvatarExtra(generated)).toMatchObject({
        headVariant: 'pomp',
        skinColor: '#edb98a',
        expressionVariant: expect.any(String),
        clothingColor: expect.any(String),
      })
    })

    it('should be able to rebuild the same avatar', () => {
      const generated = new DiceBearAvatar(
        getAvatarStyle(),
        getAvatarOptions({ headVariant: 'pomp' }),
      )

      const rebuilt = new DiceBearAvatar(
        getAvatarStyle(),
        getAvatarOptions(normalizeStyleOptions(getAvatarExtra(generated))),
      )

      expect(rebuilt.toDataUri()).toBe(generated.toDataUri())
    })

    it('should leave out options that cannot be picked', () => {
      const generated = new DiceBearAvatar(
        getAvatarStyle(),
        getAvatarOptions({ headVariant: 'pomp' }),
      )

      expect(getAvatarExtra(generated)).not.toHaveProperty('maskVariant')
      expect(getAvatarExtra(generated)).not.toHaveProperty('headContrastColor')
    })

    it('should remember a component the style did not draw as "none"', () => {
      const generated = new DiceBearAvatar(
        getAvatarStyle(),
        getAvatarOptions({ accessoriesVariant: '', headVariant: 'pomp' }),
      )

      expect(getAvatarExtra(generated).accessoriesVariant).toBe('')
    })

    it('should rebuild an avatar without the components that were left out', () => {
      const options = { accessoriesVariant: '', facialHairVariant: 'chin' }
      const generated = new DiceBearAvatar(
        getAvatarStyle(),
        getAvatarOptions(options),
      )

      const rebuilt = new DiceBearAvatar(
        getAvatarStyle(),
        getAvatarOptions(normalizeStyleOptions(getAvatarExtra(generated))),
      )

      expect(rebuilt.toDataUri()).toBe(generated.toDataUri())
    })
  })
})

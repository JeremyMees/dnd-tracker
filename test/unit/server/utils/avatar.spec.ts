import { describe, expect, it } from 'vitest'
import { Avatar as DiceBearAvatar } from '@dicebear/core'

describe('avatar', () => {
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

  describe('generateAvatar', () => {
    it('should return the rendered avatar with the options DiceBear resolved', () => {
      const { url, extra } = generateAvatar({
        headVariant: 'pomp',
        skinColor: 'edb98a',
      })

      expect(url).toContain('data:image/svg+xml')
      expect(extra).toMatchObject({
        headVariant: 'pomp',
        skinColor: '#edb98a',
      })
    })

    it('should render the same avatar for the same options', () => {
      expect(generateAvatar({ headVariant: 'pomp' })).toEqual(
        generateAvatar({ headVariant: 'pomp' }),
      )
    })

    it('should render a different avatar for different options', () => {
      expect(generateAvatar({ headVariant: 'pomp' }).url).not.toBe(
        generateAvatar({ headVariant: 'afro' }).url,
      )
    })

    it('should rebuild the same avatar from the extra it returned', () => {
      const generated = generateAvatar({ headVariant: 'pomp' })

      expect(
        generateAvatar(
          normalizeStyleOptions(generated.extra as SelectedStyleOptions),
        ).url,
      ).toBe(generated.url)
    })
  })
})

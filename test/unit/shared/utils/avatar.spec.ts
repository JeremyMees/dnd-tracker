import { describe, expect, it } from 'vitest'

describe('avatar', () => {
  describe('getStyleOptions', () => {
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
})

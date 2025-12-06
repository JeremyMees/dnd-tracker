import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Card from '~/components/atoms/Card.vue'

describe('Card', () => {
  it('Should render correctly with default props', async () => {
    const component = await mountSuspended(Card)
    expect(component.html()).toMatchSnapshot()
  })

  it('Should render slot content', async () => {
    const component = await mountSuspended(Card, {
      slots: {
        default: '<p>Card content</p>',
      },
    })

    expect(component.text()).toContain('Card content')
  })

  describe('Color variants', () => {
    it.each([
      ['black', 'border-black', 'bg-black/50'],
      ['primary', 'border-primary', 'bg-primary/50'],
      ['tertiary', 'border-tertiary', 'bg-tertiary/50'],
      ['success', 'border-success', 'bg-success/50'],
      ['info', 'border-info', 'bg-info/50'],
      ['warning', 'border-warning', 'bg-warning/50'],
      ['danger', 'border-destructive', 'bg-destructive/50'],
      ['help', 'border-help', 'bg-help/50'],
      ['background', 'border-background', 'bg-foreground/50'],
      ['secondary', 'border-secondary', 'bg-secondary/50'],
    ])('Should apply correct classes for color "%s"', async (color, borderClass, bgClass) => {
      const component = await mountSuspended(Card, {
        props: { color: color as any },
      })

      expect(component.classes()).toContain(borderClass)
      expect(component.classes()).toContain(bgClass)
    })
  })

  describe('Round prop', () => {
    it('Should apply rounded-lg class when round is false', async () => {
      const component = await mountSuspended(Card, {
        props: { round: false },
      })

      expect(component.classes()).toContain('rounded-lg')
      expect(component.classes()).not.toContain('rounded-full')
    })

    it('Should apply rounded-full class when round is true', async () => {
      const component = await mountSuspended(Card, {
        props: { round: true },
      })

      expect(component.classes()).toContain('rounded-full')
      expect(component.classes()).not.toContain('rounded-lg')
    })
  })

  describe('NoPadding prop', () => {
    it('Should apply p-4 class when noPadding is false', async () => {
      const component = await mountSuspended(Card, {
        props: { noPadding: false },
      })

      expect(component.classes()).toContain('p-4')
    })

    it('Should not apply p-4 class when noPadding is true', async () => {
      const component = await mountSuspended(Card, {
        props: { noPadding: true },
      })

      expect(component.classes()).not.toContain('p-4')
    })
  })

  describe('NoStyling prop', () => {
    it('Should apply all styling classes when noStyling is false', async () => {
      const component = await mountSuspended(Card, {
        props: { noStyling: false },
      })

      expect(component.classes()).toContain('border-4')
      expect(component.classes()).toContain('rounded-lg')
      expect(component.classes()).toContain('p-4')
    })

    it('Should not apply any styling classes when noStyling is true', async () => {
      const component = await mountSuspended(Card, {
        props: { noStyling: true },
      })

      expect(component.classes()).not.toContain('border-4')
      expect(component.classes()).not.toContain('rounded-lg')
      expect(component.classes()).not.toContain('rounded-full')
      expect(component.classes()).not.toContain('p-4')
      expect(component.classes()).not.toContain('border-black')
    })
  })

  describe('As prop', () => {
    it('Should render as div by default', async () => {
      const component = await mountSuspended(Card)

      expect(component.element.tagName).toBe('DIV')
    })

    it('Should render as section when as prop is "section"', async () => {
      const component = await mountSuspended(Card, {
        props: { as: 'section' },
      })

      expect(component.element.tagName).toBe('SECTION')
    })

    it('Should render as article when as prop is "article"', async () => {
      const component = await mountSuspended(Card, {
        props: { as: 'article' },
      })

      expect(component.element.tagName).toBe('ARTICLE')
    })
  })
})

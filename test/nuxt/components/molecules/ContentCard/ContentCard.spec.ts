import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCard from '~/components/molecules/ContentCard/index.vue'
import {
  dndArmorFixture,
  dndConditionFixture,
  dndMagicItemFixture,
  dndSpellFixture,
  dndWeaponFixture,
} from '~~/test/fixtures/open5e'

interface Props {
  hit: DndItem
  type: Open5eType
  pinned?: boolean
  allowPin?: boolean
  variant?: 'secondary' | 'background'
}

const props: Props = {
  hit: dndSpellFixture,
  type: 'spells',
  allowPin: false,
  pinned: false,
  variant: 'secondary',
}

const contentTypes = [
  { name: 'spell', hit: dndSpellFixture, type: 'spells', body: 'spell' },
  {
    name: 'condition',
    hit: dndConditionFixture,
    type: 'conditions',
    body: 'condition',
  },
  {
    name: 'magic item',
    hit: dndMagicItemFixture,
    type: 'magicitems',
    body: 'magic-item',
  },
  { name: 'weapon', hit: dndWeaponFixture, type: 'weapons', body: 'weapon' },
  { name: 'armor', hit: dndArmorFixture, type: 'armor', body: 'armor' },
] as const

describe.each(contentTypes)('ContentCard - $name', ({ hit, type, body }) => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCard, {
      props: { ...props, hit, type },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the matching body component and title', async () => {
    const component = await mountSuspended(ContentCard, {
      props: { ...props, hit, type },
    })

    expect(component.find(`[test-id="${body}"]`).exists()).toBeTruthy()
    expect(component.find('[test-id="title"]').text()).toBe(hit.name)
  })

  it('Should render exactly one body component', async () => {
    const component = await mountSuspended(ContentCard, {
      props: { ...props, hit, type },
    })
    const bodies = contentTypes.filter(c =>
      component.find(`[test-id="${c.body}"]`).exists(),
    )

    expect(bodies.map(c => c.body)).toEqual([body])
  })
})

describe.each(contentTypes.filter(c => c.body !== 'armor'))(
  'ContentCard - $name (expanded)',
  ({ hit, type }) => {
    it('Should match snapshot when expanded', async () => {
      const component = await mountSuspended(ContentCard, {
        props: { ...props, hit, type },
      })

      await component.find('[test-id="toggle"]').trigger('click')
      await nextTick()

      expect(component.html()).toMatchSnapshot()
    })

    it('Should toggle between read more and read less', async () => {
      const component = await mountSuspended(ContentCard, {
        props: { ...props, hit, type },
      })
      const toggle = component.find('[test-id="toggle"]')

      expect(toggle.attributes('aria-label')).toBe('actions.readMore')

      await toggle.trigger('click')
      await nextTick()

      expect(toggle.attributes('aria-label')).toBe('actions.readLess')

      await toggle.trigger('click')
      await nextTick()

      expect(toggle.attributes('aria-label')).toBe('actions.readMore')
    })
  },
)

describe("ContentCard - 'armor'", async () => {
  it('Should not render a read more toggle', async () => {
    const component = await mountSuspended(ContentCard, {
      props: { ...props, hit: dndArmorFixture, type: 'armor' },
    })

    expect(component.find('[test-id="toggle"]').exists()).toBeFalsy()
  })
})

describe('ContentCard', async () => {
  it('Should render correct with default props', async () => {
    const component = await mountSuspended(ContentCard, { props })

    expect(component.find('[test-id="pin"]').exists()).toBeFalsy()
    expect(component.find('[test-id="title"]').text()).toBe(
      dndSpellFixture.name,
    )
  })

  it('Should show pin button when allowPin is true', async () => {
    const component = await mountSuspended(ContentCard, {
      props: { ...props, allowPin: true },
    })
    const pin = component.find('[test-id="pin"]')

    expect(pin.exists()).toBeTruthy()
  })

  it('Should be possible to pin and unpin', async () => {
    const component = await mountSuspended(ContentCard, {
      props: { ...props, allowPin: true },
    })
    const pin = component.find('[test-id="pin"]')

    expect(pin.exists()).toBeTruthy()
    expect(pin.attributes('aria-label')).toBe('components.infoCard.add')

    await pin.trigger('click')
    await nextTick()

    expect(component.emitted('pin')).toBeTruthy()

    await component.setProps({ pinned: true })
    await nextTick()

    expect(pin.attributes('aria-label')).toBe('components.infoCard.remove')

    await pin.trigger('click')
    await nextTick()

    expect(component.emitted('unpin')).toBeTruthy()

    await component.setProps({ pinned: false })
    await nextTick()

    expect(pin.attributes('aria-label')).toBe('components.infoCard.add')
  })
})

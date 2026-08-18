import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCardWeapon from '~/components/molecules/ContentCard/ContentCardWeapon.vue'
import { dndWeaponFixture } from '~~/test/fixtures/open5e'

interface Props {
  content: DndWeapon
  isOpen: boolean
}

const props: Props = {
  content: dndWeaponFixture,
  isOpen: false,
}

describe('ContentCardWeapon', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCardWeapon, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props', async () => {
    const component = await mountSuspended(ContentCardWeapon, { props })

    expect(component.text()).toContain('Damage: 1d8 (slashing)')
    expect(component.text()).toContain('Range: 0')
  })

  it('Should render properties when isOpen is true', async () => {
    const component = await mountSuspended(ContentCardWeapon, {
      props: { ...props, isOpen: true },
    })

    expect(component.text()).toContain('Topple')
    expect(component.text()).toContain('Versatile')
  })

  it('Should hide optional fields when they are not present', async () => {
    const content = {
      ...dndWeaponFixture,
      damageType: undefined,
      distanceUnit: undefined,
      isSimple: undefined,
      isImprovised: undefined,
    } as unknown as DndWeapon

    const component = await mountSuspended(ContentCardWeapon, {
      props: { content, isOpen: false },
    })

    expect(component.text()).not.toContain('(slashing)')
    expect(component.text()).not.toContain('feet')
    expect(component.text()).not.toContain('Simple Weapon')
    expect(component.text()).not.toContain('Improvised')
  })

  it('Should show alternate optional field values when present', async () => {
    const content: DndWeapon = {
      ...dndWeaponFixture,
      longRange: 20,
      isSimple: true,
      isImprovised: true,
    }

    const component = await mountSuspended(ContentCardWeapon, {
      props: { content, isOpen: false },
    })

    expect(component.text()).toContain('Range: 0/20')
    expect(component.text()).toContain('Simple Weapon: Yes')
    expect(component.text()).toContain('Improvised: Yes')
  })
})

import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCardWeapon from '~/components/molecules/ContentCard/ContentCardWeapon'
import { open5eWeaponFixture } from '~~/test/nuxt/fixtures/open5e'

interface Props {
  content: Open5eWeapon
  isOpen: boolean
}

const props: Props = {
  content: open5eWeaponFixture,
  isOpen: false,
}

describe('ContentCardWeapon', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCardWeapon, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props', async () => {
    const component = await mountSuspended(ContentCardWeapon, { props })

    expect(component.text()).toContain('Damage: 1d8 (Slashing)')
    expect(component.text()).toContain('Range: 0')
  })

  it('Should render properties when isOpen is true', async () => {
    const component = await mountSuspended(ContentCardWeapon, { props: { ...props, isOpen: true } })

    expect(component.text()).toContain('Topple')
    expect(component.text()).toContain('Versatile')
  })
})

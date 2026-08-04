import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ContentCardCondition from '~/components/molecules/ContentCard/ContentCardCondition.vue'
import { dndConditionFixture } from '~~/test/fixtures/open5e'

interface Props {
  content: DndCondition
  isOpen: boolean
}

const props: Props = {
  content: dndConditionFixture,
  isOpen: false,
}

describe('ContentCardCondition', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(ContentCardCondition, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the description clamped when collapsed', async () => {
    const component = await mountSuspended(ContentCardCondition, { props })
    const desc = component.find('[data-test-desc]')

    expect(desc.exists()).toBeTruthy()
    expect(desc.text()).toContain('A Blinded creature cannot see.')
    expect(desc.classes()).toContain('line-clamp-3')
  })

  it('Should render the description unclamped when isOpen is true', async () => {
    const component = await mountSuspended(ContentCardCondition, {
      props: { ...props, isOpen: true },
    })
    const desc = component.find('[data-test-desc]')

    expect(desc.text()).toContain('A Blinded creature cannot see.')
    expect(desc.classes()).not.toContain('line-clamp-3')
  })

  it('Should render nothing when the condition has no description', async () => {
    const component = await mountSuspended(ContentCardCondition, {
      props: { ...props, content: { ...dndConditionFixture, desc: '' } },
    })

    expect(component.find('[data-test-desc]').exists()).toBeFalsy()
  })
})

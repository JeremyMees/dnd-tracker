import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import FeatureRequestCard from '~/components/molecules/FeatureRequestCard'
import SocialProfile from '~~/test/unit/fixtures/social-profile.json'

interface Props {
  feature: FeatureRequest
}

const props: Props = {
  feature: {
    voted: {
      like: ['id1', 'id2'],
      dislike: ['id3', 'id4'],
    },
    created_by: SocialProfile,
    status: 'review',
    text: 'text',
    created_at: '2021-01-01',
    id: 1,
    title: 'title',
  },
}

describe('FeatureRequestCard', async () => {
  vi.mock('~/composables/useAuthentication', () => ({
    useAuthentication: () => ({
      user: ref({ id: 'test-user-id' }),
    }),
  }))

  it('Should match snapshot', async () => {
    const component = await mountSuspended(FeatureRequestCard, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props', async () => {
    const component = await mountSuspended(FeatureRequestCard, { props })

    expect(component.find('[data-test-title]').text()).toContain(props.feature.title)
    expect(component.find('[data-test-status]').text()).toBe(`pages.featureRequest.status.${props.feature.status}`)
    expect(component.find('[data-test-like-button]').exists()).toBeTruthy()
    expect(component.find('[data-test-like-button]').attributes('class')).not.toContain('bg-primary/50!')
    expect(component.find('[data-test-like-button]').attributes('class')).not.toContain('border-primary!')
    expect(component.find('[data-test-like-count]').text()).toBe(props.feature.voted.like.length.toString())
    expect(component.find('[data-test-dislike-button]').exists()).toBeTruthy()
    expect(component.find('[data-test-dislike-button]').attributes('class')).not.toContain('!bg-background/50 !border-background')
    expect(component.find('[data-test-dislike-count]').text()).toBe(props.feature.voted.dislike.length.toString())
    expect(component.find('[data-test-text]').text()).toBe(props.feature.text)
  })

  it('Should not render label when status is accepted', async () => {
    const component = await mountSuspended(FeatureRequestCard, { props: { ...props, feature: { ...props.feature, status: 'accepted' } } })

    expect(component.find('[data-test-status]').exists()).toBeFalsy()
  })

  it('Should disable vote buttons when status is added', async () => {
    const component = await mountSuspended(FeatureRequestCard, { props: { ...props, feature: { ...props.feature, status: 'added' } } })
    const likeButton = component.find('[data-test-like-button]')
    const dislikeButton = component.find('[data-test-dislike-button]')

    expect(likeButton.attributes().disabled).toBeDefined()
    expect(dislikeButton.attributes().disabled).toBeDefined()
  })

  it('Should be able to toggle vote', async () => {
    const component = await mountSuspended(FeatureRequestCard, { props })
    const likeButton = component.find('[data-test-like-button]')

    await likeButton.trigger('click')
    await nextTick()

    expect(component.emitted('update')?.[0]).toBeTruthy()

    await component.setProps({
      feature: {
        ...props.feature,
        voted: {
          like: [...props.feature.voted.like, 'test-user-id'],
          dislike: [...props.feature.voted.dislike],
        },
      },
    })

    expect(likeButton.attributes('class')).toContain('bg-primary/50!')
    expect(likeButton.attributes('class')).toContain('border-primary!')

    await likeButton.trigger('click')
    await nextTick()

    expect(component.emitted('update')?.[1]).toBeTruthy()

    await component.setProps({
      feature: {
        ...props.feature,
        voted: {
          like: props.feature.voted.like.filter(id => id !== 'test-user-id'),
          dislike: [...props.feature.voted.dislike],
        },
      },
    })

    expect(likeButton.attributes('class')).not.toContain('!bg-primary/50 !border-primary')
  })
})

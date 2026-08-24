import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import FeatureRequestCard from '~/components/molecules/FeatureRequestCard.vue'
import SocialProfile from '~~/test/fixtures/social-profile.json'

const mockUser = ref<{ id: string } | null>({ id: 'test-user-id' })

vi.mock('~/composables/useAuthentication', () => ({
  useAuthentication: () => ({
    user: mockUser,
  }),
}))

interface Props {
  feature: FeatureRequest
}

const props: Props = {
  feature: {
    voted: {
      like: ['id1', 'id2'],
      dislike: ['id3', 'id4'],
    },
    createdBy: SocialProfile,
    status: 'review',
    text: 'text',
    createdAt: '2021-01-01',
    id: 1,
    title: 'title',
  },
}

afterEach(() => {
  mockUser.value = { id: 'test-user-id' }
})

describe('FeatureRequestCard', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(FeatureRequestCard, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render correct with default props', async () => {
    const component = await mountSuspended(FeatureRequestCard, { props })

    expect(component.find('[test-id="title"]').text()).toContain(
      props.feature.title,
    )
    expect(component.find('[test-id="status"]').text()).toBe(
      `pages.featureRequest.status.${props.feature.status}`,
    )
    expect(component.find('[test-id="like-button"]').exists()).toBeTruthy()
    expect(
      component.find('[test-id="like-button"]').attributes('class'),
    ).not.toContain('bg-primary/50!')
    expect(
      component.find('[test-id="like-button"]').attributes('class'),
    ).not.toContain('border-primary!')
    expect(component.find('[test-id="like-count"]').text()).toBe(
      props.feature.voted.like.length.toString(),
    )
    expect(component.find('[test-id="dislike-button"]').exists()).toBeTruthy()
    expect(
      component.find('[test-id="dislike-button"]').attributes('class'),
    ).not.toContain('!bg-background/50 !border-background')
    expect(component.find('[test-id="dislike-count"]').text()).toBe(
      props.feature.voted.dislike.length.toString(),
    )
    expect(component.find('[test-id="text"]').text()).toBe(props.feature.text)
  })

  it('Should not render label when status is accepted', async () => {
    const component = await mountSuspended(FeatureRequestCard, {
      props: { ...props, feature: { ...props.feature, status: 'accepted' } },
    })

    expect(component.find('[test-id="status"]').exists()).toBeFalsy()
  })

  it('Should disable vote buttons when status is added', async () => {
    const component = await mountSuspended(FeatureRequestCard, {
      props: { ...props, feature: { ...props.feature, status: 'added' } },
    })
    const likeButton = component.find('[test-id="like-button"]')
    const dislikeButton = component.find('[test-id="dislike-button"]')

    expect(likeButton.attributes().disabled).toBeDefined()
    expect(dislikeButton.attributes().disabled).toBeDefined()
  })

  it('Should be able to toggle vote', async () => {
    const component = await mountSuspended(FeatureRequestCard, { props })
    const likeButton = component.find('[test-id="like-button"]')

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

    expect(likeButton.attributes('class')).not.toContain(
      '!bg-primary/50 !border-primary',
    )
  })

  it('Should be able to toggle dislike vote', async () => {
    const component = await mountSuspended(FeatureRequestCard, { props })
    const dislikeButton = component.find('[test-id="dislike-button"]')

    await dislikeButton.trigger('click')
    await nextTick()

    expect(component.emitted('update')?.[0]).toEqual(['dislike'])

    await component.setProps({
      feature: {
        ...props.feature,
        voted: {
          like: [...props.feature.voted.like],
          dislike: [...props.feature.voted.dislike, 'test-user-id'],
        },
      },
    })

    expect(dislikeButton.attributes('class')).toContain('bg-primary/50!')

    await dislikeButton.trigger('click')
    await nextTick()

    expect(component.emitted('update')?.[1]).toEqual([null])
  })

  it('Should move a like vote to dislike when the opposite is toggled', async () => {
    const component = await mountSuspended(FeatureRequestCard, {
      props: {
        ...props,
        feature: {
          ...props.feature,
          voted: {
            like: [...props.feature.voted.like, 'test-user-id'],
            dislike: [...props.feature.voted.dislike],
          },
        },
      },
    })
    const dislikeButton = component.find('[test-id="dislike-button"]')

    await dislikeButton.trigger('click')
    await nextTick()

    expect(component.emitted('update')?.[0]).toEqual(['dislike'])
  })

  it('Should emit login instead of toggling a vote when there is no user', async () => {
    mockUser.value = null

    const component = await mountSuspended(FeatureRequestCard, { props })
    const likeButton = component.find('[test-id="like-button"]')
    const dislikeButton = component.find('[test-id="dislike-button"]')

    await likeButton.trigger('click')
    await nextTick()

    expect(component.emitted('login')?.[0]).toBeTruthy()
    expect(component.emitted('update')).toBeFalsy()

    await dislikeButton.trigger('click')
    await nextTick()

    expect(component.emitted('login')?.[1]).toBeTruthy()
    expect(component.emitted('update')).toBeFalsy()
  })
})

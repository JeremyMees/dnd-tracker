import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Select } from '~/components/ui/select'
import FeatureRequestPage from '~/pages/updates/feature-request.vue'
import { authUser } from '~~/test/fixtures/auth-user'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { navigateTo, open, scrollToId, useSeo, vote } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  open: vi.fn(),
  scrollToId: vi.fn(),
  useSeo: vi.fn(),
  vote: vi.fn(),
}))

let filters: ComputedRef<SbFilter> | undefined

vi.mock('~~/queries/features', () => ({
  useFeatureListing: (input: ComputedRef<SbFilter>) => {
    filters = input
    return { data, status }
  },
  useFeatureVote: () => ({ mutateAsync: vote }),
}))

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('scrollToId', () => scrollToId)
mockNuxtImport('useModal', () => () => ({ open }))
mockNuxtImport('useAuthentication', () => () => ({ user }))

const user = ref<AuthUser | null>(null)
const data = ref<{ features: FeatureRequest[]; pages: number } | undefined>()
const status = ref<'pending' | 'success' | 'error'>('success')

const defaultCreatedBy: FeatureRequest['createdBy'] = {
  id: authUser.id,
  email: authUser.email,
  name: authUser.name,
  username: authUser.username,
  avatar: authUser.avatar,
  completedTour: authUser.completedTour,
  createdAt: authUser.createdAt,
}

function makeFeature(overrides: Partial<FeatureRequest> = {}): FeatureRequest {
  return {
    id: 1,
    title: 'Add dark mode',
    text: 'Please add a dark mode toggle',
    status: 'accepted',
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: defaultCreatedBy,
    voted: { like: [], dislike: [] },
    ...overrides,
  }
}

const FeatureRequestCardStub = defineComponent({
  name: 'FeatureRequestCardStub',
  props: ['feature'],
  emits: ['update', 'login'],
  template: '<div data-test-feature-card>{{ feature.id }}</div>',
})

const SkeletonFeatureRequestCardStub = defineComponent({
  name: 'SkeletonFeatureRequestCardStub',
  template: '<div data-test-skeleton />',
})

const PaginationStub = defineComponent({
  name: 'PaginationStub',
  props: ['page', 'pages', 'perPage', 'styles'],
  emits: ['paginate'],
  template: '<div data-test-pagination />',
})

const stubs = {
  NuxtLayout: nuxtLayoutStub,
  FeatureRequestCard: FeatureRequestCardStub,
  SkeletonFeatureRequestCard: SkeletonFeatureRequestCardStub,
  Pagination: PaginationStub,
}

async function mountPage() {
  const component = await mountSuspended(FeatureRequestPage, {
    global: { stubs },
  })

  await flushPromises()

  return {
    component,
    get featureCards() {
      return component.findAll('[data-test-feature-card]')
    },
    get card() {
      return component.findComponent({ name: 'FeatureRequestCardStub' })
    },
    get pagination() {
      return component.findComponent({ name: 'PaginationStub' })
    },
    async search(value: string) {
      await component.get('[data-test-search]').setValue(value)
    },
    async selectFilter(value: 'all' | 'my') {
      await component.findComponent(Select).vm.$emit('update:modelValue', value)
    },
    async clickRequest() {
      await component.get('[data-test-request]').trigger('click')
    },
  }
}

describe('Feature request page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    user.value = null
    data.value = undefined
    status.value = 'success'
    filters = undefined

    vote.mockResolvedValue(undefined)
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Feature request')
  })

  it('Should query the listing sorted by newest with no filters by default', async () => {
    await mountPage()

    expect(filters?.value).toEqual({
      search: '',
      sortBy: 'createdAt',
      sortDesc: true,
      page: 0,
      eq: undefined,
    })
  })

  it('Should debounce the search input before querying', async () => {
    const { search } = await mountPage()

    vi.useFakeTimers()

    await search('dark mode')

    expect(filters?.value.search).toBe('')

    await vi.advanceTimersByTimeAsync(600)

    expect(filters?.value.search).toBe('dark mode')

    vi.useRealTimers()
  })

  it('Should not filter by author when no user is signed in', async () => {
    const { selectFilter } = await mountPage()

    await selectFilter('my')

    expect(filters?.value.eq).toBeUndefined()
  })

  it('Should filter by the signed in user when "my" is selected', async () => {
    user.value = { ...authUser }

    const { selectFilter } = await mountPage()

    await selectFilter('my')

    expect(filters?.value.eq).toEqual({
      field: 'createdBy',
      value: authUser.id,
    })
  })

  it('Should show a skeleton while the initial listing is pending', async () => {
    status.value = 'pending'

    const { component, featureCards } = await mountPage()

    expect(component.findAll('[data-test-skeleton]')).toHaveLength(2)
    expect(featureCards).toHaveLength(0)
  })

  it('Should render a card for every feature request', async () => {
    data.value = {
      features: [makeFeature({ id: 1 }), makeFeature({ id: 2 })],
      pages: 1,
    }

    const { featureCards } = await mountPage()

    expect(featureCards).toHaveLength(2)
  })

  it('Should hide a feature under review created by someone else', async () => {
    user.value = { ...authUser }
    data.value = {
      features: [
        makeFeature({
          id: 1,
          status: 'review',
          createdBy: {
            ...defaultCreatedBy,
            id: 'someone-else',
            username: 'frodo',
          },
        }),
      ],
      pages: 1,
    }

    const { featureCards } = await mountPage()

    expect(featureCards).toHaveLength(0)
  })

  it('Should show a feature under review created by the current user', async () => {
    user.value = { ...authUser }
    data.value = {
      features: [makeFeature({ id: 1, status: 'review' })],
      pages: 1,
    }

    const { featureCards } = await mountPage()

    expect(featureCards).toHaveLength(1)
  })

  it('Should vote when the feature card emits an update', async () => {
    data.value = { features: [makeFeature({ id: 5 })], pages: 1 }

    const { card } = await mountPage()

    await card.vm.$emit('update', { like: [authUser.id], dislike: [] })

    expect(vote).toHaveBeenCalledWith({
      id: 5,
      votes: { like: [authUser.id], dislike: [] },
    })
  })

  it('Should navigate to login when the feature card emits login', async () => {
    data.value = { features: [makeFeature({ id: 5 })], pages: 1 }

    const { card } = await mountPage()

    await card.vm.$emit('login')

    expect(navigateTo).toHaveBeenCalledWith('/login')
  })

  it('Should render pagination when there is more than one page', async () => {
    data.value = { features: [makeFeature()], pages: 2 }

    const { component } = await mountPage()

    expect(component.find('[data-test-pagination]').exists()).toBe(true)
  })

  it('Should not render pagination for a single page', async () => {
    data.value = { features: [makeFeature()], pages: 1 }

    const { component } = await mountPage()

    expect(component.find('[data-test-pagination]').exists()).toBe(false)
  })

  it('Should update the page and scroll when pagination emits paginate', async () => {
    data.value = { features: [makeFeature()], pages: 2 }

    const { pagination } = await mountPage()

    await pagination.vm.$emit('paginate', 1)
    await flushPromises()

    expect(scrollToId).toHaveBeenCalledWith('el')
    expect(filters?.value.page).toBe(1)
  })

  it('Should show a CTA to add a feature when there is nothing to show', async () => {
    data.value = { features: [], pages: 0 }

    const { component } = await mountPage()

    expect(component.get('[data-test-cta]').text()).toContain(
      'pages.featureRequest.cta.title',
    )
    expect(component.find('[data-test-nothing]').exists()).toBe(false)
  })

  it('Should show a "nothing found" message when a search yields no results', async () => {
    data.value = { features: [], pages: 0 }

    const { component, search } = await mountPage()

    await search('nonexistent')

    expect(component.get('[data-test-nothing]').text()).toBe(
      'pages.featureRequest.nothing',
    )
    expect(component.find('[data-test-cta]').exists()).toBe(false)
  })

  it('Should show a "nothing found" message when the "my" filter yields no results', async () => {
    user.value = { ...authUser }
    data.value = { features: [], pages: 0 }

    const { component, selectFilter } = await mountPage()

    await selectFilter('my')

    expect(component.get('[data-test-nothing]').text()).toBe(
      'pages.featureRequest.nothing',
    )
    expect(component.find('[data-test-cta]').exists()).toBe(false)
  })

  it('Should open the request modal when a signed in user clicks request', async () => {
    user.value = { ...authUser }

    const { clickRequest } = await mountPage()

    await clickRequest()

    expect(open).toHaveBeenCalledWith({
      component: 'FeatureRequest',
      header: 'components.addFeatureRequestModal.title',
    })
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should navigate to login when a signed out visitor clicks request', async () => {
    const { clickRequest } = await mountPage()

    await clickRequest()

    expect(navigateTo).toHaveBeenCalledWith('/login')
    expect(open).not.toHaveBeenCalled()
  })

  it('Should disable the search, filter and request button while pending', async () => {
    status.value = 'pending'

    const { component } = await mountPage()

    expect(
      component.get('[data-test-search]').attributes('disabled'),
    ).toBeDefined()
    expect(
      component.get('[data-test-request]').attributes('disabled'),
    ).toBeDefined()
    expect(component.findComponent(Select).props('disabled')).toBe(true)
  })
})

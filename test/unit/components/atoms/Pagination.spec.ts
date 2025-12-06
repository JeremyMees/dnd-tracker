import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach } from 'vitest'
import Pagination from '~/components/atoms/Pagination.vue'
import { Pagination as UiPagination } from '~/components/ui/pagination'

const props = {
  pages: 5,
  page: 0,
}

describe('Pagination', async () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(Pagination, { props })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should have correct default props', async () => {
    const component = await mountSuspended(Pagination, { props })

    expect(component.props('perPage')).toBe(10)
    expect(component.props('styles')).toBe('')
    expect(component.props('loading')).toBe(false)
  })

  it('Should accept pages prop', async () => {
    const component = await mountSuspended(Pagination, {
      props: {
        ...props,
        pages: 10,
      },
    })

    expect(component.props('pages')).toBe(10)
  })

  it('Should accept perPage prop', async () => {
    const component = await mountSuspended(Pagination, {
      props: {
        ...props,
        perPage: 20,
      },
    })

    expect(component.props('perPage')).toBe(20)
  })

  it('Should accept loading prop', async () => {
    const component = await mountSuspended(Pagination, {
      props: {
        ...props,
        loading: true,
      },
    })

    expect(component.props('loading')).toBe(true)
  })

  it('Should convert 0-based page to 1-based for display', async () => {
    const component = await mountSuspended(Pagination, { props })

    const pagination = component.findComponent(UiPagination)
    expect(pagination.props('page')).toBe(1)
  })

  it('Should emit paginate event with 0-based page number', async () => {
    const component = await mountSuspended(Pagination, { props })

    const pagination = component.findComponent(UiPagination)
    await pagination.vm.$emit('update:page', 3)

    expect(component.emitted('paginate')).toBeTruthy()
    expect(component.emitted('paginate')![0]).toEqual([2])
  })

  it('Should disable pagination when loading is true', async () => {
    const component = await mountSuspended(Pagination, {
      props: {
        ...props,
        loading: true,
      },
    })

    const pagination = component.findComponent(UiPagination)
    expect(pagination.props('disabled')).toBe(true)
  })

  it('Should not disable pagination when loading is false', async () => {
    const component = await mountSuspended(Pagination, {
      props: {
        ...props,
        loading: false,
      },
    })

    const pagination = component.findComponent(UiPagination)
    expect(pagination.props('disabled')).toBe(false)
  })

  it('Should update page model when internal page changes', async () => {
    const page = ref(0)
    const component = await mountSuspended(Pagination, {
      props: {
        ...props,
        page: page.value,
      },
    })

    const pagination = component.findComponent(UiPagination)
    await pagination.vm.$emit('update:page', 4)

    expect(component.emitted('update:page')).toBeTruthy()
    expect(component.emitted('update:page')![0]).toEqual([3])
  })
})

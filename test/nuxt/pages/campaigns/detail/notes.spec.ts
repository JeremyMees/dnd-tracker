import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Notes from '~/pages/campaigns/[id]-[title]/notes.vue'
import { campaignPageProps } from '~~/test/fixtures/campaign'
import { mockNote } from '~~/test/fixtures/note'
import { createListingStubs, tableState } from '~~/test/nuxt/stubs/table'

const {
  ask,
  expandedMarkup,
  fetchMock,
  initialState,
  invalidateQueries,
  open,
  removeNote,
  startCoolDown,
  toast,
  useSeo,
} = vi.hoisted(() => ({
  ask: vi.fn(),
  expandedMarkup: () => undefined,
  fetchMock: vi.fn(),
  initialState: { sorting: [{ id: 'createdAt', desc: true }] },
  invalidateQueries: vi.fn(),
  open: vi.fn(),
  removeNote: vi.fn(),
  startCoolDown: vi.fn(),
  toast: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ invalidateQueries }),
}))

const count = ref<number | undefined>(1)
const data = ref<{
  notes: NoteRow[] | null
  pages: number
  amount: number
}>({ notes: [mockNote], pages: 3, amount: 1 })
const status = ref<'pending' | 'success' | 'error'>('success')

let filter: ComputedRef<SbFilter> | undefined
let countEnabled: ComputedRef<boolean> | undefined
let listingEnabled: ComputedRef<boolean> | undefined
let listingPageSize: number | undefined
let countCampaign: number | undefined

vi.mock('~/queries/notes', () => ({
  useNoteCount: (id: number, enabled: ComputedRef<boolean>) => {
    countCampaign = id
    countEnabled = enabled

    return { data: count }
  },
  useNoteListing: (
    listing: ComputedRef<SbFilter>,
    enabled: ComputedRef<boolean>,
    pageSize: number,
  ) => {
    filter = listing
    listingEnabled = enabled
    listingPageSize = pageSize

    return { data, status }
  },
  useNoteRemove: () => ({ mutateAsync: removeNote }),
}))

interface ColumnOptions {
  onUpdate: (item: NoteRow) => void
  onSendMail: (item: NoteRow) => void
  hasRights: boolean
  isInCoolDown: (id: number) => boolean
  getRemainingTime: (id: number) => number
}

let columnOptions: ColumnOptions | undefined

vi.mock('~/tables/note-listing', () => ({
  generateColumns: (options: ColumnOptions) => {
    columnOptions = options

    return []
  },
  expandedMarkup,
  initialState,
}))

const isInCoolDown = vi.fn(() => false)
const getRemainingTime = vi.fn(() => 0)

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('useModal', () => () => ({ open }))
mockNuxtImport('useConfirm', () => () => ({ ask }))
mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('useCoolDown', () => () => ({
  startCoolDown,
  isInCoolDown,
  getRemainingTime,
}))

const listingStubs = createListingStubs()

let mounted: VueWrapper | undefined

async function mountPage(overrides: Partial<typeof campaignPageProps> = {}) {
  const component = await mountSuspended(Notes, {
    props: { ...campaignPageProps, ...overrides },
    global: { stubs: listingStubs.stubs },
  })

  mounted = component

  await flushPromises()

  return {
    component,
    get table() {
      return component.findComponent(listingStubs.DataTable)
    },
    get contentCount() {
      return component.findComponent(listingStubs.ContentCount)
    },
    get createButton() {
      return component.findComponent(listingStubs.CreateButton)
    },
    async create() {
      component.findComponent(listingStubs.CreateButton).vm.$emit('create')

      await flushPromises()
    },
    async remove(ids: number[]) {
      component.findComponent(listingStubs.DataTable).vm.$emit('remove', ids)

      await flushPromises()
    },
  }
}

function confirmCallback(): (confirmed: boolean) => Promise<void> {
  return ask.mock.calls[0]![1]
}

function mailSend(): (addresses: string[]) => Promise<void> {
  return open.mock.calls[0]![0].props.send
}

describe('Campaign notes page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    count.value = 1
    data.value = { notes: [mockNote], pages: 3, amount: 1 }
    status.value = 'success'
    listingStubs.state.value = tableState(20)

    fetchMock.mockResolvedValue(undefined)
    removeNote.mockResolvedValue(undefined)
  })

  afterEach(() => {
    mounted?.unmount()
    mounted = undefined
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Campaign notes')
  })

  it('Should pass the notes of the listing to the table', async () => {
    const { table } = await mountPage()

    expect(table.props('data')).toEqual([mockNote])
    expect(table.props('total')).toBe(1)
    expect(table.props('pageSize')).toBe(20)
    expect(table.props('loading')).toBe(false)
    expect(table.props('options')).toEqual({ pageCount: 3, initialState })
    expect(table.props('expandedMarkup')).toBe(expandedMarkup)
    expect(table.props('emptyMessage')).toBe('components.table.nothing')
  })

  it('Should give the table an empty listing until the notes arrive', async () => {
    data.value = { notes: null, pages: -1, amount: 0 }
    status.value = 'pending'

    const { table } = await mountPage()

    expect(table.props('data')).toEqual([])
    expect(table.props('total')).toBe(0)
    expect(table.props('loading')).toBe(true)
  })

  it('Should fill the loading table with skeleton rows', async () => {
    status.value = 'pending'

    const { component } = await mountPage()

    expect(component.findAll('[test-id="skeleton-row"]')).toHaveLength(10)
  })

  it('Should scope the listing and the count to the campaign', async () => {
    await mountPage()

    expect(countCampaign).toBe(campaignPageProps.campaignId)
    expect(listingPageSize).toBe(20)
    expect(filter?.value).toEqual({
      search: '',
      sortBy: 'createdAt',
      sortDesc: true,
      page: 0,
      eq: { field: 'campaign', value: campaignPageProps.campaignId },
    })
  })

  it('Should ask the listing for the state of the table', async () => {
    await mountPage()

    listingStubs.state.value = {
      pagination: { pageIndex: 2, pageSize: 20 },
      sorting: [{ id: 'title', desc: false }],
      globalFilter: 'tavern',
    }

    await flushPromises()

    expect(filter?.value).toEqual(
      expect.objectContaining({
        search: 'tavern',
        sortBy: 'title',
        sortDesc: false,
        page: 2,
      }),
    )
  })

  it('Should only fetch once the parent page is ready', async () => {
    await mountPage({ fetchReady: false })

    expect(countEnabled?.value).toBe(false)
    expect(listingEnabled?.value).toBe(false)
  })

  it('Should not let a member modify the notes', async () => {
    const { table } = await mountPage()

    expect(table.props('permission')).toBe(false)
    expect(columnOptions?.hasRights).toBe(false)
  })

  it('Should let an admin modify the notes', async () => {
    const { table } = await mountPage({ isAdmin: true })

    expect(table.props('permission')).toBe(true)
    expect(columnOptions?.hasRights).toBe(true)
  })

  it('Should let an owner modify the notes', async () => {
    const { table } = await mountPage({ isOwner: true })

    expect(table.props('permission')).toBe(true)
    expect(columnOptions?.hasRights).toBe(true)
  })

  it('Should give the columns the cool down of the mails', async () => {
    await mountPage()

    expect(columnOptions?.isInCoolDown).toBe(isInCoolDown)
    expect(columnOptions?.getRemainingTime).toBe(getRemainingTime)
  })

  it('Should count the notes against the maximum', async () => {
    const { contentCount, createButton } = await mountPage({ isAdmin: true })

    expect(contentCount.props('count')).toBe(1)
    expect(contentCount.props('max')).toBe(100)
    expect(createButton.props('allowCreate')).toBe(true)
  })

  it('Should not allow creating a note on the maximum', async () => {
    count.value = 100

    const { createButton } = await mountPage({ isAdmin: true })

    expect(createButton.props('allowCreate')).toBe(false)
  })

  it('Should not allow creating a note while the count is unknown', async () => {
    count.value = undefined

    const { createButton } = await mountPage({ isAdmin: true })

    expect(createButton.props('allowCreate')).toBe(false)
  })

  it('Should hide the create button without owner or admin rights', async () => {
    const { createButton } = await mountPage()

    expect(createButton.exists()).toBe(false)
  })

  it('Should open the new note modal when creating', async () => {
    const { create } = await mountPage({ isAdmin: true })

    await create()

    expect(open).toHaveBeenCalledWith({
      component: 'Note',
      header: 'components.noteModal.new',
      props: { campaignId: campaignPageProps.campaignId },
    })
  })

  it('Should open the update modal with the note of the row', async () => {
    await mountPage()

    columnOptions?.onUpdate(mockNote)

    expect(open).toHaveBeenCalledWith({
      component: 'Note',
      header: 'components.noteModal.update',
      props: { campaignId: campaignPageProps.campaignId, note: mockNote },
    })
  })

  it('Should open the mail modal for the note of the row', async () => {
    await mountPage()

    columnOptions?.onSendMail(mockNote)

    expect(open).toHaveBeenCalledWith({
      component: 'Mail',
      header: 'components.mailModal.title',
      subHeader: mockNote.title,
      props: { send: expect.any(Function) },
    })
  })

  it('Should mail the note to every address', async () => {
    await mountPage()

    columnOptions?.onSendMail(mockNote)

    await mailSend()(['frodo@shire.com', 'sam@shire.com'])

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledWith('/api/emails/share-note', {
      method: 'POST',
      body: { noteId: mockNote.id, email: 'frodo@shire.com' },
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/emails/share-note', {
      method: 'POST',
      body: { noteId: mockNote.id, email: 'sam@shire.com' },
    })
  })

  it('Should start a cool down and toast when the mails are sent', async () => {
    await mountPage()

    columnOptions?.onSendMail(mockNote)

    await mailSend()(['frodo@shire.com'])

    expect(startCoolDown).toHaveBeenCalledWith(mockNote.id, 15)
    expect(toast).toHaveBeenCalledWith({
      description: 'general.mail.success.title',
      variant: 'success',
    })
  })

  it('Should not mail the note without a campaign', async () => {
    await mountPage({ current: undefined })

    columnOptions?.onSendMail(mockNote)

    await mailSend()(['frodo@shire.com'])

    expect(fetchMock).not.toHaveBeenCalled()
    expect(startCoolDown).toHaveBeenCalledWith(mockNote.id, 15)
  })

  it('Should toast and skip the cool down when a mail fails', async () => {
    fetchMock.mockRejectedValue(new Error('Boom'))

    await mountPage()

    columnOptions?.onSendMail(mockNote)

    await mailSend()(['frodo@shire.com'])

    expect(startCoolDown).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
  })

  it('Should ask for confirmation before removing the selected notes', async () => {
    const { remove } = await mountPage()

    await remove([1, 2])

    expect(ask).toHaveBeenCalledWith({}, expect.any(Function))
    expect(removeNote).not.toHaveBeenCalled()
  })

  it('Should remove the selected notes when the confirmation is accepted', async () => {
    const { remove } = await mountPage()

    await remove([1, 2])
    await confirmCallback()(true)

    expect(removeNote).toHaveBeenCalledWith({ id: [1, 2] })
  })

  it('Should keep the selected notes when the confirmation is declined', async () => {
    const { remove } = await mountPage()

    await remove([1, 2])
    await confirmCallback()(false)

    expect(removeNote).not.toHaveBeenCalled()
  })

  it('Should invalidate the listing and the count when the table asks for it', async () => {
    const { component } = await mountPage()

    component.findComponent(listingStubs.DataTable).vm.$emit('invalidate')

    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useNoteListing'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useNoteCount'],
    })
  })

  it('Should offer a refresh when the listing fails', async () => {
    status.value = 'error'

    const { component } = await mountPage()

    expect(component.find('[test-id="refresh"]').exists()).toBe(true)

    component.findComponent(listingStubs.RefreshCard).vm.$emit('refresh')

    await flushPromises()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['useNoteListing'],
    })
  })

  it('Should not offer a refresh while the listing works', async () => {
    const { component } = await mountPage()

    expect(component.find('[test-id="refresh"]').exists()).toBe(false)
  })
})

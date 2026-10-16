export interface TableState {
  pagination: { pageIndex: number; pageSize: number }
  sorting: { id: string; desc: boolean }[]
  globalFilter: string | undefined
}

export function tableState(pageSize = 10): TableState {
  return {
    pagination: { pageIndex: 0, pageSize },
    sorting: [],
    globalFilter: '',
  }
}

export function createListingStubs({
  state = ref(tableState()),
  show = () => {},
}: {
  state?: Ref<TableState>
  show?: () => void
} = {}) {
  const DataTable = defineComponent({
    name: 'DataTableStub',
    props: {
      columns: null,
      data: null,
      loading: null,
      options: null,
      permission: null,
      emptyMessage: null,
      expandedMarkup: null,
      pageSize: null,
      total: null,
      exportable: Boolean,
    },
    emits: ['remove', 'export', 'invalidate'],
    setup(props, { expose, slots }) {
      expose({
        vueTable: {
          atoms: {
            globalFilter: { get: () => state.value.globalFilter },
            pagination: { get: () => state.value.pagination },
            sorting: { get: () => state.value.sorting },
          },
        },
      })

      return () =>
        h('div', { 'test-id': 'table' }, [
          slots.top?.(),
          props.loading ? slots.loading?.() : undefined,
        ])
    },
  })

  const LimitCta = defineComponent({
    name: 'LimitCtaStub',
    setup(_props, { expose }) {
      expose({ show })

      return () => h('div', { 'test-id': 'limit' })
    },
  })

  const ContentCount = defineComponent({
    name: 'ContentCountStub',
    props: ['count', 'max', 'loading'],
    template: '<div test-id="content-count" />',
  })

  const CreateButton = defineComponent({
    name: 'CreateButtonStub',
    props: ['allowCreate', 'disabled', 'loading'],
    emits: ['create', 'hitLimit'],
    template: '<div test-id="create" />',
  })

  const ImportButton = defineComponent({
    name: 'ImportButtonStub',
    props: ['disabled', 'loading', 'accept'],
    emits: ['import'],
    template: '<div test-id="import" />',
  })

  const RefreshCard = defineComponent({
    name: 'RefreshCardStub',
    emits: ['refresh'],
    template: '<div test-id="refresh" />',
  })

  const skeletonRow = { template: '<div test-id="skeleton-row" />' }

  return {
    DataTable,
    LimitCta,
    ContentCount,
    CreateButton,
    ImportButton,
    RefreshCard,
    state,
    stubs: {
      AnimationExpand: { template: '<div><slot /></div>' },
      ContentCount,
      CreateButton,
      DataTable,
      ImportButton,
      LimitCta,
      RefreshCard,
      SkeletonCampaignTableRow: skeletonRow,
      SkeletonEncounterTableRow: skeletonRow,
      SkeletonHomebrewTableRow: skeletonRow,
      SkeletonNoteTableRow: skeletonRow,
    },
  }
}

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
    props: [
      'columns',
      'data',
      'loading',
      'options',
      'permission',
      'emptyMessage',
      'expandedMarkup',
      'pageSize',
      'total',
    ],
    emits: ['remove', 'invalidate'],
    setup(props, { expose, slots }) {
      expose({ vueTable: { getState: () => state.value } })

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
    RefreshCard,
    state,
    stubs: {
      AnimationExpand: { template: '<div><slot /></div>' },
      ContentCount,
      CreateButton,
      DataTable,
      LimitCta,
      RefreshCard,
      SkeletonCampaignTableRow: skeletonRow,
      SkeletonHomebrewTableRow: skeletonRow,
      SkeletonNoteTableRow: skeletonRow,
    },
  }
}

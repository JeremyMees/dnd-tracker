<script lang="ts" setup>
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'
import type { DataTable } from '#components'
import { generateColumns, expandedMarkup, initialState } from '~/tables/note-listing'

const props = defineProps<{
  current?: CampaignFull
  campaignId: number
  isAdmin: boolean
  isOwner: boolean
  fetchReady: boolean
}>()

const { toast } = useToast()
const modal = useModal()
const user = useAuthenticatedUser()
const { ask } = useConfirm()
const { t } = useI18n()
const { startCoolDown, isInCoolDown, getRemainingTime } = useCoolDown()
const queryClient = useQueryClient()

const table = ref<InstanceType<typeof DataTable>>()
const max = 100

const hasRights = computed(() => props.isOwner || props.isAdmin)
const enableDateFetching = computed(() => props.fetchReady)

const { data: count } = useNoteCount(props.campaignId, enableDateFetching)
const { mutateAsync: removeNote } = useNoteRemove()

const { data, status } = useNoteListing(computed(() => {
  const pagination = table.value?.vueTable.getState().pagination
  const sorting = table.value?.vueTable.getState().sorting
  const search = table.value?.vueTable.getState().globalFilter

  return {
    search,
    sortBy: sorting?.length ? sorting[0].id : initialState.sorting?.[0]?.id,
    sortDesc: sorting?.length ? sorting[0].desc : initialState.sorting?.[0]?.desc,
    page: pagination ? pagination.pageIndex : 0,
    eq: { field: 'campaign', value: props.campaignId },
  }
}), enableDateFetching)

const columns = generateColumns({
  onUpdate: (item: NoteRow) => openModal(item),
  onSendMail: (item: NoteRow) => openMailModal(item),
  hasRights: hasRights.value,
  isInCoolDown,
  getRemainingTime,
})

function openModal(item?: NoteRow): void {
  modal.open({
    component: 'Note',
    header: t(`components.noteModal.${item ? 'update' : 'new'}`),
    submit: t(`components.noteModal.${item ? 'update' : 'add'}`),
    props: {
      campaignId: props.campaignId,
      ...(item && { note: item }),
    },
  })
}

function openMailModal(item: NoteRow): void {
  modal.open({
    component: 'Mail',
    header: t('components.mailModal.title', { type: t('general.note').toLowerCase() }),
    subHeader: item.title,
    submit: t('actions.sendMail'),
    props: {
      send: (addresses: string[]) => sendNoteAsMail(item, addresses),
    },
  })
}

async function removeItems(ids: number[]): Promise<void> {
  ask({}, async (confirmed: boolean) => {
    if (confirmed) await removeNote({ id: ids })
  })
}

function invalidateQueries(): void {
  queryClient.invalidateQueries({ queryKey: ['useNoteListing'] })
  queryClient.invalidateQueries({ queryKey: ['useNoteCount'] })
}

async function sendNoteAsMail(note: NoteRow, addresses: string[]): Promise<void> {
  try {
    await Promise.all(addresses.map(async (email) => {
      if (!props.current) return

      await $fetch('/api/emails/share-note', {
        method: 'POST',
        body: {
          email,
          noteContent: note.text,
          noteTitle: note.title,
          campaign: props.current.title,
          sharedBy: user.value.username,
        },
      })
    }))

    startCoolDown(note.id, 15)

    toast({
      description: t('general.mail.success.title'),
      variant: 'success',
    })
  }
  catch (err) {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <div>
    <AnimationExpand>
      <RefreshCard
        v-if="status === 'error'"
        @refresh="invalidateQueries"
      />
    </AnimationExpand>

    <DataTable
      ref="table"
      :columns="columns"
      :data="data?.notes || []"
      :total="data?.amount || 0"
      :loading="status === 'pending'"
      :options="{
        pageCount: data?.pages ?? -1,
        initialState,
      }"
      :permission="hasRights"
      :expanded-markup="expandedMarkup"
      :empty-message="$t('components.table.nothing', { item: $t('general.note', 2).toLowerCase() })"
      @remove="removeItems"
      @invalidate="invalidateQueries"
    >
      <template #top>
        <div class="flex justify-end items-center gap-4">
          <ContentCount
            :loading="data?.notes === null"
            :count="count"
            :max="max"
          />
          <button
            class="btn-primary"
            :aria-label="$t('actions.create')"
            :disabled="status === 'pending' || (count || 0) >= max"
            @click="openModal()"
          >
            {{ $t('actions.create') }}
          </button>
        </div>
      </template>

      <template #loading>
        <SkeletonNoteTableRow
          v-for="i in 10"
          :key="i"
        />
      </template>
    </DataTable>
  </div>
</template>

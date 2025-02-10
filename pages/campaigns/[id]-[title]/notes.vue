<script lang="ts" setup>
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'
import type { DataTable } from '#components'

const props = defineProps<{ current: CampaignFull }>()

const table = ref<InstanceType<typeof DataTable>>()

const { toast } = useToast()
const modal = useModal()
const user = useAuthenticatedUser()
const { ask } = useConfirm()
const { t, locale } = useI18n()
const { startCoolDown, isInCoolDown, getRemainingTime } = useCoolDown()
const queryClient = useQueryClient()

const search = ref<string>('')
const debouncedSearch = refDebounced(search, 500, { maxWait: 1000 })
const sortBy = ref<string>('created_at')
const sortACS = ref<boolean>(false)
const page = ref<number>(0)
const max = 100

const { data: count } = useNoteCount(props.current.id)
const { mutateAsync: removeNote } = useNoteRemove()

const { data, status } = useNoteListing(computed(() => ({
  search: debouncedSearch.value,
  sortBy: sortBy.value,
  sortACS: sortACS.value,
  page: page.value,
  campaign: props.current.id,
  eq: { field: 'campaign', value: props.current.id },
})))

const rowSelection = computed(() => selectedRows(table.value))

function openModal(item?: NoteRow): void {
  modal.open({
    component: 'Note',
    header: t(`components.noteModal.${item ? 'update' : 'new'}`),
    submit: t(`components.noteModal.${item ? 'update' : 'add'}`),
    props: {
      campaignId: props.current.id,
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

async function deleteItems(ids: number[]): Promise<void> {
  ask({}, async (confirmed: boolean) => {
    if (confirmed) await removeNote({ id: ids })
  })
}

async function sendNoteAsMail(note: NoteRow, addresses: string[]): Promise<void> {
  try {
    await Promise.all(addresses.map(async (email) => {
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
        @refresh="() => {
          queryClient.invalidateQueries({ queryKey: ['useNoteListing'] })
          queryClient.invalidateQueries({ queryKey: ['useNoteCount'] })
        }"
      />
    </AnimationExpand>
    <DataTable
      ref="table"
      v-model:sort-by="sortBy"
      v-model:acs="sortACS"
      v-model:search="search"
      :headers="[
        { label: $t('general.title'), sort: true, id: 'title' },
        { label: $t('general.createdAt'), sort: true, id: 'created_at' },
        { label: '', sort: false, id: 'modify' },
      ]"
      :items="data?.notes || []"
      :pages="data?.pages || 0"
      :per-page="10"
      :total-items="data?.amount || 0"
      :loading="status === 'pending'"
      :has-rights="isAdmin(current, user.id)"
      type="note"
      select
      @remove="deleteItems"
      @paginate="page = $event"
    >
      <template #header>
        <ContentCount
          v-if="data?.notes !== null && count"
          :count="count"
          :max="max"
        />
        <button
          class="btn-primary"
          :aria-label="$t('actions.create')"
          :disabled="status === 'pending' || !isAdmin(current, user.id) || (count || 0) >= max"
          @click="openModal()"
        >
          {{ $t('actions.create') }}
        </button>
      </template>

      <template #default="{ rows }: { rows: NoteRow[] }">
        <template
          v-for="row in rows"
          :key="row.id"
        >
          <tr
            class="tr transition-colors"
            :class="{
              'bg-destructive/20': rowSelection[row.id],
            }"
          >
            <td class="td">
              <div class="max-w-[60px] flex items-center gap-2">
                <FormKit
                  v-if="isAdmin(current, user.id)"
                  v-model="rowSelection[row.id]"
                  type="checkbox"
                  :disabled="status === 'pending'"
                  outer-class="$reset !pb-0"
                  wrapper-class="$remove:mb-1"
                  decorator-class="$remove:mr-2"
                  @click="table?.toggleRow(row)"
                />
                <button
                  v-tippy="$t(`actions.${table?.detailRow === row.id ? 'hide' : 'show'}`)"
                  :aria-label="$t(`actions.${table?.detailRow === row.id ? 'hide' : 'show'}`)"
                  :class="table?.detailRow === row.id ? 'icon-btn-destructive' : 'icon-btn-help'"
                  @click="table?.toggleDetailRow(row.id)"
                >
                  <Icon
                    name="tabler:chevron-right"
                    aria-hidden="true"
                    :class="{ 'rotate-90': table?.detailRow === row.id }"
                    class="size-5 transition-transform duration-200 ease-in-out"
                  />
                </button>
              </div>
            </td>
            <td class="td truncate">
              {{ row.title }}
            </td>
            <td class="td">
              {{
                row.created_at
                  ? new Date(row.created_at).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-US')
                  : ''
              }}
            </td>
            <td class="td">
              <div class="flex justify-end">
                <div
                  v-if="isInCoolDown(row.id)"
                  class="mt-auto text-muted-foreground body-small w-7"
                >
                  {{ getRemainingTime(row.id) }}s
                </div>
                <button
                  v-tippy="$t('actions.sendMail')"
                  :aria-label="$t('actions.sendMail')"
                  :disabled="isInCoolDown(row.id)"
                  class="icon-btn-primary"
                  @click="openMailModal(row)"
                >
                  <Icon
                    name="tabler:send"
                    class="size-5"
                    aria-hidden="true"
                  />
                </button>
                <button
                  v-if="isAdmin(current, user.id)"
                  v-tippy="$t('actions.update')"
                  class="icon-btn-info"
                  :aria-label="$t('actions.update')"
                  @click="openModal(row)"
                >
                  <Icon
                    name="tabler:edit"
                    class="size-5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </td>
          </tr>
          <tr
            v-if="table?.detailRow === row.id"
            class="tr"
          >
            <td
              class="td space-y-4 w-full"
              :colspan="10"
            >
              <div
                class="html-richtext max-h-[350px] sm:max-h-[600px] overflow-y-auto"
                v-html="row.text"
              />
              <div class="flex justify-end">
                <button
                  class="btn-destructive"
                  :aria-label="$t('actions.close')"
                  @click="table?.toggleDetailRow(row.id)"
                >
                  {{ $t('actions.close') }}
                </button>
              </div>
            </td>
          </tr>
        </template>
      </template>

      <template #loading>
        <SkeletonNoteTableRow
          v-for="i in 10"
          :key="i"
        />
      </template>

      <template #empty>
        {{ $t('components.table.nothing', { item: $t('general.note', 2).toLowerCase() }) }}
      </template>
    </DataTable>
  </div>
</template>

<script lang="ts" setup>
import type { DataTable } from '#components'

const props = defineProps<{ current: CampaignFull }>()

const table = ref<InstanceType<typeof DataTable>>()

const toast = useToast()
const modal = useModal()
const note = useNotes()
const profile = useProfile()
const { ask } = useConfirm()
const { t, locale } = useI18n()
const { startCoolDown, isInCoolDown, getRemainingTime } = useCoolDown()

const search = ref<string>('')
const sortBy = ref<string>('created_at')
const sortACS = ref<boolean>(false)
const page = ref<number>(0)
const count = ref<number>(await note.getCount(props.current.id))

const { data: notes, status, refresh } = await useAsyncData(
  'notes',
  async () => await note.get({
    search: search.value,
    sortBy: sortBy.value,
    sortACS: sortACS.value,
    page: page.value,
  },
  { field: 'campaign', value: props.current.id },
  ),
  {
    watch: [sortBy, sortACS, page],
  },
)

watchDebounced(search, () => refresh(), { debounce: 500, maxWait: 1000 })

const rowSelection = computed(() => selectedRows(table.value))

async function refreshData(): Promise<void> {
  refresh()
  count.value = await note.getCount(props.current.id)
}

function openModal(item?: NoteRow): void {
  modal.open({
    component: 'Note',
    header: t(`components.noteModal.${item ? 'update' : 'new'}`),
    events: { finished: () => refreshData() },
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
    events: { send: (addresses: string[]) => sendNoteAsMail(item, addresses) },
    props: {
      sender: {
        name: profile.data!.username,
        avatar: profile.data!.avatar,
      },
    },
  })
}

async function deleteItems(ids: number[]): Promise<void> {
  const amount = ids.length
  const type = t('general.note', amount).toLowerCase()

  ask({
    title: `${amount} ${type}`,
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await note.deleteNote(ids)
      refreshData()
    }
    catch (err) {
      toast.error()
    }
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
          sharedBy: profile.data!.username,
        },
      })
    }))

    startCoolDown(note.id, 15)

    toast.success({ title: t('general.mail.success.title') })
  }
  catch (err) {
    toast.error({
      text: t('general.mail.fail.text'),
      title: t('general.mail.fail.title'),
    })
  }
}
</script>

<template>
  <div>
    <AnimationExpand>
      <RefreshCard
        v-if="status === 'error'"
        @refresh="refreshData()"
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
      :items="notes || []"
      :pages="note.pages"
      :per-page="note.perPage"
      :total-items="note.amount"
      :loading="status === 'pending'"
      :has-rights="isAdmin(current, profile.user!.id)"
      type="note"
      select
      @remove="deleteItems"
      @paginate="page = $event"
    >
      <template #header>
        <ContentCount
          v-if="notes !== null && profile.data"
          :count="count"
          :max="note.max"
        />
        <button
          class="btn-primary"
          :aria-label="$t('actions.create')"
          :disabled="status === 'pending' || !isAdmin(current, profile.user!.id) || count >= note.max"
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
              'bg-danger/20': rowSelection[row.id],
            }"
          >
            <td class="td max-w-[60px] flex flex-col sm:flex-row items-center gap-2">
              <FormKit
                v-if="isAdmin(current, profile.user!.id)"
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
                :class="table?.detailRow === row.id ? 'icon-btn-danger' : 'icon-btn-help'"
                @click="table?.toggleDetailRow(row.id)"
              >
                <Icon
                  name="tabler:chevron-right"
                  aria-hidden="true"
                  :class="{ 'rotate-90': table?.detailRow === row.id }"
                  class="transition-transform duration-200 ease-in-out"
                />
              </button>
            </td>
            <td class="td">
              {{ row.title }}
            </td>
            <td class="td">
              {{
                row.created_at
                  ? new Date(row.created_at).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-US')
                  : ''
              }}
            </td>
            <td class="td flex justify-end">
              <div
                v-if="isInCoolDown(row.id)"
                class="mt-auto text-slate-300 body-small w-7"
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
                  class="size-6"
                  aria-hidden="true"
                />
              </button>
              <button
                v-if="isAdmin(current, profile.user!.id)"
                v-tippy="$t('actions.update')"
                class="icon-btn-info"
                :aria-label="$t('actions.update')"
                @click="openModal(row)"
              >
                <Icon
                  name="tabler:edit"
                  class="size-6"
                  aria-hidden="true"
                />
              </button>
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
                  class="btn-danger"
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

      <template
        v-if="!notes?.length && status !== 'pending'"
        #empty
      >
        {{ $t('components.table.nothing', { item: $t('general.note', 2).toLowerCase() }) }}
      </template>
    </DataTable>
  </div>
</template>

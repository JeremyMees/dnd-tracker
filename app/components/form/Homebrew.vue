<script setup lang="ts">
import { useForm } from 'vee-validate'
import type { InvalidSubmissionContext } from 'vee-validate'

const emit = defineEmits<{ close: [] }>()

const props = withDefaults(
  defineProps<{
    campaignId?: number
    item?: HomebrewItemRow
    row?: InitiativeSheetRow
    template?: Partial<InitiativeSheetRow> & { name: string }
    isEncounter?: boolean
    sheet?: InitiativeSheet
    editRows?: (rows: InitiativeSheetRow[]) => Promise<void>
  }>(),
  {
    isEncounter: false,
    campaignId: undefined,
    item: undefined,
    row: undefined,
    template: undefined,
    sheet: undefined,
    editRows: undefined,
  },
)

const { t, locale } = useI18n()
const { user } = useAuthentication()
const bloodied = useBloodiedCondition(() => props.sheet?.settings)

const canSaveToCampaign = computed(() => {
  const id = user.value?.id
  const campaign = props.sheet?.campaign

  return !!id && !!campaign && isOwnerOrAdmin(campaign, id)
})

const tabLabels = computed<Record<HomebrewTab, string>>(() => ({
  info: t('general.info'),
  stats: t('general.stats'),
  traits: t('general.trait', 2),
  actions: t('general.action', 2),
}))

const {
  current,
  isFirst: isFirstTab,
  isLast: isLastTab,
  goTo: goToTab,
  goToNext: goToNextTab,
  goToPrevious: goToPreviousTab,
} = useStepper([...homebrewTabs], 'info')
const activeTab = computed({ get: () => current.value, set: goToTab })

const isNew = !props.item && !props.row && !props.template
const step = ref<HomebrewStartStep | 'form'>(isNew ? 'type' : 'form')
const basedOn = ref<{ name: string; source: 'bestiary' | 'file' }>()

const form = useForm({
  validationSchema: homebrewFormSchema({
    isEncounter: props.isEncounter,
    isEditingRow: !!props.row,
    t,
  }),
  initialValues: homebrewInitialValues(
    props.row ? withBaseStats(props.row) : (props.item ?? props.template),
    {
      amount: props.template ? 1 : undefined,
      summoner: props.row?.summoner?.id,
    },
  ),
})

const saveToCampaign = ref<boolean>(false)
const formError = ref<string>('')

const {
  isLinked,
  isFull: isCampaignFull,
  create: createInCampaign,
  update: updateInCampaign,
  sync: syncToCampaign,
} = useCampaignHomebrewSync({
  campaignId: props.campaignId,
  linkedId: props.row?.homebrew,
  countEnabled: () => !!props.sheet && canSaveToCampaign.value,
  onError: error => (formError.value = error),
})

type SubmitMode = 'editRow' | 'addRows' | 'updateHomebrew' | 'createHomebrew'

const mode = computed<SubmitMode | undefined>(() => {
  if (props.sheet) return props.row ? 'editRow' : 'addRows'
  if (props.item) return 'updateHomebrew'
  return props.campaignId ? 'createHomebrew' : undefined
})

const submitters: Record<
  SubmitMode,
  (submission: HomebrewSubmission) => Promise<boolean>
> = {
  editRow,
  addRows,
  updateHomebrew: async ({ homebrew }) =>
    props.item ? updateInCampaign(props.item.id, homebrew) : false,
  createHomebrew: async ({ homebrew }) =>
    (await createInCampaign(homebrew)) !== null,
}

const onSubmit = form.handleSubmit(async values => {
  formError.value = ''

  if (!mode.value) return

  if (await submitters[mode.value](toHomebrewSubmission(values))) emit('close')
}, onInvalidSubmit)

function onInvalidSubmit({ errors }: InvalidSubmissionContext) {
  const invalidTabs = invalidHomebrewTabs(errors)

  if (!invalidTabs.length) return

  if (!invalidTabs.includes(activeTab.value)) goToTab(invalidTabs[0]!)

  formError.value = t('components.homebrewModal.invalid', {
    tabs: new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(
      invalidTabs.map(tab => tabLabels.value[tab]),
    ),
  })
}

async function editRow(submission: HomebrewSubmission): Promise<boolean> {
  if (!props.sheet || !props.editRows || !props.row) return false

  const homebrew = saveToCampaign.value
    ? await syncToCampaign(submission.homebrew)
    : props.row.homebrew

  if (homebrew === null) return false

  await props.editRows(
    editEncounterRow(
      props.sheet,
      props.row,
      {
        ...submission.row,
        homebrew,
        initiativeModifier: submission.initiativeModifier,
        summoner: submission.summoner,
      },
      bloodied.value,
    ),
  )

  return true
}

async function addRows(submission: HomebrewSubmission): Promise<boolean> {
  const { sheet, editRows } = props

  if (!sheet || !editRows) return false

  const addWith = (homebrew?: number) =>
    addToEncounter(
      sheet,
      [
        {
          row: { ...submission.row, homebrew },
          roll: submission.initiative,
          initiativeModifier: submission.initiativeModifier,
        },
      ],
      { amount: submission.amount, summoner: submission.summoner },
    )

  const unlinked = addWith()

  if (unlinked.full) {
    const [message, params] = unlinked.toast.description

    formError.value = t(message, params ?? {})
    return false
  }

  const homebrew = saveToCampaign.value
    ? await syncToCampaign(submission.homebrew)
    : undefined

  if (homebrew === null) return false

  const added = homebrew ? addWith(homebrew) : unlinked

  if (added.full) return false

  await editRows(added.rows)

  return true
}

const backLabel = computed(() => {
  if (!isNew || !isFirstTab.value) return t('actions.prev')

  return form.values.type === 'monster'
    ? t('components.homebrewModal.changeStart')
    : t('components.homebrewModal.changeType')
})

function goBack(): void {
  if (!isFirstTab.value) goToPreviousTab()
  else step.value = form.values.type === 'monster' ? 'source' : 'type'
}

function showForm(): void {
  goToTab('info')
  step.value = 'form'
}

function startFromType(type: HomebrewType): void {
  form.setFieldValue('type', type)
  showForm()
}

function startFromScratch(): void {
  if (basedOn.value) {
    form.resetForm(
      { values: homebrewInitialValues({ name: '', type: 'monster' }) },
      { force: true },
    )
    basedOn.value = undefined
  } else form.setFieldValue('type', 'monster')

  showForm()
}

function startFromMonster(monster: DndMonster): void {
  form.resetForm(
    {
      values: homebrewInitialValues(monsterToRow(monster), {
        amount: props.sheet ? 1 : undefined,
      }),
    },
    { force: true },
  )
  basedOn.value = { name: monster.name, source: 'bestiary' }
  showForm()
}

function startFromCreature(creature: HomebrewTransfer): void {
  form.resetForm(
    {
      values: homebrewInitialValues(homebrewTransferToRow(creature), {
        amount: props.sheet ? 1 : undefined,
      }),
    },
    { force: true },
  )
  basedOn.value = { name: creature.name, source: 'file' }
  showForm()
}
</script>

<template>
  <FormHomebrewStart
    v-if="step !== 'form'"
    v-model:step="step"
    @type="startFromType"
    @scratch="startFromScratch"
    @monster="startFromMonster"
    @creature="startFromCreature"
  />
  <UiFormWrapper v-show="step === 'form'" @submit="onSubmit">
    <p
      v-if="basedOn"
      test-id="based-on"
      class="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Icon
        :name="
          basedOn.source === 'file' ? 'tabler:file-import' : 'tabler:books'
        "
        class="size-4 min-w-4"
        :class="
          basedOn.source === 'file' ? 'text-info' : homebrewColor('monster')
        "
        aria-hidden="true"
      />
      {{ $t('components.homebrewModal.basedOn', { name: basedOn.name }) }}
    </p>
    <UiTabs v-model="activeTab" :unmount-on-hide="false">
      <UiTabsList class="grid w-full grid-cols-4">
        <UiTabsTrigger v-for="tab in homebrewTabs" :key="tab" :value="tab">
          {{ tabLabels[tab] }}
        </UiTabsTrigger>
      </UiTabsList>

      <UiTabsContent value="info" class="space-y-2">
        <FormHomebrewInformation
          :sheet="props.sheet"
          :type="form.values.type"
          :row-id="row?.id"
        />
      </UiTabsContent>
      <UiTabsContent value="stats" class="space-y-2">
        <FormHomebrewStats />
      </UiTabsContent>
      <UiTabsContent value="traits" class="space-y-2">
        <FormHomebrewTraits />
      </UiTabsContent>
      <UiTabsContent value="actions" class="space-y-2">
        <FormHomebrewActions :sheet="props.sheet" />
      </UiTabsContent>
    </UiTabs>

    <div class="flex flex-col gap-y-4">
      <div
        v-if="
          isEncounter &&
          sheet &&
          canSaveToCampaign &&
          !$route.path.includes('playground')
        "
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <UiSwitch
            id="saveToCampaign"
            v-model="saveToCampaign"
            :disabled="isCampaignFull"
            class="mb-0"
          />
          <UiLabel for="saveToCampaign">
            {{
              isLinked
                ? $t('components.homebrewModal.updateCampaign')
                : $t('components.homebrewModal.save')
            }}
          </UiLabel>
        </div>
        <span v-if="isCampaignFull" class="text-destructive text-sm">
          {{ $t('components.homebrewModal.max') }}
        </span>
      </div>

      <div
        v-if="formError"
        test-id="form-error"
        role="alert"
        class="text-sm text-destructive"
      >
        {{ formError }}
      </div>

      <FormTabNav
        :can-go-back="isNew || !isFirstTab"
        :can-go-forward="!isLastTab"
        :back-label="backLabel"
        @back="goBack"
        @next="goToNextTab"
      />
    </div>
  </UiFormWrapper>
</template>

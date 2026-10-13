<script setup lang="ts">
import {
  useHomebrewCount,
  useHomebrewCreate,
  useHomebrewUpdate,
} from '~/queries/homebrews'
import { useForm } from 'vee-validate'
import type { InvalidSubmissionContext } from 'vee-validate'
import { homebrewType, maxCampaignHomebrews } from '~~/constants/validation'

const emit = defineEmits<{ close: [] }>()

const props = withDefaults(
  defineProps<{
    campaignId?: number
    item?: HomebrewItemRow
    row?: InitiativeSheetRow
    template?: Partial<InitiativeSheetRow> & { name: string }
    isEncounter?: boolean
    sheet?: InitiativeSheet
    update?: (
      payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>,
    ) => Promise<void>
  }>(),
  {
    isEncounter: false,
    campaignId: undefined,
    item: undefined,
    row: undefined,
    template: undefined,
    sheet: undefined,
    update: undefined,
  },
)

const { t, locale } = useI18n()
const { user } = useAuthentication()

const canSaveToCampaign = computed(() => {
  const id = user.value?.id
  const campaign = props.sheet?.campaign

  return !!id && !!campaign && isOwnerOrAdmin(campaign, id)
})

const tabs = homebrewTabs

const tabLabels = computed<Record<HomebrewTab, string>>(() => ({
  info: t('general.info'),
  stats: t('general.stats'),
  traits: t('general.trait', 2),
  actions: t('general.action', 2),
}))

const activeTab = ref<HomebrewTab>('info')
const tabIndex = computed(() => tabs.indexOf(activeTab.value))
const canGoBack = computed(() => tabIndex.value > 0 || isNew)
const canGoForward = computed(() => tabIndex.value < tabs.length - 1)

const isNew = !props.item && !props.row && !props.template
const step = ref<'type' | 'source' | 'bestiary' | 'form'>(
  isNew ? 'type' : 'form',
)
const basedOn = ref<string>()
const typeOptions = computed<ChoiceCardOption<HomebrewType>[]>(() =>
  homebrewType.map(type => ({
    value: type,
    label: t(`general.${type}`),
    description: t(`components.homebrewModal.types.${type}`),
    icon: homebrewIcon(type),
    iconClass: homebrewColor(type),
  })),
)

type Source = 'scratch' | 'bestiary'

const sourceOptions = computed<ChoiceCardOption<Source>[]>(() => [
  {
    value: 'scratch',
    label: t('components.homebrewModal.sources.scratch.label'),
    description: t('components.homebrewModal.sources.scratch.description'),
    icon: 'tabler:pencil-plus',
    iconClass: 'text-primary',
  },
  {
    value: 'bestiary',
    label: t('components.homebrewModal.sources.bestiary.label'),
    description: t('components.homebrewModal.sources.bestiary.description'),
    icon: 'tabler:books',
    iconClass: homebrewColor('monster'),
  },
])

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
const isLinked = computed(() => isDefined(props.row?.homebrew))
const { data: homebrewCount } = useHomebrewCount(
  props.campaignId ?? 0,
  computed(
    () =>
      isDefined(props.campaignId) &&
      !!props.sheet &&
      canSaveToCampaign.value &&
      !isLinked.value,
  ),
)
const isCampaignFull = computed(
  () => !isLinked.value && (homebrewCount.value ?? 0) >= maxCampaignHomebrews,
)
const formError = ref<string>('')

const { mutateAsync: createHomebrew } = useHomebrewCreate()
const { mutateAsync: updateHomebrew } = useHomebrewUpdate()

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

  if (!invalidTabs.includes(activeTab.value)) activeTab.value = invalidTabs[0]!

  formError.value = t('components.homebrewModal.invalid', {
    tabs: new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(
      invalidTabs.map(tab => tabLabels.value[tab]),
    ),
  })
}

function onError(error: string): void {
  formError.value = error
}

async function createInCampaign(data: HomebrewData): Promise<number | null> {
  if (!props.campaignId) return null

  try {
    return await createHomebrew({
      data: { ...data, campaign: props.campaignId } as HomebrewItemInsert,
      onError,
    })
  } catch {
    return null
  }
}

async function updateInCampaign(
  id: number,
  data: HomebrewData,
): Promise<boolean> {
  try {
    await updateHomebrew({ data, id, onError })

    return true
  } catch {
    return false
  }
}

async function syncToCampaign(
  data: HomebrewData,
): Promise<number | undefined | null> {
  const linked = props.row?.homebrew

  if (!saveToCampaign.value || !props.campaignId) return linked
  if (!isDefined(linked)) return createInCampaign(data)

  return (await updateInCampaign(linked, data)) ? linked : null
}

async function editRow(submission: HomebrewSubmission): Promise<boolean> {
  if (!props.sheet || !props.update || !props.row) return false

  const homebrew = await syncToCampaign(submission.homebrew)

  if (homebrew === null) return false

  const edited = editInitiativeRow(
    props.row,
    {
      ...submission.row,
      homebrew,
      initiativeModifier: submission.initiativeModifier,
      summoner: toSummoner(props.sheet.rows, submission.summoner),
    },
    submission.row.type,
  )

  await props.update({
    rows: replaceRow(props.sheet.rows, edited),
  })

  return true
}

async function addRows(submission: HomebrewSubmission): Promise<boolean> {
  if (!props.sheet || !props.update) return false

  const { initiative, initiativeModifier } = submission
  const homebrew =
    saveToCampaign.value && props.campaignId
      ? await createInCampaign(submission.homebrew)
      : undefined

  if (homebrew === null) return false

  const row = {
    ...submission.row,
    homebrew,
    summoner: toSummoner(props.sheet.rows, submission.summoner),
    ...(initiative
      ? { initiative: initiative + (initiativeModifier ?? 0) }
      : {}),
    ...(isDefined(initiativeModifier) ? { initiativeModifier } : {}),
  }

  await props.update({
    rows: appendRows(
      props.sheet.rows,
      Array.from({ length: submission.amount ?? 1 }, () => row),
    ),
  })

  return true
}

function goBack(): void {
  if (tabIndex.value > 0) activeTab.value = tabs[tabIndex.value - 1]!
  else step.value = form.values.type === 'monster' ? 'source' : 'type'
}

function showForm(): void {
  activeTab.value = 'info'
  step.value = 'form'
}

function pickType(type: HomebrewType): void {
  form.setFieldValue('type', type)

  if (type === 'monster') step.value = 'source'
  else showForm()
}

function pickSource(picked: Source): void {
  if (picked === 'bestiary') {
    step.value = 'bestiary'
    return
  }

  if (basedOn.value) {
    form.resetForm(
      { values: homebrewInitialValues({ name: '', type: 'monster' }) },
      { force: true },
    )
    basedOn.value = undefined
  }

  showForm()
}

function pickMonster(monster: DndMonster): void {
  form.resetForm(
    {
      values: homebrewInitialValues(monsterToRow(monster), {
        amount: props.sheet ? 1 : undefined,
      }),
    },
    { force: true },
  )
  basedOn.value = monster.name
  showForm()
}
</script>

<template>
  <ChoiceCards
    v-if="step === 'type'"
    :title="$t('components.homebrewModal.pickType')"
    :description="$t('components.homebrewModal.pickTypeInfo')"
    :options="typeOptions"
    @select="pickType"
  />
  <div v-else-if="step === 'source'">
    <UiButton
      test-id="step-back"
      type="button"
      variant="foreground-ghost"
      size="sm"
      @click="step = 'type'"
    >
      <Icon name="tabler:arrow-left" aria-hidden="true" />
      {{ $t('actions.back') }}
    </UiButton>
    <ChoiceCards
      :title="$t('components.homebrewModal.pickSource')"
      :description="$t('components.homebrewModal.pickSourceInfo')"
      :options="sourceOptions"
      @select="pickSource"
    />
  </div>
  <div v-else-if="step === 'bestiary'" class="flex flex-col gap-4">
    <div class="flex flex-col items-start gap-2">
      <UiButton
        test-id="step-back"
        type="button"
        variant="foreground-ghost"
        size="sm"
        @click="step = 'source'"
      >
        <Icon name="tabler:arrow-left" aria-hidden="true" />
        {{ $t('actions.back') }}
      </UiButton>
      <div>
        <h3 class="text-xl font-semibold">
          {{ $t('components.homebrewModal.pickMonster') }}
        </h3>
        <p class="text-sm text-muted-foreground text-pretty">
          {{ $t('components.homebrewModal.pickMonsterInfo') }}
          <Icon
            name="tabler:wand"
            class="size-4 align-text-bottom text-warning"
            aria-hidden="true"
          />
        </p>
      </div>
    </div>
    <FormBestiary :addable="false" persist="local" @remix="pickMonster" />
  </div>
  <UiFormWrapper v-show="step === 'form'" @submit="onSubmit">
    <p
      v-if="basedOn"
      test-id="based-on"
      class="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Icon
        name="tabler:books"
        class="size-4 min-w-4"
        :class="homebrewColor('monster')"
        aria-hidden="true"
      />
      {{ $t('components.homebrewModal.basedOn', { name: basedOn }) }}
    </p>
    <UiTabs v-model="activeTab">
      <UiTabsList class="grid w-full grid-cols-4">
        <UiTabsTrigger v-for="tab in tabs" :key="tab" :value="tab">
          {{ tabLabels[tab] }}
        </UiTabsTrigger>
      </UiTabsList>

      <div
        v-show="activeTab === 'info'"
        class="space-y-2 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <FormHomebrewInformation
          :sheet="props.sheet"
          :type="form.values.type"
          :row-id="row?.id"
        />
      </div>

      <div
        v-show="activeTab === 'stats'"
        class="space-y-2 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <FormHomebrewStats />
      </div>

      <div
        v-show="activeTab === 'traits'"
        class="space-y-2 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <FormHomebrewTraits />
      </div>

      <div
        v-show="activeTab === 'actions'"
        class="space-y-2 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <FormHomebrewActions :sheet="props.sheet" />
      </div>
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

      <div class="flex justify-end gap-2">
        <Tooltip
          :text="
            isNew && tabIndex === 0
              ? $t('components.homebrewModal.changeType')
              : $t('actions.prev')
          "
        >
          <UiButton
            test-id="prev"
            type="button"
            variant="foreground"
            size="icon"
            class="min-w-10"
            :disabled="!canGoBack"
            @click="goBack"
          >
            <Icon name="tabler:arrow-left" />
          </UiButton>
        </Tooltip>
        <Tooltip :text="$t('actions.next')">
          <UiButton
            test-id="next"
            type="button"
            variant="foreground"
            size="icon"
            class="min-w-10"
            :disabled="!canGoForward"
            @click="activeTab = tabs[tabIndex + 1]!"
          >
            <Icon name="tabler:arrow-right" />
          </UiButton>
        </Tooltip>
        <UiButton type="submit" class="w-full md:w-fit">
          {{ $t('actions.save') }}
        </UiButton>
      </div>
    </div>
  </UiFormWrapper>
</template>

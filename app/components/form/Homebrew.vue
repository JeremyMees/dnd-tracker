<script setup lang="ts">
import {
  useHomebrewCount,
  useHomebrewCreate,
  useHomebrewUpdate,
} from '~/queries/homebrews'
import { useForm } from 'vee-validate'
import type { InvalidSubmissionContext } from 'vee-validate'
import * as z from 'zod'
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

  if (!id) return false

  return (
    props.sheet?.campaign?.createdBy.id === id ||
    isAdmin(props.sheet?.campaign?.team || [], id)
  )
})

const tabs = ['info', 'stats', 'traits', 'actions'] as const

type Tab = (typeof tabs)[number]

const tabFields: Partial<Record<Tab, string[]>> = {
  stats: ['abilityScores', 'modifiers', 'savingThrows', 'skillBonuses'],
  traits: ['traits', 'resistancesAndImmunities'],
  actions: ['actions'],
}

const tabLabels = computed<Record<Tab, string>>(() => ({
  info: t('general.info'),
  stats: t('general.stats'),
  traits: t('general.trait', 2),
  actions: t('general.action', 2),
}))

function tabOf(path: string): Tab {
  const field = path.split(/[.[]/)[0]!

  return tabs.find(tab => tabFields[tab]?.includes(field)) ?? 'info'
}

const activeTab = ref<Tab>('info')
const tabIndex = computed(() => tabs.indexOf(activeTab.value))
const canGoBack = computed(() => tabIndex.value > 0)
const canGoForward = computed(() => tabIndex.value < tabs.length - 1)

const formSchema = z
  .object({
    type: z.enum(homebrewType),
    amount: z.int().gte(1).lte(15).optional(),
    summoner: z.string().max(50).optional().or(z.literal('')),
    name: z.string().min(3).max(50),
    player: z.string().min(3).max(30).optional().or(z.literal('')),
    initiative: z.int().gte(1).lte(50).optional(),
    initiativeModifier: z.int().gte(-20).lte(20).optional(),
    armorClass: z.int().gte(1).lte(100).optional(),
    hitPoints: z.int().gte(1).lte(1000).optional(),
    link: z.string().url().optional().or(z.literal('')),
    hitDice: z
      .string()
      .min(3)
      .max(15)
      .regex(hitDiceExpression, { error: () => t('zod.hitDiceExpression') })
      .optional()
      .or(z.literal('')),
    armorDetail: z.string().max(100).optional().or(z.literal('')),
    proficiencyBonus: z.int().gte(0).lte(10).optional(),
    passivePerception: z.int().gte(0).lte(50).optional(),
    speed: speedSchema.optional(),
    sight: sightSchema.optional(),
    languages: z.array(z.string().min(1).max(50)).max(20),
    abilityScores: abilityScoresSchema.optional(),
    modifiers: abilityBonusSchema.optional(),
    savingThrows: abilityBonusSchema.optional(),
    skillBonuses: skillBonusesSchema.optional(),
    resistancesAndImmunities: resistancesAndImmunitiesSchema.optional(),
    traits: z.array(traitSchema).max(40),
    actions: z.array(actionSchema).max(40),
  })
  .refine(
    data =>
      !props.isEncounter ||
      !!props.row ||
      !(['monster', 'summon'].includes(data.type) && !data.amount),
    { error: () => t('zod.required'), path: ['amount'] },
  )
  .refine(
    data =>
      !props.isEncounter || !(['summon'].includes(data.type) && !data.summoner),
    { error: () => t('zod.required'), path: ['summoner'] },
  )

const source = props.row
  ? {
      ...props.row,
      hitPoints: props.row.maxHitPointsOld ?? props.row.maxHitPoints,
      armorClass: props.row.maxArmorClassOld ?? props.row.maxArmorClass,
    }
  : (props.item ?? props.template)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    type: source?.type || 'player',
    summoner: props.row?.summoner?.id,
    name: source?.name || '',
    player: source?.player || '',
    amount: props.template ? 1 : undefined,
    initiative: undefined,
    initiativeModifier: source?.initiativeModifier
      ? isNaN(+source.initiativeModifier)
        ? undefined
        : +source.initiativeModifier
      : undefined,
    armorClass: source?.armorClass || undefined,
    hitPoints: source?.hitPoints || undefined,
    link: source?.link || '',
    hitDice: source?.hitDice || '',
    armorDetail: source?.armorDetail || '',
    proficiencyBonus: source?.proficiencyBonus || undefined,
    passivePerception: source?.passivePerception || undefined,
    speed: source?.speed || undefined,
    sight: source?.sight || undefined,
    languages: source?.languages || [],
    abilityScores: source?.abilityScores || undefined,
    modifiers: source?.modifiers || undefined,
    savingThrows: source?.savingThrows || undefined,
    skillBonuses: source?.skillBonuses || undefined,
    resistancesAndImmunities: {
      damageImmunities:
        source?.resistancesAndImmunities?.damageImmunities ?? [],
      damageResistances:
        source?.resistancesAndImmunities?.damageResistances ?? [],
      damageVulnerabilities:
        source?.resistancesAndImmunities?.damageVulnerabilities ?? [],
      conditionImmunities:
        source?.resistancesAndImmunities?.conditionImmunities ?? [],
    },
    traits: (source?.traits ?? []) as { name: string; desc: string }[],
    actions: source?.actions ?? [],
  },
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

type HomebrewData = Omit<HomebrewItemUpdate, NotUpdatable>

interface Submission {
  row: InitiativeSheetRowInsert
  homebrew: HomebrewData
  amount?: number
  initiative?: number
  initiativeModifier?: number
  summoner?: string
}

type SubmitMode = 'editRow' | 'addRows' | 'updateHomebrew' | 'createHomebrew'

const mode = computed<SubmitMode | undefined>(() => {
  if (props.sheet) return props.row ? 'editRow' : 'addRows'
  if (props.item) return 'updateHomebrew'
  return props.campaignId ? 'createHomebrew' : undefined
})

const submitters: Record<
  SubmitMode,
  (submission: Submission) => Promise<boolean>
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

  if (await submitters[mode.value](toSubmission(values))) emit('close')
}, onInvalidSubmit)

function onInvalidSubmit({ errors }: InvalidSubmissionContext) {
  const invalidPaths = Object.keys(errors).filter(path => errors[path])
  const invalidTabs = tabs.filter(tab =>
    invalidPaths.some(path => tabOf(path) === tab),
  )

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

function toSubmission(values: z.output<typeof formSchema>): Submission {
  const { amount, initiative, initiativeModifier, summoner, ...data } = values

  return {
    row: data as InitiativeSheetRowInsert,
    homebrew: {
      ...data,
      ...(isDefined(initiativeModifier)
        ? { initiativeModifier: initiativeModifier.toString() }
        : {}),
    } as HomebrewData,
    amount,
    initiative,
    initiativeModifier,
    summoner,
  }
}

function findSummoner(id?: string): InitiativeSheetRow['summoner'] {
  const summoner = id ? props.sheet?.rows.find(r => r.id === id) : undefined

  return summoner ? { name: summoner.name, id: summoner.id } : undefined
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

async function editRow(submission: Submission): Promise<boolean> {
  if (!props.sheet || !props.update || !props.row) return false

  const homebrew = await syncToCampaign(submission.homebrew)

  if (homebrew === null) return false

  const edited = editInitiativeRow(
    props.row,
    {
      ...submission.row,
      homebrew,
      initiativeModifier: submission.initiativeModifier,
      summoner: findSummoner(submission.summoner),
    },
    submission.row.type,
  )

  await props.update({
    rows: props.sheet.rows.map(r => (r.id === edited.id ? edited : r)),
  })

  return true
}

async function addRows(submission: Submission): Promise<boolean> {
  if (!props.sheet || !props.update) return false

  const { initiative, initiativeModifier } = submission
  const homebrew =
    saveToCampaign.value && props.campaignId
      ? await createInCampaign(submission.homebrew)
      : undefined

  if (homebrew === null) return false

  const row: Partial<InitiativeSheetRow> & { name: string } = {
    ...submission.row,
    homebrew,
    summoner: findSummoner(submission.summoner),
    ...(initiative
      ? { initiative: initiative + (initiativeModifier ?? 0) }
      : {}),
    ...(isDefined(initiativeModifier) ? { initiativeModifier } : {}),
  }

  const rows = [...props.sheet.rows]

  for (let i = 0; i < (submission.amount ?? 1); i++) {
    rows.push(createInitiativeRow(row, submission.row.type, rows.length))
  }

  await props.update({ rows: indexCorrect(rows) })

  return true
}
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
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
        <Tooltip :text="$t('actions.prev')">
          <UiButton
            test-id="prev"
            type="button"
            variant="foreground"
            size="icon"
            class="min-w-10"
            :disabled="!canGoBack"
            @click="activeTab = tabs[tabIndex - 1]!"
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

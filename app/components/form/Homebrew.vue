<script setup lang="ts">
import { useHomebrewCreate, useHomebrewUpdate } from '~~/queries/homebrews'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { homebrewType } from '~~/constants/validation'

const emit = defineEmits<{ close: [] }>()

const props = withDefaults(
  defineProps<{
    campaignId?: number
    count: number
    item?: HomebrewItemRow
    isEncounter?: boolean
    sheet?: InitiativeSheet
    update?: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
  }>(), {
    isEncounter: false,
  },
)

const { t } = useI18n()

const tabs = ['info', 'stats', 'traits', 'actions'] as const

const activeTab = ref<typeof tabs[number]>('info')
const tabIndex = computed(() => tabs.indexOf(activeTab.value))
const canGoBack = computed(() => tabIndex.value > 0)
const canGoForward = computed(() => tabIndex.value < tabs.length - 1)

const formSchema = toTypedSchema(z.object({
  type: z.enum(homebrewType),
  amount: z.number().gte(1).lte(15).optional(),
  summoner: z.string().max(50).optional().or(z.literal('')),
  name: z.string().min(3).max(30),
  player: z.string().min(3).max(30).optional().or(z.literal('')),
  initiative: z.number().gte(1).lte(50).optional(),
  initiativeModifier: z.number().gte(-20).lte(20).optional(),
  armorClass: z.number().gte(1).lte(100).optional(),
  hitPoints: z.number().gte(1).lte(1000).optional(),
  link: z.string().url().optional().or(z.literal('')),
  hitDice: z.string().min(3).max(15).regex(hitDiceExpression, t('zod.hitDiceExpression')).optional().or(z.literal('')),
  armorDetail: z.string().max(100).optional().or(z.literal('')),
  proficiencyBonus: z.number().gte(0).lte(10).optional(),
  passivePerception: z.number().gte(0).lte(30).optional(),
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
}).refine(
  data => !props.isEncounter || !(['monster', 'summon'].includes(data.type) && !data.amount),
  { message: t('zod.required'), path: ['amount'] },
).refine(
  data => !props.isEncounter || !(['summon'].includes(data.type) && !data.summoner),
  { message: t('zod.required'), path: ['summoner'] },
))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    type: props.item?.type || 'player',
    name: props.item?.name || '',
    player: props.item?.player || '',
    initiative: undefined,
    initiativeModifier: props.item?.initiativeModifier
      ? isNaN(+props.item.initiativeModifier) ? undefined : +props.item.initiativeModifier
      : undefined,
    armorClass: props.item?.armorClass || undefined,
    hitPoints: props.item?.hitPoints || undefined,
    link: props.item?.link || '',
    hitDice: props.item?.hitDice || '',
    armorDetail: props.item?.armorDetail || '',
    proficiencyBonus: props.item?.proficiencyBonus || undefined,
    passivePerception: props.item?.passivePerception || undefined,
    speed: props.item?.speed || undefined,
    sight: props.item?.sight || undefined,
    languages: props.item?.languages || [],
    abilityScores: props.item?.abilityScores || undefined,
    modifiers: props.item?.modifiers || undefined,
    savingThrows: props.item?.savingThrows || undefined,
    skillBonuses: props.item?.skillBonuses || undefined,
    resistancesAndImmunities: {
      damageImmunities: props.item?.resistancesAndImmunities?.damageImmunities ?? [],
      damageResistances: props.item?.resistancesAndImmunities?.damageResistances ?? [],
      damageVulnerabilities: props.item?.resistancesAndImmunities?.damageVulnerabilities ?? [],
      conditionImmunities: props.item?.resistancesAndImmunities?.conditionImmunities ?? [],
    },
    traits: (props.item?.traits ?? []) as { name: string, desc: string }[],
    actions: props.item?.actions ?? [],
  },
})

const saveToCampaign = ref<boolean>(false)
const formError = ref<string>('')

const { mutateAsync: createHomebrew } = useHomebrewCreate()
const { mutateAsync: updateHomebrew } = useHomebrewUpdate()

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  const { amount, initiative, initiativeModifier, summoner, ...rest } = values

  const formData = { ...rest }
  const initMod = isDefined(initiativeModifier)
    ? { initiativeModifier: initiativeModifier.toString() }
    : {}

  const onSuccess = () => emit('close')
  const onError = (error: string) => formError.value = error

  if (props.sheet) {
    addInitiative({
      data: formData as InitiativeSheetRowInsert,
      amount: amount ?? 1,
      initiative,
      initiativeModifier: isDefined(initiativeModifier) ? initiativeModifier : undefined,
      summoner,
    })

    if (saveToCampaign.value && props.campaignId) {
      await create({
        data: { ...formData, ...initMod, campaign: props.campaignId } as HomebrewItemInsert,
        onSuccess,
        onError,
      })
    }
    else {
      onSuccess()
    }
  }
  else {
    if (props.item) {
      await updateHomebrew({
        data: { ...formData, ...initMod } as any,
        id: props.item.id,
        onSuccess,
        onError,
      })
    }
    else if (props.campaignId) {
      await create({
        data: { ...formData, ...initMod, campaign: props.campaignId } as HomebrewItemInsert,
        onSuccess,
        onError,
      })
    }
  }
})

async function create(options: {
  data: HomebrewItemInsert
  onSuccess: () => void
  onError: (error: string) => void
}): Promise<void> {
  await createHomebrew(options)
}

async function addInitiative(options: {
  data: InitiativeSheetRowInsert
  amount: number
  initiative?: number
  initiativeModifier?: number | string
  summoner?: string
}): Promise<void> {
  if (!props.sheet || !props.update) return

  const sum = options.summoner
    ? props.sheet.rows.filter(r => r.id === options.summoner)[0]
    : undefined

  const row: Partial<InitiativeSheetRow> & { name: string } = {
    ...options.data,
    ...(options.initiative && options.initiativeModifier ? { initiative: +options.initiative + +options.initiativeModifier } : {}),
    ...(options.initiative && !options.initiativeModifier ? { initiative: +options.initiative } : {}),
    ...(sum ? { summoner: { name: sum.name, id: sum.id } } : {}),
    ...(isDefined(options.initiativeModifier) ? { initiativeModifier: +options.initiativeModifier } : {}),
  }

  const rows = [...props.sheet.rows]
  const type = (form.values.type ?? 'player') as HomebrewType

  for (let i = 0; i < options.amount; i++) {
    rows.push(createInitiativeRow(row, type, rows.length))
  }

  const sortedRows = indexCorrect(rows)

  await props.update({ rows: sortedRows })
}
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiTabs v-model="activeTab">
      <UiTabsList class="grid w-full grid-cols-4">
        <UiTabsTrigger value="info">
          {{ $t('general.info') }}
        </UiTabsTrigger>
        <UiTabsTrigger value="stats">
          {{ $t('general.stats') }}
        </UiTabsTrigger>
        <UiTabsTrigger value="traits">
          {{ $t('general.trait', 2) }}
        </UiTabsTrigger>
        <UiTabsTrigger value="actions">
          {{ $t('general.action', 2) }}
        </UiTabsTrigger>
      </UiTabsList>

      <div
        v-show="activeTab === 'info'"
        class="space-y-2 mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <FormHomebrewInformation
          :sheet="props.sheet"
          :type="form.values.type"
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
        v-if="isEncounter && sheet && !$route.path.includes('playground')"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <UiSwitch
            id="saveToCampaign"
            v-model="saveToCampaign"
            :disabled="sheet.rows.length >= 100"
            class="mb-0"
          />
          <UiLabel for="saveToCampaign">
            {{ $t('components.homebrewModal.save') }}
          </UiLabel>
        </div>
        <span
          v-if="sheet.rows.length >= 100"
          class="text-destructive text-sm"
        >
          {{ $t('components.homebrewModal.max') }}
        </span>
      </div>

      <div class="flex justify-end gap-2">
        <UiButton
          v-tippy="$t('actions.prev')"
          type="button"
          variant="foreground"
          size="icon"
          class="min-w-10"
          :disabled="!canGoBack"
          @click="activeTab = tabs[tabIndex - 1]!"
        >
          <Icon name="tabler:arrow-left" />
        </UiButton>
        <UiButton
          v-tippy="$t('actions.next')"
          type="button"
          variant="foreground"
          size="icon"
          class="min-w-10"
          :disabled="!canGoForward"
          @click="activeTab = tabs[tabIndex + 1]!"
        >
          <Icon name="tabler:arrow-right" />
        </UiButton>
        <UiButton
          type="submit"
          class="w-full md:w-fit"
        >
          {{ $t('actions.save') }}
        </UiButton>
      </div>
    </div>
  </UiFormWrapper>
</template>

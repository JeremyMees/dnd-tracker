<script setup lang="ts">
import { useHomebrewCreate, useHomebrewUpdate } from '~~/queries/homebrews'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { homebrewType, abilityType, actionType } from '~~/constants/validation'

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

const actionInputs = z.array(z.object({
  type: z.enum(actionType),
  name: z.string().min(3).max(30),
  desc: z.string().min(10).max(1000),
  attack_bonus: z.number().gte(1).lte(100).optional(),
  damage_bonus: z.number().min(1).lte(100).optional(),
  damage_dice: z.string().min(3).max(15).regex(diceExpression, t('zod.diceExpression')).optional().or(z.literal('')),
  spell_save: z.number().min(1).lte(100).optional(),
  spell_save_type: z.union([z.enum(abilityType), z.literal('none')]).optional().transform(val => val === 'none' ? undefined : val),
})).max(10)

const formSchema = toTypedSchema(z.object({
  type: z.enum(homebrewType),
  amount: z.number().gte(1).lte(15).optional(),
  summoner: z.string().max(50).optional().or(z.literal('')),
  name: z.string().min(3).max(30),
  player: z.string().min(3).max(30).optional().or(z.literal('')),
  initiative: z.number().gte(1).lte(50).optional(),
  initiative_modifier: z.number().gte(-20).lte(20).optional(),
  ac: z.number().gte(1).lte(100).optional(),
  health: z.number().gte(1).lte(1000).optional(),
  link: z.string().url().optional().or(z.literal('')),
  actions: actionInputs,
  reactions: actionInputs,
  legendary_actions: actionInputs,
  special_abilities: actionInputs,
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
    initiative_modifier: props.item?.initiative_modifier
      ? isNaN(+props.item.initiative_modifier) ? undefined : +props.item.initiative_modifier
      : undefined,
    ac: props.item?.ac || undefined,
    health: props.item?.health || undefined,
    link: props.item?.link || '',
    actions: props.item?.actions || [],
    reactions: props.item?.reactions || [],
    legendary_actions: props.item?.legendary_actions || [],
    special_abilities: props.item?.special_abilities || [],
  },
})

const saveToCampaign = ref<boolean>(false)
const activeTab = ref<string>('info')
const formError = ref<string>('')

const { mutateAsync: createHomebrew } = useHomebrewCreate()
const { mutateAsync: updateHomebrew } = useHomebrewUpdate()

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  const { amount, initiative, initiative_modifier, summoner, ...rest } = values

  const formData = {
    ...rest,
    actions: castActionFieldsToNumber(values.actions),
    reactions: castActionFieldsToNumber(values.reactions),
    legendary_actions: castActionFieldsToNumber(values.legendary_actions),
    special_abilities: castActionFieldsToNumber(values.special_abilities),
  }
  const initMod = isDefined(initiative_modifier)
    ? { initiative_modifier: initiative_modifier.toString() }
    : {}

  const onSuccess = () => emit('close')
  const onError = (error: string) => formError.value = error

  if (props.sheet) {
    addInitiative({
      data: formData as InitiativeSheetRowInsert,
      amount: amount ?? 1,
      initiative,
      initiative_modifier: isDefined(initiative_modifier) ? initiative_modifier : undefined,
      summoner,
    })

    // Also save homebrew to campaign
    if (saveToCampaign.value && props.campaignId) {
      await create({
        data: { ...formData, ...initMod, campaign: props.campaignId },
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
        data: { ...formData, ...initMod },
        id: props.item.id,
        onSuccess,
        onError,
      })
    }
    else if (props.campaignId) {
      await create({
        data: { ...formData, ...initMod, campaign: props.campaignId },
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
  initiative_modifier?: number | string
  summoner?: string
}): Promise<void> {
  if (!props.sheet || !props.update) return

  const sum = options.summoner
    ? props.sheet.rows.filter(r => r.id === options.summoner)[0]
    : undefined

  const row: Partial<InitiativeSheetRow> & { name: string } = {
    ...options.data,
    ...(options.initiative && options.initiative_modifier ? { initiative: +options.initiative + +options.initiative_modifier } : {}),
    ...(options.initiative && !options.initiative_modifier ? { initiative: +options.initiative } : {}),
    ...(sum ? { summoner: { name: sum.name, id: sum.id } } : {}),
    ...(isDefined(options.initiative_modifier) ? { initiative_modifier: +options.initiative_modifier } : {}),
  }

  const rows = [...props.sheet.rows]
  const type = (form.values.type ?? 'player') as HomebrewType

  for (let i = 0; i < options.amount; i++) {
    rows.push(createInitiativeRow(row, type, rows.length))
  }

  const sortedRows = indexCorrect(rows)

  await props.update({ rows: sortedRows })
}

function castActionFieldsToNumber(actions: Action[]): Action[] {
  if (!actions) return []

  return actions.map((action) => {
    return {
      ...action,
      ...(action.damage_bonus && !isNaN(+action.damage_bonus) ? { damage_bonus: +action.damage_bonus } : {}),
      ...(action.attack_bonus && !isNaN(+action.attack_bonus) ? { attack_bonus: +action.attack_bonus } : {}),
    }
  })
}
</script>

<template>
  <UiFormWrapper @submit="onSubmit">
    <UiTabs v-model="activeTab">
      <UiTabsList class="grid w-full grid-cols-2">
        <UiTabsTrigger value="info">
          {{ $t('general.info') }}
        </UiTabsTrigger>
        <UiTabsTrigger value="actions">
          {{ $t('general.actions') }}
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

      <div class="flex gap-2">
        <UiButton
          v-tippy="$t('actions.prev')"
          type="button"
          variant="foreground"
          size="icon"
          class="min-w-10"
          :disabled="activeTab === 'info'"
          @click="activeTab = 'info'"
        >
          <Icon name="tabler:arrow-left" />
        </UiButton>
        <UiButton
          v-tippy="$t('actions.next')"
          type="button"
          variant="foreground"
          size="icon"
          class="min-w-10"
          :disabled="activeTab === 'actions'"
          @click="activeTab = 'actions'"
        >
          <Icon name="tabler:arrow-right" />
        </UiButton>
        <UiButton
          type="submit"
          class="w-full"
        >
          {{ $t('actions.save') }}
        </UiButton>
      </div>
    </div>
  </UiFormWrapper>
</template>

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

interface FormAction {
  actionType: DndActionType
  name: string
  desc: string
  attackBonus?: number
  damageBonus?: number
  damageDice?: string
  spellSave?: number
  spellSaveType?: DndAbility
}

function dndActionToForm(action: DndAction): FormAction {
  const attack = action.attacks[0]

  return {
    actionType: action.actionType,
    name: action.name,
    desc: action.desc,
    attackBonus: attack?.toHitMod || undefined,
    damageBonus: attack?.damageBonus,
    damageDice: formatAttackDice(attack?.damageDieCount, attack?.damageDieType),
    spellSave: attack?.spellSave,
    spellSaveType: attack?.spellSaveType,
  }
}

function formToDndAction(formAction: FormAction): DndAction {
  const dice = parseAttackDice(formAction.damageDice)
  const hasAttack
    = formAction.attackBonus != null
      || dice != null
      || formAction.damageBonus != null
      || formAction.spellSave != null

  const attack: DndAttack | undefined = hasAttack
    ? {
        name: formAction.name,
        attackType: 'melee',
        toHitMod: formAction.attackBonus ?? 0,
        distanceUnit: 'feet',
        ...(dice ?? {}),
        ...(formAction.damageBonus != null ? { damageBonus: formAction.damageBonus } : {}),
        ...(formAction.spellSave != null ? { spellSave: formAction.spellSave } : {}),
        ...(formAction.spellSaveType ? { spellSaveType: formAction.spellSaveType } : {}),
      }
    : undefined

  return {
    name: formAction.name,
    desc: formAction.desc,
    actionType: formAction.actionType,
    attacks: attack ? [attack] : [],
  }
}

const actionInputs = z.array(z.object({
  actionType: z.enum(actionType),
  name: z.string().min(3).max(30),
  desc: z.string().min(10).max(1000),
  attackBonus: z.number().gte(1).lte(100).optional(),
  damageBonus: z.number().min(1).lte(100).optional(),
  damageDice: z.string().min(3).max(15).regex(diceExpression, t('zod.diceExpression')).optional().or(z.literal('')),
  spellSave: z.number().min(1).lte(100).optional(),
  spellSaveType: z.union([z.enum(abilityType), z.literal('none'), z.literal('')]).optional().transform(val => !val || val === 'none' ? undefined : val),
})).max(40)

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
  actions: actionInputs,
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
    actions: (props.item?.actions ?? []).map(dndActionToForm),
  },
})

const saveToCampaign = ref<boolean>(false)
const activeTab = ref<string>('info')
const formError = ref<string>('')

const { mutateAsync: createHomebrew } = useHomebrewCreate()
const { mutateAsync: updateHomebrew } = useHomebrewUpdate()

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  const { amount, initiative, initiativeModifier, summoner, ...rest } = values

  const formData = {
    ...rest,
    actions: (values.actions as FormAction[]).map(formToDndAction),
  }
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
      <UiTabsList class="grid w-full grid-cols-2">
        <UiTabsTrigger value="info">
          {{ $t('general.info') }}
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

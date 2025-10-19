<script setup lang="ts">
import { getNode, reset } from '@formkit/core'
import { useHomebrewCreate, useHomebrewUpdate } from '~~/queries/homebrews'

const emit = defineEmits<{ close: [] }>()

const props = withDefaults(
  defineProps<{
    campaignId?: number
    count: number
    item?: HomebrewItemRow
    saveToCampaign?: boolean
    sheet?: InitiativeSheet
    update?: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
  }>(), {
    saveToCampaign: false,
  },
)

defineExpose({
  next: () => getNode('multi-step')?.next(),
  previous: () => getNode('multi-step')?.previous(),
})

const { mutateAsync: createHomebrew } = useHomebrewCreate()
const { mutateAsync: updateHomebrew } = useHomebrewUpdate()

const type = ref(props.item?.type || 'player')

const summonersOptions = computed<Option<string>[]>(() => {
  if (props.sheet?.rows) {
    return props.sheet.rows
      .filter(r => r.type !== 'summon')
      .map(o => ({ label: o.name, value: o.id }))
  }
  else return []
})

interface HomebrewItemForm extends Omit<HomebrewItemInsert, 'campaign' | NotUpdatable> {
  amount?: number
  initiative?: number
  summoner?: string
}

async function handleSubmit(form: HomebrewItemForm, node: FormNode): Promise<void> {
  node.clearErrors()

  const steps = sanitizeForm<HomebrewItemForm>(form)
  const flatForm = flattenObject<HomebrewItemForm>(steps)
  const { amount, initiative, initiative_modifier, summoner, ...rest } = flatForm

  const formData = {
    ...rest,
    actions: castActionFieldsToNumber(flatForm.actions),
    reactions: castActionFieldsToNumber(flatForm.reactions),
    legendary_actions: castActionFieldsToNumber(flatForm.legendary_actions),
    special_abilities: castActionFieldsToNumber(flatForm.special_abilities),
  }

  const onSuccess = () => emit('close')

  const onError = (error: string) => {
    reset('Homebrew')
    node.setErrors(error)
  }

  if (props.sheet) {
    addInitiative({
      data: formData as InitiativeSheetRowInsert,
      amount: amount ?? 1,
      initiative,
      initiative_modifier: isDefined(initiative_modifier) ? initiative_modifier : undefined,
      summoner,
    })

    // Also save homebrew to campaign
    if (props.saveToCampaign && props.campaignId) {
      await create({
        data: {
          ...formData,
          ...(isDefined(initiative_modifier) ? { initiative_modifier } : {}),
          campaign: props.campaignId,
        },
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
        data: {
          ...formData,
          ...(isDefined(initiative_modifier) ? { initiative_modifier } : {}),
        },
        id: props.item.id,
        onSuccess,
        onError,
      })
    }
    else if (props.campaignId) {
      await create({
        data: {
          ...formData,
          ...(isDefined(initiative_modifier) ? { initiative_modifier } : {}),
          campaign: props.campaignId,
        },
        onSuccess,
        onError,
      })
    }
  }
}

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
  }

  const rows = [...props.sheet.rows]

  for (let i = 0; i < options.amount; i++) {
    rows.push(createInitiativeRow(row, type.value, rows.length))
  }

  const sortedRows = indexCorrect(rows)

  await props.update({ rows: sortedRows })
}

function castActionFieldsToNumber(actions: Action[] | undefined): Action[] {
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
  <FormKit
    id="Homebrew"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      id="multi-step"
      type="multi-step"
      name="steps"
      wrapper-class="w-full !max-w-none"
      steps-class="!border-none !p-0 border border-green-500"
      outer-class="$remove:mb-4"
      tabs-class="!mt-0 mb-4 gap-2"
      tab-class="rounded-lg"
      tab-label-class="!font-bold"
    >
      <FormKit
        type="step"
        name="info"
      >
        <div
          :class="{
            'grid sm:grid-cols-2 gap-x-3': (type === 'monster' || type === 'summon') && sheet,
          }"
        >
          <FormKit
            v-model="type"
            type="select"
            name="type"
            :label="$t('components.inputs.typeLabel')"
            :placeholder="$t('components.inputs.nothing')"
            validation="required"
            :options="[
              { label: $t('general.player'), value: 'player' },
              { label: $t('general.summon'), value: 'summon' },
              { label: $t('general.npc'), value: 'npc' },
              { label: $t('general.monster'), value: 'monster' },
              { label: $t('general.lair'), value: 'lair' },
            ]"
            outer-class="grow"
          />
          <FormKit
            v-if="(type === 'monster' || type === 'summon') && sheet"
            :value="1"
            name="amount"
            type="number"
            number
            :min="1"
            :max="15"
            :label="$t('components.inputs.amountLabel')"
            validation="between:1,15|number|required"
            outer-class="grow"
          />
        </div>
        <FormKit
          v-if="sheet && type === 'summon'"
          type="select"
          name="summoner"
          :label="$t('components.inputs.summonerLabel')"
          :placeholder="$t('components.inputs.nothing')"
          :options="summonersOptions"
          validation="required"
        />
        <div :class="{ 'grid sm:grid-cols-2 gap-x-3': type === 'player' && !sheet }">
          <FormKit
            name="name"
            :value="item?.name"
            :label="$t('components.inputs.nameLabel')"
            validation="required|length:3,30"
            outer-class="grow"
            suffix-icon="tabler:arrows-shuffle-2"
            @suffix-icon-click="(node: FormNode) => node.input(randomName())"
          />
          <FormKit
            v-if="type === 'player' && !sheet"
            name="player"
            :value="item?.player"
            :label="$t('components.inputs.playerLabel')"
            validation="length:3,30"
            outer-class="grow"
          />
        </div>
        <div :class="{ 'grid sm:grid-cols-2 gap-x-3': sheet }">
          <FormKit
            v-if="sheet"
            name="initiative"
            type="number"
            number
            :min="1"
            :max="50"
            :label="$t('components.inputs.initiativeLabel')"
            validation="between:1,50|number"
            suffix-icon="tabler:hexagon"
            @suffix-icon-click="(node: FormNode) => node.input(randomRoll(20))"
          />
          <FormKit
            name="initiative_modifier"
            type="number"
            number
            :value="item?.initiative_modifier ? +item.initiative_modifier : undefined"
            :label="`${$t('components.inputs.initiativeLabel')} (MODIFIER)`"
            :max="20"
            :min="-20"
            validation="between:-20,20|number"
          />
        </div>
        <div
          v-if="type !== 'lair'"
          class="grid sm:grid-cols-2 gap-x-3"
        >
          <FormKit
            name="ac"
            type="number"
            number
            :value="item?.ac ?? undefined"
            :label="$t('components.inputs.acLabel')"
            :max="100"
            :min="1"
            validation="between:1,100|number"
            outer-class="grow"
          />
          <FormKit
            name="health"
            type="number"
            number
            :value="item?.health ?? undefined"
            :label="$t('components.inputs.hpLabel')"
            :max="1000"
            :min="1"
            validation="between:1,1000|number"
            outer-class="grow"
          />
        </div>
        <FormKit
          name="link"
          type="url"
          :value="item?.link ?? undefined"
          :label="$t('components.inputs.linkLabel')"
          validation="url"
        />
        <template #stepNext />
      </FormKit>
      <FormKit
        type="step"
        name="actions"
      >
        <FormKit
          type="repeater"
          name="actions"
          :value="item?.actions || []"
          :label="$t('components.inputs.actionsLabel')"
          :add-label="$t('actions.add')"
          max="10"
          min="0"
        >
          <FormAttackInputs type="actions" />
          <template #moveUpIcon>
            <Icon name="tabler:arrow-narrow-up" />
          </template>
          <template #removeIcon>
            <Icon name="tabler:trash" />
          </template>
          <template #moveDownIcon>
            <Icon name="tabler:arrow-narrow-down" />
          </template>
        </FormKit>
        <FormKit
          type="repeater"
          name="reactions"
          :value="item?.reactions || []"
          :label="$t('components.inputs.reactionsLabel')"
          :add-label="$t('actions.add')"
          max="10"
          min="0"
        >
          <FormAttackInputs type="reactions" />
          <template #moveUpIcon>
            <Icon name="tabler:arrow-narrow-up" />
          </template>
          <template #removeIcon>
            <Icon name="tabler:trash" />
          </template>
          <template #moveDownIcon>
            <Icon name="tabler:arrow-narrow-down" />
          </template>
        </FormKit>
        <FormKit
          type="repeater"
          name="legendary_actions"
          :value="item?.legendary_actions || []"
          :label="$t('components.inputs.legendaryActionsLabel')"
          :add-label="$t('actions.add')"
          max="10"
          min="0"
        >
          <FormAttackInputs type="reactions" />
          <template #moveUpIcon>
            <Icon name="tabler:arrow-narrow-up" />
          </template>
          <template #removeIcon>
            <Icon name="tabler:trash" />
          </template>
          <template #moveDownIcon>
            <Icon name="tabler:arrow-narrow-down" />
          </template>
        </FormKit>
        <FormKit
          type="repeater"
          name="special_abilities"
          :value="item?.special_abilities || []"
          :label="$t('components.inputs.specialAbilitiesLabel')"
          :add-label="$t('actions.add')"
          max="10"
          min="0"
        >
          <FormAttackInputs type="special_abilities" />
          <template #moveUpIcon>
            <Icon name="tabler:arrow-narrow-up" />
          </template>
          <template #removeIcon>
            <Icon name="tabler:trash" />
          </template>
          <template #moveDownIcon>
            <Icon name="tabler:arrow-narrow-down" />
          </template>
        </FormKit>

        <template #stepPrevious />
      </FormKit>
    </FormKit>
  </FormKit>
</template>

<style>
:root {
  --multistep-color-success: hsl(var(--success) / 0.5);
  --multistep-color-border: transparent;
}

.formkit-outer[data-type='multi-step'] .formkit-badge {
  background: hsl(var(--destructive));
  color: white;
}

.formkit-outer[data-type='multi-step'] > .formkit-wrapper > .formkit-steps {
  display: flex;
  flex-direction: column;
}

.formkit-step {
  flex: 1;
}

.formkit-outer[data-type='multi-step']
  > [data-tab-style='tab']
  > .formkit-tabs {
    background: transparent;
}

.formkit-outer[data-type='multi-step']
  > [data-tab-style='tab']
  > .formkit-tabs
  .formkit-tab {
    background: hsl(var(--background) / 0.5);
    border: 4px solid hsl(var(--background));
    padding: 0.5rem;
}

.formkit-outer[data-type='multi-step']
  > [data-tab-style='tab']
  > .formkit-tabs
  .formkit-tab[data-active='true'] {
    background: hsl(var(--foreground) / 0.5);
    border: 4px solid hsl(var(--foreground));
    color: hsl(var(--background));
}
</style>

<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{ close: [] }>()

const props = withDefaults(
  defineProps<{
    campaignId: number
    count: number
    item?: HomebrewItemRow
    encounterId?: number
  }>(), {
    encounterId: undefined,
  },
)

const { mutateAsync: createHomebrew } = useHomebrewCreate()
const { mutateAsync: updateHomebrew } = useHomebrewUpdate()
const { mutateAsync: updateInitiativeSheet } = useInitiativeSheetDetailUpdate()

const max = 100

interface HomebrewItemForm extends Omit<HomebrewItemInsert, 'campaign' | NotUpdatable> {
  amount?: number
  initiative?: number
  summoner?: string
  save?: boolean
}

// const summonersOptions = computed<Option[]>(() => {
//   if (table.encounter?.rows && props.encounter) {
//     return table.encounter.rows
//       .filter(r => r.type !== 'summon')
//       .map((o) => {
//         return { label: o.name, value: o.id }
//       })
//   }
//   else {
//     return []
//   }
// })

async function handleSubmit(form: HomebrewItemForm, node: FormNode): Promise<void> {
  node.clearErrors()

  const { amount, initiative, summoner, save, ...steps } = sanitizeForm<HomebrewItemForm>(form)
  const flatForm = flattenObject<HomebrewItemForm>(steps)

  const formData = {
    ...flatForm,
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

  if (props.encounterId) {
    addInitiative(formData, amount || 1)

    if (save && props.campaignId) {
      await create({
        data: {
          ...formData,
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
        data: formData,
        id: props.item.id,
        onSuccess,
        onError,
      })
    }
    else {
      await create({
        data: {
          ...formData,
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

async function addInitiative(data: HomebrewItemForm, amount: number): Promise<void> {
  // if (!table.encounter?.rows) {
  //   return
  // }

  // const rows = []

  // if (!amount) {
  //   amount = 1
  // }

  // // Set summoner data when it's an id
  // if (typeof data.summoner === 'number' || typeof data.summoner === 'string') {
  //   const sum = table.encounter.rows.filter(r => r.id === data.summoner)[0]
  //   data.summoner = { name: sum.name, id: +sum.id }
  // }

  // // Add init modifier to initiative when it's set
  // if (!isNaN(+data.initiative) && !isNaN(+data.initiative_modifier)) {
  //   data.initiative = +data.initiative + +data.initiative_modifier
  // }

  // for (let i = 0; i < amount; i++) {
  //   rows.push(useCreateRow(data as Row, form.value.type as RowType, table.encounter.rows))
  // }

  // await table.encounterUpdate({
  //   rows: [...table.encounter.rows, ...rows],
  // } as UpdateEncounter)
}

function castActionFieldsToNumber(actions: Action[]): Action[] {
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
    v-slot="{ value }"
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <FormKit
      id="multi-step"
      type="multi-step"
      name="steps"
      wrapper-class="w-full !max-w-none"
      steps-class="!border-none !p-0"
      outer-class="$remove:mb-4"
      tabs-class="!mt-0 mb-4 !bg-background/50 !rounded-lg"
      tab-class="!text-muted-foreground data-[active=true]:!text-foreground data-[active=true]:!bg-secondary-foreground rounded-lg"
      tab-label-class="!font-bold"
    >
      <FormKit
        type="step"
        name="info"
        :next-label="$t('actions.next')"
        :previous-label="$t('actions.prev')"
      >
        <div
          :class="{
            'grid sm:grid-cols-2 gap-x-3': (value?.type === 'monster' || value?.type === 'summon') && encounterId,
          }"
        >
          <FormKit
            type="select"
            name="type"
            :value="item?.type || 'player'"
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
            v-if="(value?.type === 'monster' || value?.type === 'summon') && encounterId"
            value="1"
            name="amount"
            type="number"
            min="1"
            max="15"
            :label="$t('components.inputs.amountLabel')"
            validation="between:1,15|number|required"
            outer-class="grow"
          />
        </div>
        <FormKit
          v-if="encounterId && value?.type === 'summon'"
          type="select"
          name="summoner"
          :label="$t('components.inputs.summonerLabel')"
          :placeholder="$t('components.inputs.nothing')"
          validation="required"
        />
        <div :class="{ 'grid sm:grid-cols-2 gap-x-3': value?.type === 'player' && !encounterId }">
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
            v-if="value?.type === 'player' && !encounterId"
            name="player"
            :value="item?.player"
            :label="$t('components.inputs.playerLabel')"
            validation="length:3,30"
            outer-class="grow"
          />
        </div>
        <div :class="{ 'grid sm:grid-cols-2 gap-x-3': encounterId }">
          <FormKit
            v-if="encounterId"
            name="initiative"
            type="number"
            min="1"
            max="50"
            :label="$t('components.inputs.initiativeLabel')"
            validation="between:1,50|number"
            suffix-icon="tabler:hexagon"
            @suffix-icon-click="(node: FormNode) => node.input(randomRoll(20))"
          />
          <FormKit
            name="initiative_modifier"
            type="number"
            :value="item?.initiative_modifier?.toString()"
            :label="`${$t('components.inputs.initiativeLabel')} (MODIFIER)`"
            max="20"
            min="-20"
            validation="between:-20,20|number"
          />
        </div>
        <div
          v-if="value?.type !== 'lair'"
          class="grid sm:grid-cols-2 gap-x-3"
        >
          <FormKit
            name="ac"
            type="number"
            :value="item?.ac?.toString()"
            :label="$t('components.inputs.acLabel')"
            min="1"
            max="100"
            validation="between:1,100|number"
            outer-class="grow"
          />
          <FormKit
            name="health"
            type="number"
            :value="item?.health?.toString()"
            :label="$t('components.inputs.hpLabel')"
            min="1"
            max="1000"
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
      </FormKit>
      <FormKit
        type="step"
        name="actions"
        :next-label="$t('actions.next')"
        :previous-label="$t('actions.prev')"
      >
        <FormKit
          type="repeater"
          name="actions"
          :value="item?.actions || []"
          :label="$t('components.inputs.actionsLabel')"
          :add-label="$t('actions.add')"
          max="10"
          min="0"
          :remove-control="true"
        >
          <FormAttackInputs type="actions" />
        </FormKit>
        <FormKit
          type="repeater"
          name="reactions"
          :value="item?.reactions || []"
          :label="$t('components.inputs.reactionsLabel')"
          :add-label="$t('actions.add')"
          max="10"
          min="0"
          :remove-control="true"
        >
          <FormAttackInputs type="reactions" />
        </FormKit>
        <FormKit
          type="repeater"
          name="legendary_actions"
          :value="item?.legendary_actions || []"
          :label="$t('components.inputs.legendaryActionsLabel')"
          :add-label="$t('actions.add')"
          max="10"
          min="0"
          :remove-control="true"
        >
          <FormAttackInputs type="reactions" />
        </FormKit>
        <FormKit
          type="repeater"
          name="special_abilities"
          :value="item?.special_abilities || []"
          :label="$t('components.inputs.specialAbilitiesLabel')"
          :add-label="$t('actions.add')"
          max="10"
          min="0"
          :remove-control="true"
        >
          <FormAttackInputs type="special_abilities" />
        </FormKit>
      </FormKit>
    </FormKit>
    <div
      v-if="encounterId && !$route.fullPath.includes('/playground')"
      class="flex flex-col gap-x-2 mb-2"
    >
      <FormKit
        :disabled="count >= max"
        name="save"
        :label="$t('components.homebrewModal.save')"
        type="toggle"
        outer-class="$reset !mb-0"
      />
      <span
        v-if="count >= max"
        class="text-destructive body-small pb-2"
      >
        {{ $t('components.homebrewModal.max') }}
      </span>
    </div>
  </FormKit>
</template>

<style>
:root {
  --multistep-color-success: #7333E0;
  --multistep-color-border: transparent;
  --multistep-color-destructive: #F87272;
}
</style>

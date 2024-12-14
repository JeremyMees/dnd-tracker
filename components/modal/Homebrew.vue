<script setup lang="ts">
import { reset, type FormKitNode } from '@formkit/core'

const emit = defineEmits<{
  close: []
  finished: []
}>()

const props = withDefaults(
  defineProps<{
    campaignId: number
    item?: HomebrewItemRow
    isEncounter?: boolean
  }>(), {
    isEncounter: false,
  },
)

// const currentStore = useCurrentCampaignStore()
const initiativeSheet = useInitiativeSheet()
const homebrew = useHomebrews()
const { t } = useI18n()

const count = ref<number>(await homebrew.getCount(props.campaignId))
// const form = ref<HomebrewForm>(setForm())

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

function setForm(): HomebrewForm {
  // return {
  //   name: props.item?.name || '',
  //   player: props.item?.player || '',
  //   link: props.item?.link || '',
  //   type: props.item?.type || ('player' as RowType),
  //   initiative: undefined,
  //   initiative_modifier: props.item?.initiative_modifier || undefined,
  //   amount: 1,
  //   summoner: undefined,
  //   ac: props.item?.ac,
  //   health: props.item?.health,
  //   actions: props.item
  //     ? [...props.item.actions, ...props.item.legendary_actions, ...props.item.reactions, ...props.item.special_abilities]
  //     : [],
  //   save: false,
  // }
}

function handleSubmit({ __init, data, slots, save, ...formData }: Obj): void {
  // error.value = ''
  // isLoading.value = true

  // try {
  //   const { actions, ...homebrewData } = formData

  //   homebrewData.actions = []
  //   homebrewData.legendary_actions = []
  //   homebrewData.reactions = []
  //   homebrewData.special_abilities = []

  //   if (actions.length) {
  //     actions.forEach((a: Action) => {
  //       homebrewData[a.type || 'action'] = [...(homebrewData[a.type || 'action'] || []), a].map((o) => {
  //         return {
  //           ...o,
  //           ...(o.damage_bonus && !isNaN(+o.damage_bonus) ? { damage_bonus: +o.damage_bonus } : {}),
  //           ...(o.attack_bonus && !isNaN(+o.attack_bonus) ? { attack_bonus: +o.attack_bonus } : {}),
  //         }
  //       })
  //     })
  //   }

  //   if (props.encounter) {
  //     addInitiative(homebrewData)

  //     if (save && table.encounter?.campaign?.id) {
  //       const { amount, initiative, summoner, ...payload } = homebrewData

  //       addHomebrew(payload, table.encounter.campaign.id)
  //     }
  //   }
  //   else {
  //     delete homebrewData.amount
  //     props.update ? updateHomebrew(homebrewData) : addHomebrew(homebrewData)
  //   }

  //   reset('form')
  //   closeModal()
  // }
  // catch (err: any) {
  //   console.error(err)
  //   error.value = err.message
  // }
  // finally {
  //   isLoading.value = false
  // }
}

async function updateHomebrew(formData: Obj): Promise<void> {
  // if (!props.item?.id) {
  //   return
  // }

  // const updated = removeEmptyKeys<Homebrew>(formData)
  // await homebrewStore.updateHomebrew(updated, props.item.id as number)

  // emit('updated', updated)
}

async function addHomebrew(formData: Obj, id?: number): Promise<void> {
  // await homebrewStore.addHomebrew(
  //   removeEmptyKeys<AddHomebrew>({
  //     ...formData,
  //     campaign: id || currentStore?.campaign?.id,
  //   }),
  // )
}

async function addInitiative({ amount, ...data }: Obj): Promise<void> {
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
</script>

<template>
  <FormKit
    id="form"
    v-slot="{ value }"
    type="form"
    :submit-label="t(`components.homebrewModal.${item ? 'update' : 'add'}`)"
    @submit="handleSubmit"
  >
    <div
      :class="{
        'grid sm:grid-cols-2 gap-x-3': (value?.type === 'monster' || value?.type === 'summon') && isEncounter,
      }"
    >
      <FormKit
        id="type"
        type="select"
        name="type"
        :value="item?.type"
        :label="t('components.inputs.typeLabel')"
        :placeholder="t('components.inputs.nothing')"
        validation="required"
        :options="[
          { label: t('general.player'), value: 'player' },
          { label: t('general.summon'), value: 'summon' },
          { label: t('general.npc'), value: 'npc' },
          { label: t('general.monster'), value: 'monster' },
          { label: t('general.lair'), value: 'lair' },
        ]"
        outer-class="grow"
      />
      <FormKit
        v-if="(value?.type === 'monster' || value?.type === 'summon') && isEncounter"
        value="1"
        name="amount"
        type="number"
        min="1"
        max="15"
        :label="t('components.inputs.amountLabel')"
        validation="between:1,15|number|required"
        outer-class="grow"
      />
    </div>
    <FormKit
      v-if="isEncounter && value?.type === 'summon'"
      type="select"
      name="summoner"
      :label="t('components.inputs.summonerLabel')"
      :placeholder="t('components.inputs.nothing')"
      validation="required"
    />
    <!-- :options="summonersOptions" -->
    <div :class="{ 'grid sm:grid-cols-2 gap-x-3': value?.type === 'player' && !isEncounter }">
      <FormKit
        name="name"
        :label="t('components.inputs.nameLabel')"
        validation="required|length:3,30"
        outer-class="grow"
        suffix-icon="random"
        @suffix-icon-click="(node: FormKitNode) => node.input(randomName())"
      />
      <FormKit
        v-if="value?.type === 'player' && !isEncounter"
        name="player"
        :label="t('components.inputs.playerLabel')"
        validation="length:3,30"
        outer-class="grow"
      />
    </div>
    <div :class="{ 'grid sm:grid-cols-2 gap-x-3': isEncounter }">
      <FormKit
        v-if="isEncounter"
        name="initiative"
        type="number"
        min="1"
        max="50"
        :label="t('components.inputs.initiativeLabel')"
        validation="between:1,50|number"
        suffix-icon="dice"
        @suffix-icon-click="(node: FormKitNode) => node.input(randomRoll(20))"
      />
      <FormKit
        name="initiative_modifier"
        max="20"
        min="-20"
        type="number"
        :label="`${t('components.inputs.initiativeLabel')} (MODIFIER)`"
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
        min="1"
        max="100"
        :label="t('components.inputs.acLabel')"
        validation="between:1,100|number"
        outer-class="grow"
      />
      <FormKit
        name="health"
        type="number"
        min="1"
        max="1000"
        :label="t('components.inputs.hpLabel')"
        validation="between:1,1000|number"
        outer-class="grow"
      />
    </div>
    <FormKit
      name="link"
      type="url"
      :label="t('components.inputs.linkLabel')"
      validation="url"
    />
    <FormKit
      type="repeater"
      name="actions"
      :label="t('components.inputs.actionsLabel')"
      :add-label="t('components.inputs.addActionLabel')"
      :max="20"
      :min="0"
      :remove-control="true"
    >
      <FormKit
        type="select"
        name="type"
        :label="t('components.inputs.actionTypeLabel')"
        :placeholder="t('components.inputs.nothing')"
        validation="required"
        :options="[
          { label: 'Action', value: 'actions' },
          { label: 'Legendary action', value: 'legendary_actions' },
          { label: 'Reaction', value: 'reactions' },
          { label: 'Special ability', value: 'special_abilities' },
        ]"
      />
      <FormKit
        name="name"
        :label="t('components.inputs.nameLabel')"
        validation="required|length:3,30"
      />
      <FormKit
        name="desc"
        type="textarea"
        :label="t('components.inputs.descriptionLabel')"
        validation="required|length:10,1000"
      />
      <div class="flex gap-x-3">
        <FormKit
          name="damage_dice"
          placeholder="2d6"
          :label="t('components.inputs.damageDiceLabel')"
          validation="length:3,15"
          outer-class="grow"
        />
        <FormKit
          name="damage_bonus"
          type="number"
          min="1"
          max="100"
          :label="t('components.inputs.damageBonusLabel')"
          validation="between:1,100|number"
          outer-class="grow"
        />
        <FormKit
          name="attack_bonus"
          type="number"
          min="1"
          max="100"
          :label="t('components.inputs.attackBonusLabel')"
          validation="between:1,100|number"
          outer-class="grow"
        />
      </div>
    </FormKit>
    <div
      v-if="isEncounter && !initiativeSheet.isSandbox && !initiativeSheet.isPlayground"
      class="flex flex-col gap-x-2"
    >
      <FormKit
        :disabled="count >= homebrew.max"
        name="save"
        :label="t('components.homebrewModal.save')"
        type="toggle"
        outer-class="$reset !mb-0"
      />
      <span
        v-if="count >= homebrew.max"
        class="text-danger body-small pb-2"
      >
        {{ t('components.homebrewModal.max') }}
      </span>
    </div>
  </FormKit>
</template>

<script setup lang="ts">
import { abilities, abilitiesNames } from '~~/constants/dnd-rules'

defineProps<{ type: ActionType }>()
</script>

<template>
  <FormKit
    type="hidden"
    name="type"
    :value="type"
  />
  <FormKit
    name="name"
    :label="$t('components.inputs.nameLabel')"
    validation="required|length:3,30"
  />
  <FormKit
    name="desc"
    type="textarea"
    :label="$t('components.inputs.descriptionLabel')"
    validation="required|length:10,1000"
  />
  <UiSeparator class="mb-4" />
  <div class="grid sm:grid-cols-3 gap-x-3">
    <FormKit
      name="damage_dice"
      placeholder="2d6"
      :label="$t('components.inputs.damageDiceLabel')"
      validation="length:3,15"
      outer-class="grow"
    />
    <FormKit
      name="damage_bonus"
      type="number"
      min="1"
      max="100"
      :label="$t('components.inputs.damageBonusLabel')"
      validation="between:1,100|number"
      outer-class="grow"
    />
    <FormKit
      name="attack_bonus"
      type="number"
      min="1"
      max="100"
      :label="$t('components.inputs.attackBonusLabel')"
      validation="between:1,100|number"
      outer-class="grow"
    />
  </div>
  <div class="grid sm:grid-cols-2 gap-x-3">
    <FormKit
      name="spell_save"
      type="number"
      number
      min="1"
      max="100"
      :label="$t('components.inputs.spellSaveLabel')"
      validation="between:1,100|number"
      outer-class="grow"
    />
    <FormKit
      name="spell_save_type"
      type="select"
      :label="$t('components.inputs.saveTypeLabel')"
      :options="[
        { label: $t('components.inputs.nothing'), value: undefined },
        ...abilities.map((ability, index) => ({
          label: abilitiesNames[index] || ability,
          value: ability,
        })),
      ]"
      outer-class="grow"
    />
  </div>
</template>

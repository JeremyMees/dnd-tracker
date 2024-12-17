<script setup lang="ts">
defineProps<{ type: ActionType }>()

const { t } = useI18n()
</script>

<template>
  <FormKit
    type="hidden"
    name="type"
    :value="type"
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
</template>

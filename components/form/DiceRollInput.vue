<script setup lang="ts">
const amount = ref<number>()
const isRollingShown = ref<boolean>(false)
</script>

<template>
  <FormKit
    v-model="amount"
    name="amount"
    number
    type="number"
    :label="$t('components.inputs.amountLabel')"
    validation="required|between:1,1000|number"
    :suffix-icon="!!isRollingShown ? 'tabler:x' : 'tabler:hexagon'"
    @suffix-icon-click="() => isRollingShown = !isRollingShown"
  />
  <AnimationExpand>
    <DiceRoller
      v-if="isRollingShown"
      @rolled="amount = $event"
    />
  </AnimationExpand>
</template>

<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()

const diceRoll = ref()
</script>

<template>
  <FormKit
    id="DiceRoll"
    type="form"
    :actions="false"
    @submit="(form, node) => {
      diceRoll?.roll(form, node)
      emit('close')
    }"
  >
    <FormDiceRoll
      ref="diceRoll"
      form
    />
  </FormKit>
</template>

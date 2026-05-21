<script setup lang="ts">
import { abilityTypeMap } from '~~/constants/dnd'
import type { DndAbilityScores, DndModifiers } from '#shared/types/dnd'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  abilityScores: DndAbilityScores
  modifiers: DndModifiers
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex gap-x-4 gap-y-1 flex-wrap', props.class)">
    <div
      v-for="([key, value]) in Object.entries(abilityTypeMap)"
      :key="key"
      data-test-ability-block
      class="p-1 rounded-lg min-w-16 bg-secondary text-center flex flex-col gap-1"
    >
      <span
        data-test-ability-label
        class="text-muted-foreground"
      >
        {{ key }}
      </span>
      <span data-test-ability-modifier>
        {{ isDefined(modifiers?.[value]) ? formatBonus(modifiers[value]) : '_' }}
      </span>
      <span
        data-test-ability-score
        class="text-xs text-muted-foreground"
      >
        {{ isDefined(abilityScores[value]) ? abilityScores[value] : '_' }}
      </span>
    </div>
  </div>
</template>

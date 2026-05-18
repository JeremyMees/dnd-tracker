<script setup lang="ts">
import { resistanceTypeMap, abilityTypeMap } from '~~/constants/dnd'
import type { DndMonster } from '#shared/types/dnd'

const props = defineProps<{
  creature: DndMonster // TODO: refactor later on so homebrew creatures can also use this
}>()

const resistanceTypes = Object.entries(resistanceTypeMap)
  .map(([key, label]) => ({ key: key as DndResistanceType, label }))

const speedEntries = computed(() => generateSpeedEntries(props.creature.speed))
const sightEntries = computed(() => generateSightEntries(props.creature.sight))
const skillEntries = computed(() => generateSkillEntries(props.creature.skillBonuses))
const isResistant = computed(() => hasResistances(props.creature.resistancesAndImmunities))
</script>

<template>
  <div
    v-if="Object.keys(creature.savingThrows ?? {}).length"
    data-test-saving-throws
  >
    <p class="head-6">
      {{ $t('general.savingThrow', 2) }}
    </p>
    <div class="flex gap-x-4 gap-y-1 flex-wrap">
      <div
        v-for="([key, label]) in Object.entries(abilityTypeMap)"
        :key="`save-${key}`"
        class="flex gap-1"
      >
        <span class="text-muted-foreground">{{ key }}:</span>
        <span>{{ formatBonus(creature.savingThrows[label]) }}</span>
      </div>
    </div>
  </div>

  <div
    v-if="speedEntries.length"
    data-test-speed
  >
    <p class="head-6">
      {{ $t('general.speed') }}
    </p>
    <div class="flex gap-x-4 gap-y-1 flex-wrap">
      <div
        v-for="entry in speedEntries"
        :key="entry.label"
        data-test-speed-entry
        class="flex gap-1"
      >
        <span class="text-muted-foreground">{{ entry.label }}:</span>
        <span>{{ entry.val }}</span>
      </div>
    </div>
  </div>

  <div
    v-if="sightEntries.length"
    data-test-senses
  >
    <p class="head-6">
      {{ $t('general.sense', 2) }}
    </p>
    <div class="flex gap-x-4 gap-y-1 flex-wrap">
      <div
        v-for="entry in sightEntries"
        :key="entry.label"
        data-test-sense-entry
        class="flex gap-1"
      >
        <span class="text-muted-foreground">{{ entry.label }}:</span>
        <span>{{ entry.val }}</span>
      </div>
    </div>
  </div>

  <div
    v-if="skillEntries.length"
    data-test-skills
  >
    <p class="head-6">
      {{ $t('general.skill', 2) }}
    </p>
    <div class="flex gap-x-4 gap-y-1 flex-wrap">
      <div
        v-for="skill in skillEntries"
        :key="skill.key"
        data-test-skill-entry
        class="flex gap-1"
      >
        <span class="text-muted-foreground">{{ skill.label }}:</span>
        <span>{{ formatBonus(skill.val) }}</span>
      </div>
    </div>
  </div>

  <div
    v-if="creature.languages?.length"
    data-test-languages
  >
    <p class="head-6">
      {{ $t('general.language', 2) }}
    </p>
    <p class="text-sm text-muted-foreground">
      {{ creature.languages.map(l => l.name).join(', ') }}
    </p>
  </div>

  <div
    v-if="isResistant"
    data-test-resistances
  >
    <p class="head-6">
      {{ $t('general.resistancesImmunities') }}
    </p>
    <div class="space-y-1">
      <div
        v-for="cat in resistanceTypes"
        :key="cat.key"
      >
        <div
          v-if="creature.resistancesAndImmunities[cat.key]?.length"
          class="flex gap-x-2 gap-y-1 flex-wrap items-center"
        >
          <span class="text-muted-foreground text-sm">{{ cat.label }}:</span>
          <UiBadge
            v-for="val in creature.resistancesAndImmunities[cat.key]"
            :key="val"
            variant="outline"
            class="lowercase"
          >
            {{ val }}
          </UiBadge>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="creature.traits?.length"
    data-test-traits
  >
    <p class="head-6">
      {{ $t('general.trait', 2) }}
    </p>
    <Card
      color="secondary"
      class="p-2"
      as="ul"
    >
      <li
        v-for="trait in creature.traits"
        :key="trait.name"
        data-test-trait
        class="flex w-full flex-col border-b-2 border-secondary py-2 last:border-b-0 last:pb-0 first:pt-0"
      >
        <div class="flex flex-wrap gap-x-4 items-center">
          <p class="font-bold">
            {{ trait.name }}:
          </p>
          <p class="text-sm text-muted-foreground">
            {{ trait.desc }}
          </p>
        </div>
      </li>
    </Card>
  </div>
</template>

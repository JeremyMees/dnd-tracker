<script setup lang="ts">
import type { DndMonster } from '#shared/types/dnd'

defineEmits<{ add: [monster: DndMonster] }>()

withDefaults(
  defineProps<{
    monster: DndMonster
    addable?: boolean
  }>(),
  {
    addable: false,
  },
)

const isOpen = ref<boolean>(false)

const stats: { key: keyof DndMonster; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'size', label: 'Size' },
  { key: 'alignment', label: 'Alignment' },
  { key: 'experiencePoints', label: 'XP' },
]
</script>

<template>
  <UiCard
    class="relative bg-secondary/50 border-secondary border-4"
    @dblclick="isOpen = !isOpen"
  >
    <UiCardHeader>
      <Tooltip v-if="addable" :text="$t('actions.add')" side="left">
        <UiButton
          variant="success-ghost"
          size="icon-sm"
          test-id="add-button"
          :aria-label="$t('actions.add')"
          class="absolute right-4 top-4"
          @click="$emit('add', monster)"
        >
          <Icon name="tabler:plus" class="size-4 min-w-4" aria-hidden="true" />
        </UiButton>
      </Tooltip>
      <UiCardTitle test-id="title">
        {{ monster.name }}
      </UiCardTitle>
      <div class="flex gap-4">
        <Tooltip text="CR">
          <div class="flex gap-1 items-center">
            <Icon
              name="tabler:skull"
              class="size-6 min-w-6 text-warning"
              aria-hidden="true"
            />
            <p class="font-bold">
              {{
                monster.challengeRating != null
                  ? formatChallengeRating(monster.challengeRating)
                  : '_'
              }}
            </p>
          </div>
        </Tooltip>
        <Tooltip text="AC">
          <div class="flex gap-1 items-center">
            <Icon
              name="tabler:shield"
              class="size-6 min-w-6 text-help"
              aria-hidden="true"
            />
            <p class="font-bold">
              {{ monster.armorClass || '_' }}
            </p>
          </div>
        </Tooltip>
        <Tooltip text="HP">
          <div class="flex gap-1 items-center">
            <Icon
              name="tabler:heart"
              class="size-6 min-w-6 text-destructive"
              aria-hidden="true"
            />
            <p class="font-bold">
              {{ monster.hitPoints || '_' }}
            </p>
          </div>
        </Tooltip>
      </div>
    </UiCardHeader>

    <UiCardContent>
      <AbilityScores
        :ability-scores="monster.abilityScores"
        :modifiers="monster.modifiers"
        class="mb-4"
      />

      <div class="flex gap-x-4 gap-y-1 flex-wrap">
        <div v-for="stat in stats" :key="stat.key" class="flex gap-1">
          <span class="text-muted-foreground"> {{ stat.label }}: </span>
          <span class="lowercase">
            {{ monster[stat.key] || '_' }}
          </span>
        </div>
      </div>

      <div class="flex gap-x-2 gap-y-1 flex-wrap mt-2">
        <UiBadge v-if="monster.proficiencyBonus" variant="outline">
          <span class="text-muted-foreground mr-2">
            {{ $t('general.proficiencyBonus') }}:
          </span>
          +{{ monster.proficiencyBonus }}
        </UiBadge>
        <UiBadge v-if="monster.initiativeBonus" variant="outline">
          <span class="text-muted-foreground mr-2">
            {{ $t('general.initiativeBonus') }}:
          </span>
          +{{ monster.initiativeBonus }}
        </UiBadge>
        <UiBadge v-if="monster.passivePerception" variant="outline">
          <span class="text-muted-foreground mr-2">
            {{ $t('general.passivePerception') }}:
          </span>
          {{ monster.passivePerception }}
        </UiBadge>
      </div>

      <div v-if="isOpen" class="space-y-4 pt-2">
        <CreatureStats test-id="stats" :creature="monster" />

        <ActionsTable
          v-if="monster.actions?.length"
          test-id="actions-table"
          :actions="monster.actions"
        />
      </div>
    </UiCardContent>

    <UiCardFooter>
      <div class="flex justify-end w-full">
        <UiButton
          test-id="expand-button"
          variant="secondary-ghost"
          class="flex gap-2 text-foreground"
          :aria-label="$t(`actions.read${isOpen ? 'Less' : 'More'}`)"
          @click="isOpen = !isOpen"
        >
          <p>
            {{ $t(`actions.read${isOpen ? 'Less' : 'More'}`) }}
          </p>
          <Icon
            name="tabler:chevron-down"
            class="duration-200 size-6 stroke-2"
            :class="{ 'rotate-180': isOpen }"
            aria-hidden="true"
          />
        </UiButton>
      </div>
    </UiCardFooter>
  </UiCard>
</template>

<script setup lang="ts">
import { abilities, abilitiesNames } from '~~/constants/dnd'

defineEmits<{ add: [monster: DndMonster] }>()

const props = withDefaults(defineProps<{
  monster: DndMonster
  addable?: boolean
}>(), {
  addable: false,
})

const names = ref(abilitiesNames)
const isOpen = ref<boolean>(false)

const stats: { key: keyof DndMonster, label: string }[] = [
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
      <UiButton
        v-if="addable"
        v-tippy="{
          content: $t('actions.add'),
          placement: 'left',
        }"
        variant="success-ghost"
        size="icon-sm"
        data-test-add-button
        :aria-label="$t('actions.add')"
        class="absolute right-4 top-4"
        @click="$emit('add', monster)"
      >
        <Icon
          name="tabler:plus"
          class="size-4 min-w-4"
          aria-hidden="true"
        />
      </UiButton>
      <UiCardTitle data-test-title>
        {{ monster.name }}
      </UiCardTitle>
      <div class="flex gap-4">
        <div
          v-tippy="{ content: 'CR' }"
          class="flex gap-1 items-center"
        >
          <Icon
            name="tabler:skull"
            class="size-6 min-w-6 text-warning"
            aria-hidden="true"
          />
          <p class="font-bold">
            {{ monster.challengeRating != null ? formatChallengeRating(monster.challengeRating) : '_' }}
          </p>
        </div>
        <div
          v-tippy="{ content: 'AC' }"
          class="flex gap-1 items-center"
        >
          <Icon
            name="tabler:shield"
            class="size-6 min-w-6 text-help"
            aria-hidden="true"
          />
          <p class="font-bold">
            {{ monster.armorClass || '_' }}
          </p>
        </div>
        <div
          v-tippy="{ content: 'HP' }"
          class="flex gap-1 items-center"
        >
          <Icon
            name="tabler:heart"
            class="size-6 min-w-6 text-destructive"
            aria-hidden="true"
          />
          <p class="font-bold">
            {{ monster.hitPoints || '_' }}
          </p>
        </div>
      </div>
    </UiCardHeader>
    <UiCardContent>
      <div class="flex gap-x-4 gap-y-1 flex-wrap">
        <div
          v-for="(ability, index) in abilities"
          :key="ability"
          class="flex gap-1"
        >
          <span class="text-muted-foreground">
            {{ ability }}:
          </span>
          <span>
            {{ names[index] ? monster.abilityScores[names[index] as keyof DndAbilityScores] : '_' }}
          </span>
        </div>
      </div>
      <div class="flex gap-x-4 gap-y-1 flex-wrap">
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="flex gap-1"
        >
          <span class="text-muted-foreground">
            {{ stat.label }}:
          </span>
          <span class="lowercase">
            {{ monster[stat.key] || '_' }}
          </span>
        </div>
      </div>
      <ActionsTable
        v-if="monster.actions?.length && isOpen"
        data-test-actions-table
        :actions="monster.actions"
        :class="{ 'py-5': isOpen }"
      />
    </UiCardContent>
    <UiCardFooter>
      <div class="flex justify-end w-full">
        <UiButton
          data-test-expand-button
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

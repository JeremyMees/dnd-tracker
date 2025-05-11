<script setup lang="ts">
import { abilities } from '~~/constants/dnd-rules'

defineEmits<{ add: [monster: Open5eItem] }>()

withDefaults(defineProps<{
  monster: Open5eItem
  addable?: boolean
}>(), {
  addable: false,
})

const abilitiesNames = ref<(keyof Open5eItem)[]>(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'])
const stats = ref<(keyof Open5eItem)[]>(['type', 'subtype', 'size', 'alignment', 'xp'])
const isOpen = ref<boolean>(false)
</script>

<template>
  <UiCard
    class="relative bg-background/50 border-4 border-background"
    @dblclick="isOpen = !isOpen"
  >
    <UiCardHeader>
      <button
        v-if="addable"
        v-tippy="{
          content: $t('actions.add'),
          placement: 'left',
        }"
        :aria-label="$t('actions.add')"
        class="absolute right-4 top-4 icon-btn-success"
        @click="$emit('add', monster)"
      >
        <Icon
          name="tabler:plus"
          class="size-4 min-w-4"
          aria-hidden="true"
        />
      </button>
      <UiCardTitle>{{ monster.name }}</UiCardTitle>
      <div class="flex gap-4">
        <div
          v-tippy="{ content: 'CR' }"
          class="flex gap-1"
        >
          <Icon
            name="tabler:skull"
            class="w-6 h-6 text-warning"
            aria-hidden="true"
          />
          <p class="font-bold">
            {{ monster.challenge_rating || '_' }}
          </p>
        </div>
        <div
          v-tippy="{ content: 'AC' }"
          class="flex gap-1"
        >
          <Icon
            name="tabler:shield"
            class="w-6 h-6 text-help"
            aria-hidden="true"
          />
          <p class="font-bold">
            {{ monster.armor_class || '_' }}
          </p>
        </div>
        <div
          v-tippy="{ content: 'HP' }"
          class="flex gap-1"
        >
          <Icon
            name="tabler:heart"
            class="w-6 h-6 text-destructive"
            aria-hidden="true"
          />
          <p class="font-bold">
            {{ monster.hit_points || '_' }}
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
            {{ abilitiesNames[index] ? monster[abilitiesNames[index]] : '_' }}
          </span>
        </div>
      </div>
      <div class="flex gap-x-4 gap-y-1 flex-wrap">
        <template
          v-for="stat in stats"
          :key="stat"
        >
          <div
            v-if="monster[stat]"
            class="flex gap-1"
          >
            <span class="text-muted-foreground">
              {{ stat }}:
            </span>
            <span class="lowercase">
              {{ monster[stat] || '_' }}
            </span>
          </div>
        </template>
      </div>
      <ActionsTable
        v-if="monster.actions && isOpen"
        :actions="monster.actions"
        :legendary-actions="monster.legendary_actions"
        :special-abilities="monster.special_abilities"
        :reactions="monster.reactions"
        :class="{ 'py-5': isOpen }"
      />
    </UiCardContent>
    <UiCardFooter>
      <div class="flex justify-end w-full">
        <button
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
        </button>
      </div>
    </UiCardFooter>
  </UiCard>
</template>

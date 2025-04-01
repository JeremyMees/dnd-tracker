<script setup lang="ts">
const props = defineProps<{
  specialAbilities?: (Action | ActionOpen5E)[]
  legendaryActions?: (Action | ActionOpen5E)[]
  actions?: (Action | ActionOpen5E)[]
  reactions?: (Action | ActionOpen5E)[]
}>()

const allActions = computed<Option<Action[]>[]>(() => [
  { label: 'specialAbility', value: props.specialAbilities },
  { label: 'legendaryAction', value: props.legendaryActions },
  { label: 'action', value: props.actions },
  { label: 'reaction', value: props.reactions },
].filter((action): action is Option<Action[]> => !!action.value?.length),
)
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="{ label, value } in allActions"
      :key="label"
      class="space-y-2"
    >
      <p class="head-3">
        {{ $t(`general.${label}`, 2) }}
      </p>
      <Card
        color="secondary"
        class="p-2"
      >
        <ul
          v-for="action in value"
          :key="action.name"
          class="flex w-full flex-col border-b-2 border-secondary py-2 last:border-b-0 last:pb-0 first:pt-0 list-disc"
        >
          <li class="flex flex-wrap gap-x-4 items-center">
            <p class="font-bold">
              {{ action.name }}:
            </p>
            <p class="body-small text-muted-foreground">
              {{ action.desc }}
            </p>
          </li>
          <div
            v-if="action.attack_bonus || action.damage_dice"
            class="flex flex-wrap gap-x-4 items-center mt-2"
          >
            <div
              v-if="action.attack_bonus"
              class="flex flex-wrap gap-x-2 items-center"
            >
              <p class="font-bold">
                To hit:
              </p>
              <p class="body-small text-muted-foreground">
                +{{ action.attack_bonus }}
              </p>
            </div>
            <div
              v-if="action.damage_dice"
              class="flex flex-wrap gap-x-2 items-center"
            >
              <p class="font-bold">
                Dice:
              </p>
              <p class="body-small text-muted-foreground">
                {{ action.damage_dice }}
                <span v-if="action.damage_bonus">
                  +{{ action.damage_bonus }}
                </span>
              </p>
            </div>
          </div>
        </ul>
      </Card>
    </div>
  </div>
</template>

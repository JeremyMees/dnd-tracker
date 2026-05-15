<script setup lang="ts">
const props = defineProps<{ actions: DndAction[] }>()

const groupOrder: DndActionType[] = [
  'specialAbility',
  'action',
  'bonusAction',
  'reaction',
  'legendaryAction',
  'mythicAction',
  'lairAction',
]

const groupLabel: Record<DndActionType, string> = {
  specialAbility: 'specialAbility',
  action: 'action',
  bonusAction: 'bonusAction',
  reaction: 'reaction',
  legendaryAction: 'legendaryAction',
  mythicAction: 'mythicAction',
  lairAction: 'lairAction',
}

const grouped = computed(() => {
  return groupOrder
    .map(actionType => ({
      actionType,
      label: groupLabel[actionType],
      items: props.actions.filter(a => a.actionType === actionType),
    }))
    .filter(group => group.items.length > 0)
})
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="group in grouped"
      :key="group.actionType"
      class="space-y-2"
    >
      <p class="head-4">
        {{ $t(`general.${group.label}`, 2) }}
      </p>
      <Card
        color="secondary"
        class="p-2"
        as="ul"
      >
        <li
          v-for="action in group.items"
          :key="action.name"
          class="flex w-full flex-col border-b-2 border-secondary py-2 last:border-b-0 last:pb-0 first:pt-0 list-disc"
        >
          <div class="flex flex-wrap gap-x-4 items-center">
            <p class="font-bold">
              {{ action.name }}:
            </p>
            <p class="text-sm text-muted-foreground">
              {{ action.desc }}
            </p>
          </div>
          <template
            v-for="(attack, i) in action.attacks"
            :key="i"
          >
            <div
              v-if="attack.toHitMod || attack.damageDieCount || attack.spellSave"
              class="flex flex-wrap gap-x-4 items-center mt-2"
            >
              <p
                v-if="action.attacks.length > 1"
                class="w-full text-xs text-muted-foreground italic"
              >
                {{ attack.name || `Attack ${i + 1}` }}
              </p>
              <div
                v-if="attack.toHitMod"
                class="flex flex-wrap gap-x-2 items-center"
              >
                <p class="font-bold">
                  To hit:
                </p>
                <p class="text-sm text-muted-foreground">
                  +{{ attack.toHitMod }}
                </p>
              </div>
              <div
                v-if="attack.damageDieCount && attack.damageDieType"
                class="flex flex-wrap gap-x-2 items-center"
              >
                <p class="font-bold">
                  Dice:
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ attack.damageDieCount }}{{ attack.damageDieType }}
                  <span v-if="attack.damageBonus">
                    +{{ attack.damageBonus }}
                  </span>
                </p>
              </div>
              <div
                v-if="attack.spellSave"
                class="flex flex-wrap gap-x-2 items-center"
              >
                <p class="font-bold">
                  Save:
                </p>
                <p class="text-sm text-muted-foreground">
                  DC {{ attack.spellSave }}<span v-if="attack.spellSaveType"> ({{ attack.spellSaveType }})</span>
                </p>
              </div>
            </div>
          </template>
        </li>
      </Card>
    </div>
  </div>
</template>

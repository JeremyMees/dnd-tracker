<script setup lang="ts">
const props = withDefaults(defineProps<{
  actions: DndAction[]
  id?: string
  allowRoll?: boolean
}>(), {
  allowRoll: false,
})

const groupOrder: DndActionType[] = [
  'specialAbility',
  'action',
  'bonusAction',
  'reaction',
  'legendaryAction',
  'mythicAction',
  'lairAction',
]

const grouped = computed(() =>
  groupOrder
    .map(actionType => ({
      actionType,
      items: props.actions.filter(a => a.actionType === actionType),
    }))
    .filter(group => group.items.length > 0),
)

function hasRoll(attack: DndAttack): boolean {
  return !!(attack.toHitMod || attack.damageDieCount)
}
</script>

<template>
  <div
    v-if="actions.length"
    class="space-y-4"
  >
    <div
      v-for="group in grouped"
      :key="group.actionType"
      class="space-y-2"
    >
      <p class="head-6">
        {{ $t(`general.${group.actionType}`, 2) }}
      </p>
      <Card
        color="secondary"
        class="p-2"
        as="ul"
      >
        <li
          v-for="action in group.items"
          :key="action.name"
          class="text-sm flex w-full flex-col border-b-2 border-secondary py-2 last:border-b-0 last:pb-0 first:pt-0"
        >
          <div class="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
            <p class="font-bold">
              {{ action.name }}:
            </p>
            <span
              v-if="action.legendaryActionCost"
              class="text-xs text-muted-foreground italic"
            >
              ({{ $t('components.actionsTable.cost', { cost: action.legendaryActionCost }, action.legendaryActionCost) }})
            </span>
            <span
              v-if="action.usageLimits"
              class="text-xs bg-muted px-1.5 py-0.5 rounded"
            >
              {{ formatUsageLimits(action.usageLimits) }}
            </span>
          </div>
          <div class="text-muted-foreground">
            {{ action.desc }}
          </div>

          <p
            v-if="action.limitedToForm"
            class="text-xs text-muted-foreground italic mt-0.5"
          >
            {{ $t('components.actionsTable.form', { form: action.limitedToForm }) }}
          </p>

          <template
            v-for="(attack, i) in action.attacks"
            :key="i"
          >
            <div class="mt-2 flex flex-col gap-1">
              <p
                v-if="action.attacks.length > 1"
                class="text-xs text-muted-foreground italic"
              >
                {{ attack.name || `Attack ${i + 1}` }}
              </p>

              <div class="flex flex-wrap gap-x-4 gap-y-1 items-center">
                <InitiativeActionRoll
                  v-if="allowRoll && id && hasRoll(attack)"
                  :id="id"
                  :attack-bonus="attack.toHitMod"
                  :damage-dice="formatAttackDice(attack.damageDieCount, attack.damageDieType)"
                  :damage-bonus="attack.damageBonus ?? 0"
                />

                <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {{ $t(`general.${attack.attackType}`) }}
                </span>

                <div
                  v-if="attack.toHitMod"
                  class="flex gap-x-1 items-center"
                >
                  <span class="font-semibold">To hit:</span>
                  <span class="text-muted-foreground">+{{ attack.toHitMod }}</span>
                </div>

                <div
                  v-if="formatRange(attack)"
                  class="flex gap-x-1 items-center"
                >
                  <span class="font-semibold">{{ attack.reach !== undefined ? 'Reach' : 'Range' }}:</span>
                  <span class="text-muted-foreground">{{ formatRange(attack) }}</span>
                </div>

                <span
                  v-if="attack.targetCreatureOnly"
                  class="text-xs text-muted-foreground italic"
                >
                  ({{ $t('components.actionsTable.oneTarget') }})
                </span>
              </div>

              <div
                v-if="attack.damageDieCount || attack.spellSave"
                class="flex flex-wrap gap-x-4 gap-y-1 items-center"
              >
                <div
                  v-if="attack.damageDieCount && attack.damageDieType"
                  class="flex gap-x-1 items-center"
                >
                  <span class="font-semibold">Damage:</span>
                  <span class="text-muted-foreground">
                    {{ attack.damageDieCount }}{{ attack.damageDieType }}
                    <template v-if="attack.damageBonus"> + {{ attack.damageBonus }}</template>
                    <template v-if="attack.damageType"> ({{ attack.damageType }})</template>
                  </span>
                </div>

                <div
                  v-if="attack.extraDamageDieCount && attack.extraDamageDieType"
                  class="flex gap-x-4 items-center"
                >
                  <span class="font-semibold">+</span>
                  <span class="text-muted-foreground">
                    {{ attack.extraDamageDieCount }}{{ attack.extraDamageDieType }}
                    <template v-if="attack.extraDamageBonus"> + {{ attack.extraDamageBonus }}</template>
                    <template v-if="attack.extraDamageType"> ({{ attack.extraDamageType }})</template>
                  </span>
                </div>

                <div
                  v-if="attack.spellSave"
                  class="flex gap-x-1 items-center"
                >
                  <span class="font-semibold">Save:</span>
                  <span class="text-muted-foreground">
                    DC {{ attack.spellSave }}
                    <template v-if="attack.spellSaveType"> ({{ attack.spellSaveType }})</template>
                  </span>
                </div>
              </div>
            </div>
          </template>
        </li>
      </Card>
    </div>
  </div>
  <p
    v-else
    class="text-sm text-muted-foreground"
  >
    {{ $t('components.encounterTable.noActions') }}
  </p>
</template>

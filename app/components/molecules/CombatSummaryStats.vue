<script setup lang="ts">
const STAGGER_STEP = 0.05

const props = defineProps<{ stats: CombatStats }>()

const reduced = useReducedMotion()

const totals = computed(() => {
  const value = props.stats

  return [
    { key: 'rounds', value: value.rounds },
    { key: 'damage', value: value.damageTaken },
    { key: 'healing', value: value.healingReceived },
    { key: 'downed', value: value.timesDowned },
    { key: 'deaths', value: value.deaths },
    { key: 'conditions', value: value.conditionsApplied },
    { key: 'concentration', value: value.concentrationBroken },
  ]
})

const awardIcon: Record<CombatAward, string> = {
  died: 'tabler:grave',
  mostDamageTaken: 'tabler:sword',
  mostTimesDowned: 'tabler:mood-off',
  biggestHit: 'tabler:flame',
  mostDeathSavesFailed: 'tabler:skull',
  mostHealingReceived: 'tabler:heart-plus',
  mostDeathSavesMade: 'tabler:heart-bolt',
  mostConditions: 'tabler:bolt',
  mostConcentrationBroken: 'tabler:circle-dotted',
  mostTempHitPoints: 'tabler:shield-half',
  unscathed: 'tabler:mood-smile',
}

const deathSavesIndex = computed<number>(() => totals.value.length)
const awardsTitleIndex = computed<number>(() => deathSavesIndex.value + 1)

function awardLabel(combatant: CombatantStats): string {
  const scope = combatant.awardExclusive ? 'exclusive' : 'plain'

  return `components.combatSummary.awards.${scope}.${combatant.award}`
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div test-id="totals" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Motion
        v-for="(total, index) in totals"
        :key="total.key"
        as="div"
        test-id="total"
        :initial="reduced ? undefined : { opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{
          duration: 0.35,
          delay: index * STAGGER_STEP,
          ease: [0.16, 1, 0.3, 1],
        }"
        class="p-2 rounded-lg flex flex-col gap-y-4 text-center bg-secondary flex-1"
      >
        <span class="text-xs text-muted-foreground font-bold">
          {{ $t(`components.combatSummary.totals.${total.key}`) }}
        </span>
        <div class="head-3">
          <AnimationCountUp
            :value="total.value"
            :delay="index * STAGGER_STEP"
          />
        </div>
      </Motion>
      <Motion
        as="div"
        test-id="total"
        :initial="reduced ? undefined : { opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{
          duration: 0.35,
          delay: deathSavesIndex * STAGGER_STEP,
          ease: [0.16, 1, 0.3, 1],
        }"
        class="p-2 rounded-lg flex flex-col gap-y-4 text-center bg-secondary flex-1"
      >
        <span class="text-xs text-muted-foreground font-bold">
          {{ $t('components.combatSummary.totals.deathSaves') }}
        </span>
        <div class="text-sm font-bold tabular-nums">
          {{
            $t('components.combatSummary.deathSavesValue', {
              made: stats.deathSavesMade,
              failed: stats.deathSavesFailed,
            })
          }}
        </div>
      </Motion>
    </div>

    <div class="flex flex-col gap-2">
      <Motion
        as="p"
        :initial="reduced ? undefined : { opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{
          duration: 0.35,
          delay: awardsTitleIndex * STAGGER_STEP,
          ease: [0.16, 1, 0.3, 1],
        }"
        class="head-6"
      >
        {{ $t('components.combatSummary.awards.title') }}
      </Motion>
      <ul class="flex flex-col gap-2 border rounded-lg p-2">
        <Motion
          v-for="(combatant, index) in stats.combatants"
          :key="combatant.rowId"
          as="li"
          test-id="award"
          :initial="reduced ? undefined : { opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{
            duration: 0.35,
            delay: awardsTitleIndex * STAGGER_STEP + (index + 1) * STAGGER_STEP,
            ease: [0.16, 1, 0.3, 1],
          }"
          class="flex gap-2 items-start"
        >
          <Icon
            :name="awardIcon[combatant.award]"
            class="size-4 min-w-4 mt-0.5"
            aria-hidden="true"
          />
          <div class="flex flex-wrap gap-x-4 items-center">
            <p test-id="award-name" class="truncate text-sm">
              {{ combatant.name }}
            </p>
            <p
              test-id="award-label"
              class="text-sm text-muted-foreground truncate"
            >
              {{ $t(awardLabel(combatant), { value: combatant.awardValue }) }}
            </p>
          </div>
        </Motion>
      </ul>
    </div>
  </div>
</template>

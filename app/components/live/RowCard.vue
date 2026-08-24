<script setup lang="ts">
const props = defineProps<{
  row: PlayerRow
  active: boolean
}>()

const { ownRowId } = useLiveSeat()

const own = computed(() => ownRowId.value === props.row.id)
</script>

<template>
  <UiCard
    test-id="row"
    class="bg-secondary/50 border-secondary border-4 transition-all duration-300"
    :class="{ 'border-primary! bg-primary/10 tracker-shadow': active }"
  >
    <UiCardHeader class="p-4 gap-y-1">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <Icon
            :name="homebrewIcon(row.type)"
            :class="homebrewColor(row.type)"
            class="size-5 min-w-5"
            aria-hidden="true"
          />
          <UiCardTitle test-id="name" class="text-lg truncate">
            {{ row.name }}
          </UiCardTitle>
          <UiBadge v-if="own" test-id="own" class="shrink-0">
            {{ $t('general.you') }}
          </UiBadge>
        </div>
        <UiBadge test-id="initiative" variant="outline" class="shrink-0">
          {{ $t('general.initiative') }}:
          {{ row.initiative >= 0 ? row.initiative : '—' }}
        </UiBadge>
      </div>
    </UiCardHeader>

    <UiCardContent class="p-4 pt-0 flex flex-col gap-3">
      <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <LiveStatHp :row="row" icon>
          <LiveStatHealthBand v-if="row.healthBand" :band="row.healthBand" />
        </LiveStatHp>

        <LiveStatAc :row="row" icon />

        <LiveStatConcentration
          v-if="row.type !== 'lair'"
          v-tippy="$t('general.concentration')"
          test-id="concentration"
          :data-active="row.concentration"
          :active="row.concentration"
          label
        />
      </div>

      <div
        v-if="row.conditions.length"
        test-id="conditions"
        class="flex flex-wrap gap-1"
      >
        <UiBadge v-for="condition in row.conditions" :key="condition.name">
          {{ condition.name }}
          {{ condition.level ? `(${condition.level})` : '' }}
        </UiBadge>
      </div>

      <LiveDeathSaves
        v-if="row.deathSaves && row.type !== 'monster'"
        v-tippy="$t('general.deathSaves')"
        test-id="death-saves"
        :saves="row.deathSaves"
        disabled
      />
    </UiCardContent>
  </UiCard>
</template>

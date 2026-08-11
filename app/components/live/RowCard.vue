<script setup lang="ts">
const props = defineProps<{
  row: PlayerRow
  active: boolean
}>()

const { seat } = useLiveSeat()

const own = computed(
  () =>
    !!seat.value && !seat.value.spectator && seat.value.row === props.row.id,
)

const healthBandClass = computed(() => {
  if (props.row.healthBand === 'healthy') {
    return 'border-success bg-success/20 text-success'
  }
  if (props.row.healthBand === 'bloodied') {
    return 'border-warning bg-warning/20 text-warning'
  }
  return 'border-destructive bg-destructive/20 text-destructive'
})
</script>

<template>
  <UiCard
    test-id="row"
    class="bg-secondary/50 border-secondary border-4 transition-colors duration-300"
    :class="{ 'border-primary! bg-primary/10': active }"
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
            {{ $t('pages.live.you') }}
          </UiBadge>
        </div>
        <UiBadge test-id="initiative" variant="outline" class="shrink-0">
          {{ $t('general.initiative') }}: {{ row.initiative }}
        </UiBadge>
      </div>
    </UiCardHeader>

    <UiCardContent class="p-4 pt-0 flex flex-col gap-3">
      <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <div
          v-if="isDefined(row.hitPoints)"
          test-id="hp"
          class="flex items-center gap-1"
        >
          <Icon
            name="tabler:heart"
            class="size-5 min-w-5 text-destructive"
            aria-hidden="true"
          />
          <span :class="{ 'text-destructive': row.hitPoints <= 0 }">
            {{ row.hitPoints }}
          </span>
          <span
            v-if="row.maxHitPoints !== row.hitPoints"
            class="text-2xs text-muted-foreground"
          >
            / {{ row.maxHitPoints }}
          </span>
          <span
            v-if="row.tempHitPoints"
            v-tippy="$t('general.temp')"
            class="text-warning text-xs"
          >
            +{{ row.tempHitPoints }}
          </span>
        </div>
        <UiBadge
          v-else-if="row.healthBand"
          test-id="health-band"
          :class="healthBandClass"
        >
          {{ $t(`pages.live.health.${row.healthBand}`) }}
        </UiBadge>

        <div
          v-if="isDefined(row.armorClass)"
          test-id="ac"
          class="flex items-center gap-1"
        >
          <Icon
            name="tabler:shield"
            class="size-5 min-w-5 text-help"
            aria-hidden="true"
          />
          <span>{{ row.armorClass }}</span>
          <span
            v-if="row.tempArmorClass"
            v-tippy="$t('general.temp')"
            class="text-warning text-xs"
          >
            +{{ row.tempArmorClass }}
          </span>
        </div>

        <div
          v-if="row.type !== 'lair'"
          v-tippy="$t('general.concentration')"
          test-id="concentration"
          :data-active="row.concentration"
          class="flex items-center gap-1 text-muted-foreground"
        >
          <Icon
            :name="
              row.concentration
                ? 'tabler:circle-filled'
                : 'tabler:circle-dotted'
            "
            class="size-4 min-w-4"
            aria-hidden="true"
          />
          <span class="text-xs">{{ $t('general.concentration') }}</span>
        </div>
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

      <div
        v-if="row.deathSaves && row.type !== 'monster'"
        v-tippy="$t('pages.live.deathSaves')"
        test-id="death-saves"
        class="grid gap-1 w-fit"
        :class="{
          'bg-success/20 p-2 rounded-lg':
            row.deathSaves.save.every(Boolean) &&
            !row.deathSaves.fail.every(Boolean),
          'bg-destructive/20 p-2 rounded-lg':
            row.deathSaves.fail.every(Boolean) &&
            !row.deathSaves.save.every(Boolean),
        }"
      >
        <div
          v-for="(save, i) in [row.deathSaves.save, row.deathSaves.fail]"
          :key="`save-${i}`"
          class="grid grid-cols-3 gap-1 min-w-14"
        >
          <span
            v-for="(value, j) in save"
            :key="`${value}-${j}`"
            :test-id="i === 0 ? 'save' : 'fail'"
            class="size-4 rounded border-2"
            :class="{
              'border-success bg-success/20': i === 0,
              'border-destructive bg-destructive/20': i === 1,
              'bg-success!': value && i === 0,
              'bg-destructive!': value && i === 1,
            }"
          />
        </div>
      </div>
    </UiCardContent>
  </UiCard>
</template>

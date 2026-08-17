<script setup lang="ts">
defineProps<{
  row: PlayerRow
  icon?: boolean
}>()
</script>

<template>
  <div
    v-if="isDefined(row.hitPoints)"
    test-id="hp"
    class="flex items-center gap-1"
  >
    <Icon
      v-if="icon"
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
  <slot v-else />
</template>

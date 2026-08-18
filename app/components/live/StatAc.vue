<script setup lang="ts">
defineProps<{
  row: PlayerRow
  icon?: boolean
}>()
</script>

<template>
  <div
    v-if="isDefined(row.armorClass)"
    test-id="ac"
    class="flex items-center gap-1"
  >
    <Icon
      v-if="icon"
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
  <slot v-else />
</template>

<script setup lang="ts">
defineEmits<{ openInfo: [] }>()

defineProps<{ item: InitiativeSheetRow }>()
</script>

<template>
  <td>
    <div
      :class="{
        'bg-destructive/20 p-2 rounded-lg w-fit': item.health !== null && item.health === 0,
      }"
      class="flex flex-col gap-y-1"
    >
      <button
        class="flex items-center gap-x-1"
        @click="$emit('openInfo')"
      >
        <Icon
          v-if="item.health === null"
          name="tabler:plus"
          class="size-5 min-w-5 text-secondary"
          aria-hidden="true"
        />
        <span
          v-else
          :class="{ 'text-destructive': item.health === 0 }"
        >
          {{ item.health }}
        </span>
        <span
          v-if="item.health !== null && item.tempHealth"
          v-tippy="$t('general.temp')"
          class="text-warning text-xs"
        >
          +{{ item.tempHealth }}
        </span>
      </button>
      <span
        v-if="item.maxHealth !== item.health"
        class="body-extra-small text-muted-foreground whitespace-nowrap"
      >
        {{ $t('general.max') }}: {{ item.maxHealth }}
      </span>
    </div>
  </td>
</template>

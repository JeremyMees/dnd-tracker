<script setup lang="ts">
defineEmits<{ openInfo: [] }>()

defineProps<{ item: InitiativeSheetRow }>()
</script>

<template>
  <td>
    <div class="flex flex-col gap-y-1">
      <button
        class="flex items-center gap-x-1"
        @click="$emit('openInfo')"
      >
        <Icon
          v-if="item.ac === null"
          name="tabler:plus"
          class="size-5 min-w-5 text-secondary"
          aria-hidden="true"
        />
        <span v-else>{{ item.ac }}</span>
        <span
          v-if="item.ac !== null && item.tempAc"
          v-tippy="$t('general.temp')"
          class="text-warning text-xs"
        >
          +{{ item.tempAc }}
        </span>
      </button>
      <span
        v-if="item.maxAc !== item.ac"
        class="body-extra-small text-muted-foreground whitespace-nowrap"
      >
        {{ $t('general.max') }}: {{ item.maxAc }}
      </span>
    </div>
  </td>
</template>

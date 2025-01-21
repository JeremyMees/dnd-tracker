<script setup lang="ts">
defineEmits<{ openInfo: [] }>()

defineProps<{ item: InitiativeSheetRow }>()
</script>

<template>
  <td>
    <div
      :class="{
        'bg-danger/20 p-2 rounded-lg w-fit': item.health !== null && item.health === 0,
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
          class="size-5 min-w-5 text-slate-700"
          aria-hidden="true"
        />
        <span
          v-else
          :class="{ 'text-danger': item.health === 0 }"
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
        class="body-extra-small text-slate-300"
      >
        {{ $t('general.max') }}: {{ item.maxHealth }}
      </span>
    </div>
  </td>
</template>

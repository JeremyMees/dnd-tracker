<script setup lang="ts">
defineEmits<{
  reset: []
  previous: []
  next: []
}>()

defineProps<{ data: InitiativeSheet }>()
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-4 items-center justify-between container-max w-full p-4">
    <div class="flex gap-2 items-center">
      <p class="text-slate-300">
        {{ $t('general.round') }}: {{ data.round }}
      </p>
      <button
        v-tippy="{ content: $t('actions.reset') }"
        :disabled="!data.rows.length"
        aria-label="Reset rounds"
        class="disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center"
        @click="$emit('reset')"
      >
        <Icon
          name="tabler:refresh"
          class="size-6 text-danger"
          aria-hidden="true"
        />
      </button>
    </div>
    <h1>{{ data.title }}</h1>
    <div
      id="tour-1"
      class="flex gap-2 items-center bg-secondary/50 rounded-lg border-4 border-secondary"
    >
      <button
        v-tippy="{ content: $t('actions.prev') }"
        :disabled="data.round === 1 && data.activeIndex === 0"
        :aria-label="$t('actions.prev')"
        class="group disabled:cursor-not-allowed duration-300 ease-in-out p-2 border-r-2 border-secondary flex flex-col items-center"
        @click="$emit('previous')"
      >
        <Icon
          name="tabler:chevron-left"
          class="group-disabled:opacity-40 size-6"
          aria-hidden="true"
        />
      </button>
      <p class="uppercase font-bold px-2">
        {{ $t('components.inputs.initiativeLabel') }}
      </p>
      <button
        v-tippy="{ content: $t('actions.next') }"
        :disabled="!data.rows.length"
        :aria-label="$t('actions.next')"
        class="p-2 border-l-2 border-secondary flex flex-col items-center"
        @click="$emit('next')"
      >
        <Icon
          name="tabler:chevron-right"
          class="size-6"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>

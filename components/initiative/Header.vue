<script setup lang="ts">
defineEmits<{
  reset: []
  previous: []
  next: []
}>()

defineProps<{ data: InitiativeSheet }>()
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-4 items-center justify-between container-max w-full">
    <div class="flex gap-2 items-center">
      <span class="text-muted-foreground">
        {{ $t('general.round') }}:
        <span class="font-bold text-foreground">
          {{ data.round }}
        </span>
      </span>
      <button
        v-tippy="{ content: $t('actions.reset') }"
        :disabled="!data.rows.length"
        aria-label="Reset rounds"
        class="disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center"
        @click="$emit('reset')"
      >
        <Icon
          name="tabler:refresh"
          class="size-6 text-destructive"
          aria-hidden="true"
        />
      </button>
    </div>
    <div
      id="tour-1"
      class="flex gap-2 items-center bg-primary/50 rounded-lg border-4 border-primary"
    >
      <button
        v-tippy="{ content: $t('actions.prev') }"
        :disabled="data.round === 1 && data.activeIndex === 0"
        :aria-label="$t('actions.prev')"
        class="group disabled:cursor-not-allowed duration-300 ease-in-out py-1 pl-1 pr-2 border-r-2 border-primary flex flex-col items-center"
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
        class="py-1 pl-2 pr-1 border-l-2 border-primary flex flex-col items-center"
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

<script setup lang="ts" generic="T extends string">
defineEmits<{ select: [T]; back: [] }>()

withDefaults(
  defineProps<{
    title: string
    description?: string
    options: ChoiceCardOption<T>[]
    back?: boolean
  }>(),
  { description: undefined, back: false },
)

const titleId = useId()
</script>

<template>
  <fieldset
    :aria-labelledby="titleId"
    class="mx-auto w-full min-w-0 max-w-4xl py-4 sm:py-8"
  >
    <StepHeader
      :title="title"
      :description="description"
      :title-id="titleId"
      :back="back"
      center
      class="mb-6"
      @back="$emit('back')"
    />

    <div class="flex flex-wrap justify-center gap-3">
      <button
        v-for="(option, i) in options"
        :key="option.value"
        type="button"
        :test-id="`choice-${option.value}`"
        class="group flex basis-full sm:basis-[calc(50%-0.375rem)] lg:basis-[calc(33.333%-0.5rem)] items-start gap-3 rounded-lg border-4 border-secondary bg-secondary/50 p-4 text-left transition-colors duration-200 hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both motion-reduce:animate-none"
        :style="{ animationDelay: `${i * 40}ms` }"
        @click="$emit('select', option.value)"
      >
        <span
          class="grid size-11 min-w-11 place-items-center rounded-md bg-background"
        >
          <Icon
            :name="option.icon"
            :class="option.iconClass"
            class="size-6"
            aria-hidden="true"
          />
        </span>
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span class="font-semibold">{{ option.label }}</span>
          <span
            v-if="option.description"
            class="text-sm text-muted-foreground text-pretty"
          >
            {{ option.description }}
          </span>
        </span>
        <Icon
          name="tabler:chevron-right"
          class="size-5 min-w-5 self-center text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary group-focus-visible:text-primary motion-reduce:transition-none"
          aria-hidden="true"
        />
      </button>
    </div>
  </fieldset>
</template>

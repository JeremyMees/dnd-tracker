<script setup lang="ts">
defineEmits<{ pin: [], unpin: [] }>()

const props = withDefaults(
  defineProps<{
    hit: Open5eItem
    type: Open5eType
    pinned?: boolean
    allowPin?: boolean
    variant?: 'secondary' | 'background'
  }>(), {
    pinned: false,
    allowPin: false,
    variant: 'secondary',
  },
)

const isOpen = ref<boolean>(false)

function hideOpenButton(): boolean {
  return props.type === 'weapons' || props.type === 'armor'
}
</script>

<template>
  <UiCard
    :class="{
      'bg-secondary/50 border-secondary': variant === 'secondary',
      'bg-background border-background': variant === 'background',
    }"
    class="relative border-4"
    @dblclick="isOpen = !isOpen"
  >
    <UiCardHeader>
      <button
        v-if="allowPin"
        v-tippy="{
          content: $t(`components.infoCard.${pinned ? 'remove' : 'add'}`),
          placement: 'left',
        }"
        :aria-label="$t(`components.infoCard.${pinned ? 'remove' : 'add'}`)"
        class="absolute right-4 top-4"
        @click="pinned ? $emit('unpin') : $emit('pin')"
      >
        <Icon
          :name="pinned ? 'tabler:pinned-off' : 'tabler:pin'"
          class="size-4 min-w-4"
          :class="[pinned ? 'text-destructive' : 'text-primary']"
          aria-hidden="true"
        />
      </button>
      <UiCardTitle>{{ hit.name }}</UiCardTitle>
    </UiCardHeader>
    <UiCardContent>
      <ContentCardContent
        :content="hit"
        :is-open="isOpen"
        :hide-open-button="hideOpenButton"
        :type="type"
      />
    </UiCardContent>
    <UiCardFooter>
      <div
        v-if="!hideOpenButton()"
        class="flex justify-end w-full"
      >
        <button
          class="flex gap-2 text-foreground"
          :aria-label="$t(`actions.read${isOpen ? 'Less' : 'More'}`)"
          @click="isOpen = !isOpen"
        >
          <p>
            {{ $t(`actions.read${isOpen ? 'Less' : 'More'}`) }}
          </p>
          <Icon
            name="tabler:chevron-down"
            class="duration-200 size-6 stroke-2"
            :class="{ 'rotate-180': isOpen }"
            aria-hidden="true"
          />
        </button>
      </div>
    </UiCardFooter>
  </UiCard>
</template>

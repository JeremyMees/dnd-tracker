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
      <UiButton
        v-if="allowPin"
        v-tippy="{
          content: $t(`components.infoCard.${pinned ? 'remove' : 'add'}`),
          placement: 'left',
        }"
        data-test-pin
        variant="secondary-ghost"
        size="icon"
        :aria-label="$t(`components.infoCard.${pinned ? 'remove' : 'add'}`)"
        class="absolute right-0 top-0"
        @click="pinned ? $emit('unpin') : $emit('pin')"
      >
        <Icon
          :name="pinned ? 'tabler:pinned-off' : 'tabler:pin'"
          class="size-4 min-w-4 group-hover:text-foreground!"
          :class="[pinned ? 'text-destructive' : 'text-primary']"
          aria-hidden="true"
        />
      </UiButton>
      <UiCardTitle data-test-title>
        {{ hit.name }}
      </UiCardTitle>
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
        <UiButton
          variant="secondary-ghost"
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
        </UiButton>
      </div>
    </UiCardFooter>
  </UiCard>
</template>

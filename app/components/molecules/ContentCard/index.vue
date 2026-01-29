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
    <UiCardHeader class="p-4">
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
      <UiCardTitle
        data-test-title
        class="overflow-hidden text-ellipsis"
      >
        {{ hit.name }}
      </UiCardTitle>
    </UiCardHeader>
    <UiCardContent class="px-4 py-0">
      <ContentCardSpell
        v-if="isSpell(hit)"
        data-test-spell
        :content="hit"
        :is-open="isOpen"
      />
      <ContentCardMagicItem
        v-if="isMagicItem(hit)"
        data-test-magic-item
        :content="hit"
        :is-open="isOpen"
      />
      <ContentCardWeapon
        v-if="isWeapon(hit)"
        data-test-weapon
        :content="hit"
        :is-open="isOpen"
      />
      <ContentCardArmor
        v-if="isArmor(hit)"
        data-test-armor
        :content="hit"
      />
    </UiCardContent>
    <UiCardFooter class="pl-4 pr-0 pb-0 pt-2">
      <div
        v-if="!['armor'].includes(type)"
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

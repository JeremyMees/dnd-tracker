<script setup lang="ts">
defineEmits<{ update: [DndItem[]] }>()
defineProps<{ value: DndItem[] }>()
</script>

<template>
  <Card color="secondary">
    <UiAccordion
      v-if="value.length"
      test-id="accordion"
      type="single"
      collapsible
    >
      <UiAccordionItem
        v-for="item in value"
        :key="item.id"
        :value="item.id"
        class="last:border-b-0"
      >
        <UiAccordionTrigger class="hover:no-underline">
          {{ item.name }}
        </UiAccordionTrigger>
        <UiAccordionContent>
          <ContentCardSpell v-if="isSpell(item)" :content="item" is-open />
          <ContentCardMagicItem
            v-if="isMagicItem(item)"
            :content="item"
            is-open
          />
          <ContentCardWeapon v-if="isWeapon(item)" :content="item" is-open />
          <ContentCardArmor v-if="isArmor(item)" :content="item" />
          <div class="flex justify-end pt-4">
            <UiButton
              :aria-label="$t(`components.infoCard.remove`)"
              @click="
                $emit(
                  'update',
                  value.filter(i => i.id !== item.id),
                )
              "
            >
              <Icon name="tabler:pinned-off" aria-hidden="true" />
              {{ $t('components.infoCard.remove') }}
            </UiButton>
          </div>
        </UiAccordionContent>
      </UiAccordionItem>
    </UiAccordion>
    <div v-else class="flex flex-col gap-2">
      <span class="head-6">
        {{ $t('pages.encounter.pinnedContent.empty.title') }}
      </span>
      <p class="text-muted-foreground">
        {{ $t('pages.encounter.pinnedContent.empty.text') }}
        <span class="inline-flex items-center gap-1">
          <Icon name="tabler:book" class="size-4 min-w-4 text-help" />
          <span>
            {{ $t('components.navbar.dnd-content') }}
          </span>
        </span>
      </p>
    </div>
  </Card>
</template>

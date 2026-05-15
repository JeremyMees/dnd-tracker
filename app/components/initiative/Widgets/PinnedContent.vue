<script setup lang="ts">
defineEmits<{ update: [DndItem[]] }>()
defineProps<{ value: DndItem[] }>()
</script>

<template>
  <Card color="secondary">
    <UiAccordion
      v-if="value.length"
      data-test-accordion
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
          <ContentCardSpell
            v-if="isSpell(item)"
            :content="item"
            is-open
          />
          <ContentCardMagicItem
            v-if="isMagicItem(item)"
            :content="item"
            is-open
          />
          <ContentCardWeapon
            v-if="isWeapon(item)"
            :content="item"
            is-open
          />
          <ContentCardArmor
            v-if="isArmor(item)"
            :content="item"
          />
          <div class="flex justify-end pt-4">
            <UiButton
              :aria-label="$t(`components.infoCard.remove`)"
              @click="
                $emit(
                  'update',
                  value.filter((i) => i.id !== item.id),
                )
              "
            >
              <Icon
                name="tabler:pinned-off"
                aria-hidden="true"
              />
              {{ $t("components.infoCard.remove") }}
            </UiButton>
          </div>
        </UiAccordionContent>
      </UiAccordionItem>
    </UiAccordion>
    <p
      v-else
      class="text-muted-foreground"
    >
      {{ $t("pages.encounter.pinnedContent.empty") }}
    </p>
  </Card>
</template>

<script setup lang="ts">
defineEmits<{ update: [Open5eItem[]] }>()
defineProps<{ value: Open5eItem[] }>()
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
        :key="item.slug"
        :value="item.slug"
        class="last:border-b-0"
      >
        <UiAccordionTrigger class="hover:no-underline">
          {{ item.name }}
        </UiAccordionTrigger>
        <UiAccordionContent>
          <ContentCardContent
            :content="item"
            :is-open="true"
            :hide-open-button="() => true"
            :type="item.type"
          />
          <div class="flex justify-end pt-4">
            <UiButton
              :aria-label="$t(`components.infoCard.remove`)"
              @click="$emit('update', value.filter(i => i.slug !== item.slug))"
            >
              <Icon
                name="tabler:pinned-off"
                aria-hidden="true"
              />
              {{ $t('components.infoCard.remove') }}
            </UiButton>
          </div>
        </UiAccordionContent>
      </UiAccordionItem>
    </UiAccordion>
    <p
      v-else
      class="text-muted-foreground"
    >
      {{ $t('pages.encounter.pinnedContent.empty') }}
    </p>
  </Card>
</template>

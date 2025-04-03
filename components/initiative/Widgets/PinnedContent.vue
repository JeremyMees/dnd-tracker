<script setup lang="ts">
const emit = defineEmits<{ update: [Open5eItem[]] }>()

const props = defineProps<{ value: Open5eItem[] }>()
</script>

<template>
  <Card
    color="secondary"
  >
    <UiAccordion
      type="single"
      collapsible
    >
      <UiAccordionItem
        v-for="item in props.value"
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
            <button
              :aria-label="$t(`components.infoCard.remove`)"
              class="btn-primary flex items-center gap-2"
              @click="emit('update', value.filter(i => i.slug !== item.slug))"
            >
              <Icon
                name="tabler:pinned-off"
                class="size-4 min-w-4"
                aria-hidden="true"
              />
              {{ $t('components.infoCard.remove') }}
            </button>
          </div>
        </UiAccordionContent>
      </UiAccordionItem>
    </UiAccordion>
  </Card>
</template>

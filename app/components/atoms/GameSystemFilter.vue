<script setup lang="ts">
const props = defineProps<{
  documents: Open5eDocument[]
  disabled?: boolean
}>()

const selectedDocuments = defineModel<string[]>('document', { required: true })
const selectedSystem = defineModel<Open5eGameSystem>('system', { required: true })
const popoverOpen = shallowRef<boolean>(false)

watch(selectedSystem, (value, oldValue) => {
  if (oldValue && value === oldValue) return

  const systemSrd = value.replace('5e', 'srd')

  if (oldValue === undefined) {
    if (!selectedDocuments.value.length) {
      selectedDocuments.value = [systemSrd]
    }
  }
  else {
    selectedDocuments.value = [systemSrd]
  }
}, { immediate: true })

const documentOptions = computed<Record<Open5eGameSystem, Open5eDocument[]>>(() => {
  const acc = props.documents.reduce((acc, document) => {
    const key = document.gamesystem.key
    if (!acc[key]) acc[key] = []
    acc[key].push(document)
    return acc
  }, {} as Record<Open5eGameSystem, Open5eDocument[]>)

  Object.keys(acc).forEach((key: string) => {
    const documents = acc[key as Open5eGameSystem]
    documents.sort((a: Open5eDocument, b: Open5eDocument) => {
      const aIsWotC = a.publisher.key === 'wizards-of-the-coast'
      const bIsWotC = b.publisher.key === 'wizards-of-the-coast'

      if (aIsWotC && !bIsWotC) return -1
      if (!aIsWotC && bIsWotC) return 1
      return a.publisher.name.localeCompare(b.publisher.name)
    })
  })

  return acc
})
</script>

<template>
  <UiPopover v-model:open="popoverOpen">
    <UiPopoverTrigger as-child>
      <button
        :disabled="disabled"
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ selectedSystem }}
        <Icon
          name="tabler:chevron-down"
          class="ml-auto my-auto size-4 text-muted-foreground"
          :aria-hidden="true"
        />
      </button>
    </UiPopoverTrigger>
    <UiPopoverContent class="max-h-[600px]">
      <div class="flex flex-col gap-y-2">
        <div>
          <UiLabel for="system">
            {{ $t('components.inputs.gameSystemLabel') }}
          </UiLabel>
          <UiRadioGroup
            id="system"
            v-model="selectedSystem"
            class="sm:grid-cols-2 rounded-md border border-input bg-background px-3 py-2"
          >
            <div
              v-for="option in ['5e-2014', '5e-2024']"
              :key="option"
              class="flex items-center space-y-0 gap-x-3"
            >
              <UiRadioGroupItem :value="option" />
              <UiLabel class="font-normal">
                {{ option }}
              </UiLabel>
            </div>
          </UiRadioGroup>
        </div>

        <div>
          <UiLabel>
            {{ $t('components.inputs.systemDocumentLabel') }}
          </UiLabel>
          <div class="grid gap-1">
            <div
              v-for="option in documentOptions[selectedSystem]"
              :key="option.key"
              class="rounded-md border border-input bg-background px-3 py-2 flex flex-col gap-1"
            >
              <div class="flex flex-row items-center space-x-2">
                <UiCheckbox
                  :model-value="(selectedDocuments ?? []).includes(option.key)"
                  @update:model-value="(val: boolean | 'indeterminate') => {
                    let updated = selectedDocuments ? [...selectedDocuments] : []

                    if (val) {
                      if (!updated.includes(option.key)) updated.push(option.key)
                    }
                    else {
                      updated = updated.filter((k) => k !== option.key)
                    }

                    selectedDocuments = updated
                  }"
                />
                <UiLabel>
                  {{ option.display_name }}
                </UiLabel>
              </div>
              <div class="text-muted-foreground text-2xs">
                Published by
                <NuxtLink
                  :to="option.permalink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="underline"
                >
                  {{ option.publisher.name }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UiPopoverContent>
  </UiPopover>
</template>

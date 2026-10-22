<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { patchRow } = validateInject(INITIATIVE_SHEET)

function useReadied(): void {
  patchRow(props.item.id, {
    readied: false,
    resources: { ...props.item.resources, reaction: true },
  }).catch(() => undefined)
}

function reveal(): void {
  patchRow(props.item.id, { hidden: false }).catch(() => undefined)
}

const popoverOpen = shallowRef<boolean>(false)

const formSchema = z.object({
  name: z.string().min(2).max(50),
})

const form = useForm({
  validationSchema: formSchema,
})

const onSubmit = form.handleSubmit(async values => {
  try {
    await patchRow(props.item.id, { name: values.name })
  } catch {
    return
  }

  popoverOpen.value = false
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button class="flex items-center gap-x-2">
          <Tooltip :text="$t(`general.${item.type}`)">
            <Icon
              :name="homebrewIcon(item.type)"
              :class="homebrewColor(item.type)"
              class="size-5 min-w-5"
              aria-hidden="true"
            />
          </Tooltip>
          <div class="flex flex-col gap-y-1 text-left">
            <span test-id="name">
              {{ item.name }}
            </span>
            <span
              v-if="item.summoner?.name"
              test-id="summoner"
              class="text-2xs text-muted-foreground"
            >
              {{ $t('general.summoner') }}: {{ item.summoner.name }}
            </span>
          </div>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent>
        <UiPopoverHeader>
          <UiPopoverTitle>
            {{ $t('components.initiativeTableModals.name') }}
          </UiPopoverTitle>
        </UiPopoverHeader>
        <UiFormWrapper @submit="onSubmit">
          <UiFormField v-slot="{ componentField }" name="name">
            <UiFormItem v-auto-animate>
              <UiFormControl>
                <UiInputGroup>
                  <UiInputGroupInput type="text" v-bind="componentField" />
                  <UiInputGroupAddon align="inline-end">
                    <UiInputGroupButton
                      :aria-label="$t('actions.save')"
                      type="submit"
                    >
                      <Icon name="tabler:device-floppy" />
                    </UiInputGroupButton>
                  </UiInputGroupAddon>
                </UiInputGroup>
              </UiFormControl>
              <UiFormMessage />
            </UiFormItem>
          </UiFormField>
        </UiFormWrapper>
      </UiPopoverContent>
    </UiPopover>
    <Tooltip v-if="item.hidden" :text="$t('actions.revealToPlayers')">
      <button
        test-id="hidden"
        type="button"
        :aria-label="$t('actions.revealToPlayers')"
        @click="reveal"
      >
        <UiBadge class="cursor-pointer">
          <Icon name="tabler:eye-off" aria-hidden="true" />
          {{ $t('general.hidden') }}
        </UiBadge>
      </button>
    </Tooltip>
    <Tooltip v-if="item.readied" :text="$t('actions.useReadied')">
      <button
        test-id="readied"
        type="button"
        :aria-label="$t('actions.useReadied')"
        @click="useReadied"
      >
        <UiBadge class="cursor-pointer">
          <Icon name="tabler:hand-stop" aria-hidden="true" />
          {{ $t('general.readied') }}
        </UiBadge>
      </button>
    </Tooltip>
  </div>
</template>

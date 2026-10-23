<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, patchRow } = validateInject(INITIATIVE_SHEET)

const popoverOpen = shallowRef<boolean>(false)

const hasArmorClass = computed(
  () => isDefined(props.item.armorClass) && isDefined(props.item.maxArmorClass),
)

async function apply(change: DndAcChange): Promise<void> {
  if (!sheet.value) return

  const patch = applyAcChange(props.item, change, {
    negative: sheet.value.settings?.negative,
  })

  await patchRow(props.item.id, patch)
  popoverOpen.value = false
}
</script>

<template>
  <div>
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          :id="`${item.id}-ac`"
          test-id="trigger"
          :class="{
            'bg-destructive/20 p-2 w-fit':
              isDefined(item.armorClass) && item.armorClass <= 0,
          }"
          class="flex flex-col gap-y-1 rounded-lg"
        >
          <div class="flex items-center gap-x-1">
            <Icon
              v-if="!isDefined(item.armorClass) && item.type !== 'lair'"
              test-id="empty"
              name="tabler:plus"
              class="size-5 min-w-5 text-foreground/10"
              aria-hidden="true"
            />
            <span
              v-else
              test-id="ac"
              :class="{
                'text-destructive':
                  isDefined(item.armorClass) && item.armorClass <= 0,
              }"
            >
              {{ item.armorClass }}
            </span>
            <Tooltip
              v-if="isDefined(item.armorClass) && item.tempArmorClass"
              :text="$t('general.temp')"
            >
              <span test-id="temp" class="text-warning text-xs">
                +{{ item.tempArmorClass }}
              </span>
            </Tooltip>
          </div>
          <span
            v-if="item.maxArmorClass !== item.armorClass"
            test-id="max"
            class="text-2xs text-muted-foreground whitespace-nowrap"
          >
            {{ $t('general.max') }}: {{ item.maxArmorClass }}
          </span>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent class="max-h-[600px]">
        <div
          v-if="isDefined(item.armorClass) && isDefined(item.maxArmorClass)"
          class="flex flex-wrap gap-x-1 gap-y-2 pb-6 items-start justify-center"
        >
          <div
            class="p-2 rounded-lg space-y-4 min-w-[75px] bg-secondary text-center flex-1"
          >
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.current') }}
            </p>
            <p
              class="head-2"
              :class="{ 'text-destructive': item.armorClass < 1 }"
            >
              {{ item.armorClass || 0 }}
            </p>
          </div>
          <div
            class="p-2 rounded-lg space-y-4 min-w-[75px] bg-secondary text-center flex-1"
          >
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.max') }}
            </p>
            <div class="flex gap-1 items-start justify-center">
              <p
                class="head-2"
                :class="[
                  !item.maxArmorClassOld
                    ? undefined
                    : item.maxArmorClassOld < item.maxArmorClass
                      ? 'text-success'
                      : 'text-destructive',
                ]"
              >
                {{ item.maxArmorClass || 0 }}
              </p>
              <p
                v-if="item.maxArmorClassOld === 0 || item.maxArmorClassOld"
                class="text-sm"
              >
                ({{ item.maxArmorClassOld }})
              </p>
            </div>
          </div>
          <div
            class="p-2 rounded-lg space-y-4 min-w-[75px] bg-secondary text-center flex-1"
          >
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.temp') }}
            </p>
            <p class="head-2">
              {{ item.tempArmorClass || 0 }}
            </p>
          </div>
        </div>

        <FormAcUpdate v-if="hasArmorClass" :item="item" :apply="apply" />

        <UiSeparator v-if="hasArmorClass" class="my-3 bg-muted" />

        <FormAcUpdateBase :apply="apply" />

        <UiSeparator v-if="hasArmorClass" class="my-3 bg-muted" />

        <FormAcOverride v-if="hasArmorClass" :item="item" :apply="apply" />
      </UiPopoverContent>
    </UiPopover>
  </div>
</template>

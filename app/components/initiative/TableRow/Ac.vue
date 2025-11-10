<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)
const { add, remove, temp, override, overrideReset } = acFunctions

const popoverOpen = shallowRef<boolean>(false)

const hasAc = computed(() => isDefined(props.item.ac) && isDefined(props.item.maxAc))

async function updateRow(row: Partial<InitiativeSheetRow>): Promise<void> {
  if (!sheet.value) return

  const index = getCurrentRowIndex(sheet.value, props.item.id)
  const rows = [...sheet.value.rows]

  if (index === -1 || !rows[index]) return

  rows[index] = { ...rows[index], ...row }

  await update({ rows })
  popoverOpen.value = false
}

function handleAcChanges(amount: number, type: AcType): InitiativeSheetRow {
  const row = { ...props.item }

  if (type === 'add') add(row, amount)
  else if (type === 'remove') remove(row, amount)
  else if (type === 'temp') temp(row, amount)
  else if (type === 'override') override(row, amount)
  else if (type === 'override-reset') overrideReset(row, amount)

  // when ac is an negative number change it to 0
  const resetNegative = sheet.value?.settings?.negative === false
  if (resetNegative && row.ac && row.ac < 0) row.ac = 0

  return row
}
</script>

<template>
  <div>
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          :id="`${item.id}-ac`"
          data-test-trigger
          :class="{
            'bg-destructive/20 p-2 w-fit': isDefined(item.ac) && item.ac <= 0,
          }"
          class="flex flex-col gap-y-1 rounded-lg"
        >
          <div class="flex items-center gap-x-1">
            <Icon
              v-if="!isDefined(item.ac) && item.type !== 'lair'"
              data-test-empty
              name="tabler:plus"
              class="size-5 min-w-5 text-foreground/10"
              aria-hidden="true"
            />
            <span
              v-else
              data-test-ac
              :class="{ 'text-destructive': isDefined(item.ac) && item.ac <= 0 }"
            >
              {{ item.ac }}
            </span>
            <span
              v-if="isDefined(item.ac) && item.tempAc"
              v-tippy="$t('general.temp')"
              data-test-temp
              class="text-warning text-xs"
            >
              +{{ item.tempAc }}
            </span>
          </div>
          <span
            v-if="item.maxAc !== item.ac"
            data-test-max
            class="text-2xs text-muted-foreground whitespace-nowrap"
          >
            {{ $t('general.max') }}: {{ item.maxAc }}
          </span>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent class="max-h-[600px]">
        <div
          v-if="isDefined(item.ac) && isDefined(item.maxAc)"
          class="flex flex-wrap gap-x-1 gap-y-2 pb-6 items-start justify-center"
        >
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-background text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.current') }}
            </p>
            <p
              class="head-2"
              :class="{ 'text-destructive': item.ac < 1 }"
            >
              {{ item.ac || 0 }}
            </p>
          </div>
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-background text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.max') }}
            </p>
            <div class="flex gap-1 items-start justify-center">
              <p
                class="head-2"
                :class="[!item.maxAcOld ? undefined : item.maxAcOld < item.maxAc ? 'text-success' : 'text-destructive']"
              >
                {{ item.maxAc || 0 }}
              </p>
              <p
                v-if="item.maxAcOld === 0 || item.maxAcOld"
                class="text-sm"
              >
                ({{ item.maxAcOld }})
              </p>
            </div>
          </div>
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-background text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.temp') }}
            </p>
            <p class="head-2">
              {{ item.tempAc || 0 }}
            </p>
          </div>
        </div>

        <InitiativeTableFormsAcUpdate
          v-if="hasAc"
          :item="item"
          :sheet="sheet"
          :handle-ac-changes="handleAcChanges"
          :update-row="updateRow"
        />

        <UiSeparator
          v-if="hasAc"
          class="my-3 bg-muted"
        />

        <InitiativeTableFormsAcUpdateBase
          :item="item"
          :sheet="sheet"
          :handle-ac-changes="handleAcChanges"
          :update-row="updateRow"
        />

        <UiSeparator
          v-if="hasAc"
          class="my-3 bg-muted"
        />

        <InitiativeTableFormsAcOverride
          v-if="hasAc"
          :item="item"
          :sheet="sheet"
          :handle-ac-changes="handleAcChanges"
          :update-row="updateRow"
        />
      </UiPopoverContent>
    </UiPopover>
  </div>
</template>

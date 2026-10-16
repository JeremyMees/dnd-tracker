<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, patchRow } = validateInject(INITIATIVE_SHEET)
const bloodied = useBloodiedCondition(() => sheet.value?.settings)

const popoverOpen = shallowRef<boolean>(false)
const intent = shallowRef<DndHpType>()

const { onRequest, isTarget } = useRowShortcut()

const isShortcutTarget = computed(() => isTarget(sheet.value, props.item.id))

onRequest(
  () => props.item.id,
  ['damage', 'heal'],
  action => {
    intent.value = action === 'damage' ? 'damage' : 'heal'
    popoverOpen.value = true
  },
)

watch(popoverOpen, open => {
  if (!open) intent.value = undefined
})

const hasHp = computed(
  () => isDefined(props.item.hitPoints) && isDefined(props.item.maxHitPoints),
)

const handleToasts = useToastItems()

async function updateRow(row: Partial<InitiativeSheetRow>): Promise<void> {
  const patch = buildCombatPatch(
    props.item,
    withBloodied({ ...props.item, ...row }, bloodied.value),
  )

  await patchRow(props.item.id, patch)
  popoverOpen.value = false
}
</script>

<template>
  <div>
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          :id="`${item.id}-hp`"
          test-id="trigger"
          :class="{
            'bg-destructive/20 p-2 w-fit':
              isDefined(item.hitPoints) && item.hitPoints <= 0,
          }"
          class="flex flex-col gap-y-1 rounded-lg"
        >
          <Tooltip :disabled="!isShortcutTarget || !hasHp">
            <span class="flex flex-col gap-y-1">
              <div class="flex items-center gap-x-1">
                <Icon
                  v-if="!isDefined(item.hitPoints) && item.type !== 'lair'"
                  test-id="empty"
                  name="tabler:plus"
                  class="size-5 min-w-5 text-foreground/10"
                  aria-hidden="true"
                />
                <span
                  v-else
                  test-id="hp"
                  :class="{
                    'text-destructive':
                      isDefined(item.hitPoints) && item.hitPoints <= 0,
                  }"
                >
                  {{ item.hitPoints }}
                </span>
                <Tooltip
                  v-if="isDefined(item.hitPoints) && item.tempHitPoints"
                  :text="$t('general.temp')"
                >
                  <span test-id="temp" class="text-warning text-xs">
                    +{{ item.tempHitPoints }}
                  </span>
                </Tooltip>
              </div>
              <span
                v-if="item.maxHitPoints !== item.hitPoints"
                test-id="max"
                class="text-2xs text-muted-foreground whitespace-nowrap"
              >
                {{ $t('general.max') }}: {{ item.maxHitPoints }}
              </span>
            </span>
            <template #content>
              <span test-id="hp-shortcuts" class="flex items-center gap-3">
                <span class="flex items-center gap-2">
                  {{ $t('actions.damage') }}
                  <UiKbd>D</UiKbd>
                </span>
                <span class="flex items-center gap-2">
                  {{ $t('actions.heal') }}
                  <UiKbd>H</UiKbd>
                </span>
              </span>
            </template>
          </Tooltip>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent class="max-h-[600px]">
        <div
          v-if="isDefined(item.hitPoints) && isDefined(item.maxHitPoints)"
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
              :class="{ 'text-destructive': item.hitPoints < 1 }"
            >
              {{ item.hitPoints || 0 }}
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
                  !item.maxHitPointsOld
                    ? undefined
                    : item.maxHitPointsOld < item.maxHitPoints
                      ? 'text-success'
                      : 'text-destructive',
                ]"
              >
                {{ item.maxHitPoints || 0 }}
              </p>
              <p v-if="isDefined(item.maxHitPointsOld)" class="text-sm">
                ({{ item.maxHitPointsOld }})
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
              {{ item.tempHitPoints || 0 }}
            </p>
          </div>
        </div>

        <FormHpUpdate
          v-if="hasHp"
          :sheet="sheet"
          :item="item"
          :intent="intent"
          :handle-toasts="handleToasts"
          :update-row="updateRow"
        />

        <UiSeparator v-if="hasHp" class="my-3 bg-muted" />

        <FormHpUpdateBase
          :sheet="sheet"
          :item="item"
          :handle-toasts="handleToasts"
          :update-row="updateRow"
        />

        <UiSeparator v-if="hasHp" class="my-3 bg-muted" />

        <FormHpOverride
          v-if="hasHp"
          :sheet="sheet"
          :item="item"
          :handle-toasts="handleToasts"
          :update-row="updateRow"
        />
      </UiPopoverContent>
    </UiPopover>
  </div>
</template>

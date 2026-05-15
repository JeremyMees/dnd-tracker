<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { t } = useI18n()
const { toast } = useToast()

const popoverOpen = shallowRef<boolean>(false)

const hasHp = computed(() => isDefined(props.item.hitPoints) && isDefined(props.item.maxHitPoints))

function handleToasts(toasts: ToastItem[]): void {
  toasts.forEach(({ title, description, variant }) => {
    toast({
      title: t(title[0], title[1] ?? {}),
      description: t(description[0], description[1] ?? {}),
      variant,
    })
  })
}

async function updateRow(row: Partial<InitiativeSheetRow>): Promise<void> {
  if (!sheet.value) return

  const index = getCurrentRowIndex(sheet.value, props.item.id)
  const rows = [...sheet.value.rows]

  if (index === -1 || !rows[index]) return

  rows[index] = { ...rows[index], ...row }

  await update({ rows })
  popoverOpen.value = false
}
</script>

<template>
  <div>
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          :id="`${item.id}-hp`"
          data-test-trigger
          :class="{
            'bg-destructive/20 p-2 w-fit': isDefined(item.hitPoints) && item.hitPoints <= 0,
          }"
          class="flex flex-col gap-y-1 rounded-lg"
        >
          <div class="flex items-center gap-x-1">
            <Icon
              v-if="!isDefined(item.hitPoints) && item.type !== 'lair'"
              data-test-empty
              name="tabler:plus"
              class="size-5 min-w-5 text-foreground/10"
              aria-hidden="true"
            />
            <span
              v-else
              data-test-hp
              :class="{ 'text-destructive': isDefined(item.hitPoints) && item.hitPoints <= 0 }"
            >
              {{ item.hitPoints }}
            </span>
            <span
              v-if="isDefined(item.hitPoints) && item.tempHitPoints"
              v-tippy="$t('general.temp')"
              data-test-temp
              class="text-warning text-xs"
            >
              +{{ item.tempHitPoints }}
            </span>
          </div>
          <span
            v-if="item.maxHitPoints !== item.hitPoints"
            data-test-max
            class="text-2xs text-muted-foreground whitespace-nowrap"
          >
            {{ $t('general.max') }}: {{ item.maxHitPoints }}
          </span>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent class="max-h-[600px]">
        <div
          v-if="isDefined(item.hitPoints) && isDefined(item.maxHitPoints)"
          class="flex flex-wrap gap-x-1 gap-y-2 pb-6 items-start justify-center"
        >
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-secondary text-center flex-1">
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
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-secondary text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.max') }}
            </p>
            <div class="flex gap-1 items-start justify-center">
              <p
                class="head-2"
                :class="[!item.maxHitPointsOld ? undefined : item.maxHitPointsOld < item.maxHitPoints ? 'text-success' : 'text-destructive']"
              >
                {{ item.maxHitPoints || 0 }}
              </p>
              <p
                v-if="isDefined(item.maxHitPointsOld)"
                class="text-sm"
              >
                ({{ item.maxHitPointsOld }})
              </p>
            </div>
          </div>
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-secondary text-center flex-1">
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
          :handle-toasts="handleToasts"
          :update-row="updateRow"
        />

        <UiSeparator
          v-if="hasHp"
          class="my-3 bg-muted"
        />

        <FormHpUpdateBase
          :sheet="sheet"
          :item="item"
          :handle-toasts="handleToasts"
          :update-row="updateRow"
        />

        <UiSeparator
          v-if="hasHp"
          class="my-3 bg-muted"
        />

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

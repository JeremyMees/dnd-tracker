<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { t } = useI18n()
const { toast } = useToast()

const popoverOpen = shallowRef<boolean>(false)

const hasHp = computed(() => isDefined(props.item.health) && isDefined(props.item.maxHealth))

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
            'bg-destructive/20 p-2 w-fit': isDefined(item.health) && item.health <= 0,
          }"
          class="flex flex-col gap-y-1 rounded-lg"
        >
          <div class="flex items-center gap-x-1">
            <Icon
              v-if="!isDefined(item.health) && item.type !== 'lair'"
              data-test-empty
              name="tabler:plus"
              class="size-5 min-w-5 text-foreground/10"
              aria-hidden="true"
            />
            <span
              v-else
              data-test-health
              :class="{ 'text-destructive': isDefined(item.health) && item.health <= 0 }"
            >
              {{ item.health }}
            </span>
            <span
              v-if="isDefined(item.health) && item.tempHealth"
              v-tippy="$t('general.temp')"
              data-test-temp
              class="text-warning text-xs"
            >
              +{{ item.tempHealth }}
            </span>
          </div>
          <span
            v-if="item.maxHealth !== item.health"
            data-test-max
            class="text-2xs text-muted-foreground whitespace-nowrap"
          >
            {{ $t('general.max') }}: {{ item.maxHealth }}
          </span>
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent class="max-h-[600px]">
        <div
          v-if="isDefined(item.health) && isDefined(item.maxHealth)"
          class="flex flex-wrap gap-x-1 gap-y-2 pb-6 items-start justify-center"
        >
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-secondary text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.current') }}
            </p>
            <p
              class="head-2"
              :class="{ 'text-destructive': item.health < 1 }"
            >
              {{ item.health || 0 }}
            </p>
          </div>
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-secondary text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.max') }}
            </p>
            <div class="flex gap-1 items-start justify-center">
              <p
                class="head-2"
                :class="[!item.maxHealthOld ? undefined : item.maxHealthOld < item.maxHealth ? 'text-success' : 'text-destructive']"
              >
                {{ item.maxHealth || 0 }}
              </p>
              <p
                v-if="isDefined(item.maxHealthOld)"
                class="text-sm"
              >
                ({{ item.maxHealthOld }})
              </p>
            </div>
          </div>
          <div class="p-2 rounded-lg space-y-4 min-w-[75px] bg-secondary text-center flex-1">
            <p class="font-bold text-muted-foreground text-xs">
              {{ $t('general.temp') }}
            </p>
            <p class="head-2">
              {{ item.tempHealth || 0 }}
            </p>
          </div>
        </div>

        <FormHealthUpdate
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

        <FormHealthUpdateBase
          :sheet="sheet"
          :item="item"
          :handle-toasts="handleToasts"
          :update-row="updateRow"
        />

        <UiSeparator
          v-if="hasHp"
          class="my-3 bg-muted"
        />

        <FormHealthOverride
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

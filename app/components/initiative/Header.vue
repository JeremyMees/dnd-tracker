<script setup lang="ts">
defineEmits<{
  reset: [boolean]
  previous: []
  next: []
  toggleHistory: []
  endEncounter: []
}>()

defineProps<{
  data: InitiativeSheet | undefined
  encounterId?: number
  historyOpen?: boolean
}>()

const liveOpen = ref<boolean>(false)
</script>

<template>
  <div
    class="relative flex flex-col min-[400px]:flex-row gap-x-4 gap-y-2 items-center justify-end container-max w-full"
  >
    <InitiativePet
      v-if="data?.settings?.pet"
      test-id="pet"
      :pet="data.settings.pet"
      class="max-[350px]:hidden absolute top-13 sm:top-5 left-4"
    />
    <div class="flex gap-4 items-center">
      <span class="text-muted-foreground">
        {{ $t('general.round') }}:
        <span test-id="round" class="font-bold text-foreground">
          {{ data?.round || 1 }}
        </span>
      </span>
      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <UiButton
            id="tour-11"
            test-id="options-trigger"
            :aria-label="$t('general.action', 2)"
            variant="secondary"
            size="sm"
            class="group"
          >
            {{ $t('general.action', 2) }}
            <Icon
              name="tabler:chevron-down"
              aria-hidden="true"
              class="group-data-[state=open]:rotate-180 transition-transform"
            />
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent align="end" class="min-w-52">
          <UiDropdownMenuItem
            v-if="encounterId"
            test-id="live-session-trigger"
            @select="liveOpen = true"
          >
            <Icon
              name="tabler:broadcast"
              class="text-success"
              aria-hidden="true"
            />
            {{ $t('components.liveSession.title') }}
          </UiDropdownMenuItem>
          <UiDropdownMenuItem
            v-if="encounterId"
            test-id="history-trigger"
            @select="$emit('toggleHistory')"
          >
            <Icon name="tabler:history" class="text-info" aria-hidden="true" />
            {{
              historyOpen
                ? $t('actions.closeCombatLog')
                : $t('actions.openCombatLog')
            }}
          </UiDropdownMenuItem>
          <UiDropdownMenuItem
            v-if="encounterId"
            test-id="end-encounter"
            :disabled="!data?.rows.length"
            @select="$emit('endEncounter')"
          >
            <Icon
              name="tabler:trophy"
              class="text-warning"
              aria-hidden="true"
            />
            {{ $t('actions.encounterStats') }}
          </UiDropdownMenuItem>
          <UiDropdownMenuSub>
            <UiDropdownMenuSubTrigger
              test-id="reset"
              :disabled="!data?.rows.length"
              class="gap-2 data-disabled:pointer-events-none data-disabled:opacity-50"
            >
              <Icon
                name="tabler:refresh"
                class="text-destructive size-4 min-w-4"
                aria-hidden="true"
              />
              {{ $t('actions.reset') }}
            </UiDropdownMenuSubTrigger>
            <UiDropdownMenuSubContent class="max-w-64">
              <UiDropdownMenuItem
                test-id="reset-soft"
                class="flex-col items-start gap-1"
                @select="$emit('reset', false)"
              >
                <span class="font-bold">
                  {{ $t('components.encounterTable.reset.soft.title') }}
                </span>
                <span class="text-muted-foreground text-xs text-wrap">
                  {{ $t('components.encounterTable.reset.soft.description') }}
                </span>
              </UiDropdownMenuItem>
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem
                test-id="reset-hard"
                class="flex-col items-start gap-1"
                @select="$emit('reset', true)"
              >
                <span class="font-bold">
                  {{ $t('components.encounterTable.reset.hard.title') }}
                </span>
                <span class="text-muted-foreground text-xs text-wrap">
                  {{ $t('components.encounterTable.reset.hard.description') }}
                </span>
              </UiDropdownMenuItem>
            </UiDropdownMenuSubContent>
          </UiDropdownMenuSub>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
      <UiDialog v-if="encounterId" v-model:open="liveOpen">
        <UiDialogScrollContent test-id="live-session-dialog" class="max-w-md">
          <UiDialogHeader class="sr-only">
            <UiDialogTitle>
              {{ $t('components.liveSession.title') }}
            </UiDialogTitle>
          </UiDialogHeader>
          <LiveSessionPanel :encounter-id="encounterId" :rows="data?.rows" />
        </UiDialogScrollContent>
      </UiDialog>
    </div>
    <div
      id="tour-1"
      class="w-full min-[400px]:w-auto flex gap-2 items-center justify-between bg-primary/50 rounded-lg border-4 border-primary"
    >
      <button
        v-tippy="{ content: $t('actions.prev') }"
        test-id="previous"
        :disabled="
          !data?.rows.length || (data?.round === 1 && data?.activeIndex === 0)
        "
        :aria-label="$t('actions.prev')"
        class="group disabled:cursor-not-allowed duration-300 ease-in-out p-1 border-r-4 border-primary flex flex-col items-center"
        @click="$emit('previous')"
      >
        <Icon
          name="tabler:chevron-left"
          class="group-disabled:opacity-50 size-6"
          aria-hidden="true"
        />
      </button>
      <p class="text-sm font-medium">
        {{ $t('components.inputs.initiativeLabel') }}
      </p>
      <button
        v-tippy="{ content: $t('actions.next') }"
        test-id="next"
        :disabled="!data?.rows.length"
        :aria-label="$t('actions.next')"
        class="group disabled:cursor-not-allowed p-1 border-l-4 border-primary flex flex-col items-center"
        @click="$emit('next')"
      >
        <Icon
          name="tabler:chevron-right"
          class="group-disabled:opacity-50 size-6"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>

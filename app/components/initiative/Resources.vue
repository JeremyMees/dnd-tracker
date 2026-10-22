<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { patchRow } = validateInject(INITIATIVE_SHEET)

const uses = computed(() => props.item.resources ?? {})
const legendaryActions = computed(() => legendaryActionLimit(props.item))
const legendaryResistances = computed(() =>
  legendaryResistanceLimit(props.item),
)
const actions = computed(() => limitedActions(props.item))
const anyUsed = computed(() =>
  Object.values(uses.value).some(value =>
    typeof value === 'object' ? Object.keys(value).length > 0 : !!value,
  ),
)

function update(resources: DndResourceUses): void {
  patchRow(props.item.id, { resources })
}

function setUses(
  key: 'legendaryActions' | 'legendaryResistances',
  used: number,
): void {
  update({ ...uses.value, [key]: used || undefined })
}

function setReaction(used: number): void {
  update({ ...uses.value, reaction: used ? true : undefined })
}

function setActionUses(name: string, used: number): void {
  const { [name]: _previous, ...rest } = uses.value.actions ?? {}
  const actionUses = used ? { ...rest, [name]: used } : rest

  update({
    ...uses.value,
    actions: Object.keys(actionUses).length ? actionUses : undefined,
  })
}
</script>

<template>
  <div
    v-if="item.type !== 'lair'"
    test-id="resources"
    class="flex flex-wrap items-start gap-x-6 gap-y-3"
  >
    <div
      v-if="legendaryActions"
      test-id="legendary-actions"
      class="flex flex-col gap-1"
    >
      <p class="text-xs text-muted-foreground">
        {{ $t('general.legendaryAction', 2) }}
      </p>
      <UsePips
        :label="$t('general.legendaryAction', 2)"
        :max="legendaryActions"
        :used="uses.legendaryActions ?? 0"
        @update:used="setUses('legendaryActions', $event)"
      />
    </div>

    <div
      v-if="legendaryResistances"
      test-id="legendary-resistances"
      class="flex flex-col gap-1"
    >
      <p class="text-xs text-muted-foreground">
        {{ $t('components.resources.legendaryResistances') }}
      </p>
      <UsePips
        :label="$t('components.resources.legendaryResistances')"
        :max="legendaryResistances"
        :used="uses.legendaryResistances ?? 0"
        @update:used="setUses('legendaryResistances', $event)"
      />
    </div>

    <div test-id="reaction" class="flex flex-col gap-1">
      <p class="text-xs text-muted-foreground">
        {{ $t('general.reaction', 1) }}
      </p>
      <UsePips
        :label="$t('general.reaction', 1)"
        :max="1"
        :used="uses.reaction ? 1 : 0"
        @update:used="setReaction"
      />
    </div>

    <div
      v-for="action in actions"
      :key="action.name"
      test-id="action-uses"
      class="flex flex-col gap-1"
    >
      <p class="text-xs text-muted-foreground">
        {{ action.name }}
        <span v-if="action.usageLimits">
          ({{ formatUsageLimits(action.usageLimits) }})
        </span>
      </p>
      <UsePips
        :label="action.name"
        :max="actionUseLimit(action)"
        :used="uses.actions?.[action.name] ?? 0"
        @update:used="setActionUses(action.name, $event)"
      />
    </div>

    <UiButton
      v-if="anyUsed"
      test-id="reset-resources"
      variant="foreground-ghost"
      size="sm"
      class="self-center"
      @click="update({})"
    >
      <Icon name="tabler:refresh" :aria-hidden="true" />
      {{ $t('components.resources.reset') }}
    </UiButton>
  </div>
</template>

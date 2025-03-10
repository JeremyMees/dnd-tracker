<script setup lang="ts">
const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

const modal = useModal()
const { t } = useI18n()

function openModal(): void {
  if (!props.sheet) return

  modal.open({
    component: 'InitiativeRowName',
    header: t('components.initiativeTableModals.name'),
    submit: t('actions.save'),
    props: {
      encounterId: props.sheet.id,
      name: props.item.name,
      submit: async (value: string) => {
        if (!props.sheet) return

        const index = getCurrentRowIndex(props.sheet, props.item.id)
        const rows = [...props.sheet.rows]

        if (index === -1) return

        rows[index] = {
          ...rows[index],
          name: value,
        }

        await props.update({ rows })
      },
    },
  })
}
</script>

<template>
  <button
    class="flex items-center gap-x-2"
    @click="openModal"
  >
    <Icon
      v-tippy="$t(`general.${item.type}`)"
      :name="homebrewIcon(item.type)"
      :class="homebrewColor(item.type)"
      class="size-5 min-w-5"
      aria-hidden="true"
    />
    <div class="flex flex-col gap-y-1 text-left">
      <span>
        {{ item.name }}
      </span>
      <span
        v-if="item.summoner?.name"
        class="body-extra-small text-muted-foreground"
      >
        {{ $t('general.summoner') }}: {{ item.summoner.name }}
      </span>
    </div>
  </button>
</template>

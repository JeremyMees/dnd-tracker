<script setup lang="ts">
const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

const modal = useModal()

function openModal(): void {
  modal.open({
    component: 'InitiativeRowName',
    header: 'Name',
    props: {
      encounterId: props.sheet.id,
      name: props.item.name,
      submit: async (value: string) => {
        const index = getCurrentRowIndex(props.sheet, props.item.id)
        const rows = props.sheet.rows

        if (index === -1) return

        rows[index].name = value

        await props.update({ rows })
      },
    },
  })
}
</script>

<template>
  <td>
    <button
      class="flex items-center gap-x-2"
      @click="openModal"
    >
      <Icon
        :name="homebrewIcon(item.type)"
        :class="homebrewColor(item.type)"
        class="size-5 min-w-5"
        aria-hidden="true"
      />
      <div class="flex flex-col gap-y-1">
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
  </td>
</template>

<script setup lang="ts">
defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()
</script>

<template>
  <td>
    <div class="grid grid-cols-2 lg:grid-cols-4 lg:min-w-[100px] items-center">
      <button
        v-if="item.type !== 'lair'"
        v-tippy="$t('components.actions.hp')"
        :aria-label="$t('components.actions.hp')"
        class="icon-btn-destructive"
        @click="console.log('implement hp modal')"
      >
        <Icon
          name="tabler:heart"
          :aria-hidden="true"
          class="size-5 min-w-5 text-destructive"
        />
      </button>
      <button
        v-if="item.type !== 'lair'"
        v-tippy="$t('components.actions.ac')"
        :aria-label="$t('components.actions.ac')"
        class="icon-btn-help"
        @click="console.log('implement ac modal')"
      >
        <Icon
          name="tabler:shield"
          :aria-hidden="true"
          class="size-5 min-w-5 text-help"
        />
      </button>
      <button
        v-if="item.type !== 'lair'"
        v-tippy="$t('components.actions.condition')"
        :aria-label="$t('components.actions.condition')"
        class="icon-btn-success"
        @click="console.log('implement condition modal')"
      >
        <Icon
          name="tabler:flask"
          :aria-hidden="true"
          class="size-5 min-w-5 text-success"
        />
      </button>
      <NuxtLink
        v-if="item.link"
        v-tippy="$t('components.actions.link')"
        :aria-label="$t('components.actions.link')"
        class="icon-btn-info"
        target="_blank"
        :to="item.link"
      >
        <Icon
          name="tabler:link"
          :aria-hidden="true"
          class="size-5 min-w-5 text-info"
        />
      </NuxtLink>
    </div>
  </td>
</template>

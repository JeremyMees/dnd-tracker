<script setup lang="ts">
defineEmits<{
  openHp: []
  openAc: []
  openCondition: []
  openLink: []
}>()

defineProps<{ item: InitiativeSheetRow }>()
</script>

<template>
  <td>
    <div class="grid grid-cols-2 lg:grid-cols-4 lg:min-w-[100px] items-center">
      <button
        v-if="item.type !== 'lair'"
        v-tippy="$t('components.actions.hp')"
        :aria-label="$t('components.actions.hp')"
        class="icon-btn-danger"
        @click="$emit('openHp')"
      >
        <Icon
          name="tabler:heart"
          :aria-hidden="true"
          class="size-5 min-w-5 text-danger"
        />
      </button>
      <div v-else />
      <button
        v-if="item.type !== 'lair'"
        v-tippy="$t('components.actions.ac')"
        :aria-label="$t('components.actions.ac')"
        class="icon-btn-help"
        @click="$emit('openAc')"
      >
        <Icon
          name="tabler:shield"
          :aria-hidden="true"
          class="size-5 min-w-5 text-help"
        />
      </button>
      <div v-else />
      <button
        v-if="item.type !== 'lair'"
        v-tippy="$t('components.actions.condition')"
        :aria-label="$t('components.actions.condition')"
        class="icon-btn-success"
        @click="$emit('openCondition')"
      >
        <Icon
          name="tabler:flask"
          :aria-hidden="true"
          class="size-5 min-w-5 text-success"
        />
      </button>
      <div v-else />
      <button
        v-tippy="$t('components.actions.link')"
        :aria-label="$t('components.actions.link')"
        class="icon-btn-info"
        @click="$emit('openLink')"
      >
        <Icon
          name="tabler:link"
          :aria-hidden="true"
          class="size-5 min-w-5 text-info"
        />
      </button>
    </div>
  </td>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    username: string
    img: string
    name?: string
    role?: UserRole
    trigger?: string
    showName?: boolean
  }>(), {
    trigger: 'mouseenter click',
    showName: false,
  },
)

const { t } = useI18n()
</script>

<template>
  <tippy
    :delay="0"
    :trigger="trigger"
  >
    <div class="flex gap-2 items-center">
      <img
        class="inline-block size-8 rounded-full ring-2 ring-bg -scale-x-100 bg-bg-light"
        :src="img"
        :alt="`Avatar ${username}`"
      >
      <div
        v-if="showName"
        class="flex flex-col items-start body-small"
      >
        <span class="font-bold">
          {{ username }}
        </span>
        <span>
          {{ name }}
        </span>
      </div>
    </div>

    <template #content>
      <div class="p-2 overflow-auto flex gap-2">
        <span class="font-bold">
          {{ username }}
        </span>
        <span
          v-if="role"
          class="body-small"
        >
          ({{ t(`general.roles.${role}.title`) }})
        </span>
      </div>
    </template>
  </tippy>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    username: string
    img: string
    role?: UserRole
    trigger?: string
  }>(), {
    trigger: 'mouseenter click',
  },
)

const { t } = useI18n()
</script>

<template>
  <tippy
    :delay="0"
    :trigger="trigger"
  >
    <img
      class="inline-block size-8 rounded-full ring-2 ring-bg -scale-x-100 bg-bg-light"
      :src="img"
      :alt="`Avatar ${username}`"
    >

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

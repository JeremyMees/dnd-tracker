<script setup lang="ts">
withDefaults(
  defineProps<{
    avatars: {
      username: string
      img: string
      role?: UserRole
    }[]
    max?: number
  }>(), {
    max: 4,
  },
)

const { t } = useI18n()
</script>

<template>
  <div class="flex -space-x-2 relative">
    <Avatar
      v-for="avatar in avatars.slice(0, max)"
      :key="avatar.username"
      v-bind="avatar"
    />
    <tippy
      :delay="0"
      trigger="mouseenter click"
    >
      <div
        v-if="avatars.length > max"
        class="size-8 inline-flex items-center justify-center rounded-full ring-2 ring-bg bg-bg-light relative z-[1]"
      >
        +{{ avatars.length - max }}
      </div>

      <template #content>
        <div class="p-2 overflow-auto flex flex-col gap-y-2">
          <div
            v-for="{ username, role } in avatars"
            :key="username"
            class="flex gap-2"
          >
            <span class="font-bold">
              {{ username }}
            </span>
            <span v-if="role">
              ({{ t(`general.roles.${role}.title`) }})
            </span>
          </div>
        </div>
      </template>
    </tippy>
  </div>
</template>

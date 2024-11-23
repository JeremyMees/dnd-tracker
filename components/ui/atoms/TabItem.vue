<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    link: string
    icon: string
    label: string
    disabled?: boolean
  }>(), {
    disabled: false,
  },
)

const route = useRoute()

const isActive = computed<boolean>(() => route.fullPath.includes(props.link))
</script>

<template>
  <div
    class="p-1 rounded-lg md:rounded-none md:bg-transparent md:px-0 md:py-0 md:border-b-2 md:relative md:top-[2px] transition-colors duration-200 ease-in-out"
    :class="[
      disabled && 'pointer-events-none opacity-50',
      isActive
        ? 'bg-primary/50 md:border-primary'
        : 'bg-slate-700/50 md:border-transparent',
    ]"
  >
    <RouteLink
      :url="link"
      class="flex gap-2 items-center py-1 px-2 rounded-lg text-slate-300 hover:bg-tracker hover:text-white"
      active-class="text-white"
    >
      <Icon
        :name="icon"
        aria-hidden="true"
        class="size-5"
      />
      <span>
        {{ label }}
      </span>
    </RouteLink>
  </div>
</template>

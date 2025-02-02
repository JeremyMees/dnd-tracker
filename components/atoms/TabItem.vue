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
    class="p-1 rounded-lg lg:rounded-none lg:bg-transparent lg:px-0 lg:py-0 lg:border-b-2 lg:relative lg:top-[2px] transition-colors duration-200 ease-in-out"
    :class="[
      disabled && 'pointer-events-none opacity-50',
      isActive
        ? 'bg-primary/50 lg:border-primary'
        : 'bg-secondary/50 lg:border-transparent',
    ]"
  >
    <NuxtLinkLocale
      :to="link"
      class="text-sm flex gap-2 items-center py-1 px-2 rounded-lg text-foreground hover:bg-tracker hover:foreground"
      active-class="text-foreground"
    >
      <Icon
        :name="icon"
        aria-hidden="true"
        class="size-4"
      />
      <span>
        {{ label }}
      </span>
    </NuxtLinkLocale>
  </div>
</template>

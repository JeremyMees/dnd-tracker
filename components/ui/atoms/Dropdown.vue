<script setup lang="ts">
defineExpose({ close })
withDefaults(
  defineProps<{
    color?: 'primary' | 'secondary' | 'black' | 'gray'
    chevron?: boolean
    round?: boolean
  }>(), {
    color: 'primary',
    chevron: false,
    round: false,
  },
)

const isOpen = ref<boolean>(false)
const dropdown = ref<HTMLDivElement>()

onClickOutside(dropdown, () => close())
onKeyStroke('Escape', () => close())

function close(): void {
  isOpen.value = false
}
</script>

<template>
  <div
    ref="dropdown"
    class="relative"
  >
    <button
      class="border-4 flex flex-row items-center cursor-pointer gap-x-2 group duration-200 ease-in-out transition-all"
      :class="[
        round
          ? 'rounded-full w-12 h-12 flex flex-col items-center justify-center overflow-hidden'
          : 'rounded-lg px-4 py-2',
        {
          'rounded-b-none': isOpen,
          'border-primary bg-primary/50': color === 'primary',
          'bg-primary/80': color === 'primary' && isOpen,
          'border-secondary bg-secondary/50': color === 'secondary',
          'bg-secondary/80': color === 'secondary' && isOpen,
          'border-black bg-black/50': color === 'black',
          'bg-black/80': color === 'black' && isOpen,
          'border-slate-700 bg-slate-700/50': color === 'gray',
          'bg-slate-700/80': color === 'gray' && isOpen,
        },
      ]"
      @click="isOpen = !isOpen"
    >
      <span class="duration-200 font-bold text-slate-300 group-hover:text-white">
        <slot />
      </span>
      <Icon
        v-if="chevron"
        class="transition-transform duration-200 ease-in-out w-6 h-6"
        :class="{ 'rotate-180': isOpen }"
        name="tabler:chevron-down"
        aria-hidden="true"
      />
    </button>
    <AnimationExpand>
      <div
        v-if="isOpen"
        class="absolute z-[1] block w-max right-0"
      >
        <div
          class="border-4 flex flex-col gap-y-3 p-5 pr-[30px] relative rounded-b-lg rounded-tl-lg box-border text-slate-300"
          :class="{
            'border-primary bg-primary/80': color === 'primary',
            'border-secondary bg-secondary/80': color === 'secondary',
            'border-black bg-black/80': color === 'black',
            'border-slate-700 bg-slate-700/80': color === 'gray',
          }"
        >
          <slot name="content" />
        </div>
      </div>
    </AnimationExpand>
  </div>
</template>

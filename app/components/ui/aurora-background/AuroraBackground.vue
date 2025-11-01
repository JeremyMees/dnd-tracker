<script setup lang="ts">
interface AuroraBackgroundProps {
  radialGradient?: boolean
  class?: string
}

const props = withDefaults(
  defineProps<AuroraBackgroundProps>(),
  {
    radialGradient: true,
  },
)
</script>

<template>
  <div>
    <div
      v-bind="props"
      :class="
        cn(
          'transition-bg relative flex h-dvh flex-col items-center justify-center',
          props.class,
        )
      "
    >
      <div
        :style="{
          '--aurora':
            'repeating-linear-gradient(100deg,#8e51ff_10%,#a3b3ff_15%,#fda5d5_20%,##f22fe_25%,#c27aff_30%)',
          '--dark-gradient':
            'repeating-linear-gradient(100deg,#09090b_0%,#09090b_7%,transparent_10%,transparent_12%,#09090b_16%)',
          '--light-gradient':
            'repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)',

          '--color-1': '#fda5d5',
          '--color-2': '#c27aff',
          '--color-3': '#8e51ff',
          '--color-4': '#a3b3ff',
          '--color-5': '#7f22fe',
          '--dark': '#09090b',
          '--light': '#fff',
          '--transparent': 'transparent',
          '--animate-aurora': 'aurora 60s linear infinite',
        }"
        class="absolute inset-0 overflow-hidden"
      >
        <div
          :class="
            cn(
              `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--light-gradient),var(--aurora)] bg-size-[300%,200%] bg-position-[50%_50%,50%_50%] opacity-50 blur-[10px] invert filter will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--color-3)_10%,var(--color-4)_15%,var(--color-1)_20%,var(--color-5)_25%,var(--color-2)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--dark)_0%,var(--dark)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--dark)_16%)] [--light-gradient:repeating-linear-gradient(100deg,var(--light)_0%,var(--light)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--light)_16%)] after:absolute after:inset-0 after:[background-image:var(--light-gradient),var(--aurora)] after:bg-size-[200%,100%] after:bg-fixed after:mix-blend-difference after:content-[''] dark:[background-image:var(--dark-gradient),var(--aurora)] after:dark:[background-image:var(--dark-gradient),var(--aurora)]`,
              props.radialGradient
                && `mask-[radial-gradient(ellipse_at_100%_0%,var(--dark)_10%,var(--transparent)_70%)]`,
            )
          "
        />
      </div>
      <slot />
    </div>
  </div>
</template>

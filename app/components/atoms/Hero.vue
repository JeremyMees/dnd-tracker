<script setup lang="ts">
const reduced = useReducedMotion()

const { scrollY } = useScroll()

const peekY = useTransform(scrollY, [0, 600], [0, 120])

const rise = computed(() =>
  reduced.value ? undefined : { opacity: 0, y: 28, filter: 'blur(12px)' },
)

const settle = { opacity: 1, y: 0, filter: 'blur(0px)' }

function step(index: number) {
  return {
    duration: 0.7,
    delay: reduced.value ? 0 : index * 0.12,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  }
}
</script>

<template>
  <UiAuroraBackground
    class="h-auto min-h-dvh justify-start gap-10 overflow-hidden pt-24 pb-0"
  >
    <div class="dnd-container flex flex-1 flex-col items-center justify-center">
      <Motion
        as="h1"
        :initial="rise"
        :animate="settle"
        :transition="step(1)"
        class="mt-8 max-w-4xl text-center text-3xl font-black tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl"
      >
        {{ $t('components.hero.title') }}
      </Motion>

      <Motion
        as="p"
        :initial="rise"
        :animate="settle"
        :transition="step(2)"
        class="mx-auto mt-6 max-w-[620px] text-center text-lg text-pretty text-muted-foreground"
      >
        {{ $t('components.hero.description') }}
      </Motion>

      <Motion
        as="div"
        :initial="rise"
        :animate="settle"
        :transition="step(3)"
        class="mt-10 flex flex-wrap justify-center gap-4"
      >
        <UiButton as-child size="lg" variant="foreground">
          <NuxtLinkLocale to="/campaigns" class="w-fit">
            {{ $t('components.hero.start') }}
          </NuxtLinkLocale>
        </UiButton>
        <UiButton as-child size="lg">
          <NuxtLinkLocale
            to="/playground"
            class="group flex w-fit items-center justify-center gap-2"
          >
            {{ $t('components.hero.try') }}
            <Icon
              name="tabler:arrow-up-right"
              class="size-6 min-w-6 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
              :aria-hidden="true"
            />
          </NuxtLinkLocale>
        </UiButton>
      </Motion>
    </div>

    <Motion
      as="div"
      test-id="hero-preview"
      :initial="reduced ? undefined : { opacity: 0, y: 60 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }"
      :style="reduced ? undefined : { y: peekY }"
      class="hidden h-[32vh] w-full max-w-5xl min-h-0 shrink-0 px-4 md:block"
    >
      <div
        class="relative h-full rounded-t-[32px] border-4 border-b-0 border-border bg-border/50 p-2 mask-[linear-gradient(to_bottom,black_60%,transparent)]"
      >
        <NuxtImg
          src="/campaign.png"
          alt="A campaign overview in DnD Tracker"
          sizes="md:1000px lg:1200px"
          width="2978"
          height="1502"
          class="h-full w-full rounded-t-2xl object-cover object-top"
        />
        <UiBorderBeam
          :size="350"
          :duration="12"
          :border-width="4"
          color-from="#7434E3"
          color-to="#9B4BB3"
          class="rounded-t-[32px]"
        />
      </div>
    </Motion>
  </UiAuroraBackground>
</template>

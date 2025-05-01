<template>
  <div :class="cn('absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]', $props.class)">
    <canvas
      ref="globeCanvasRef"
      class="size-full opacity-0 transition-opacity duration-1000 ease-in-out [contain:layout_paint_size]"
      @pointerdown="(e) => updatePointerInteraction(e.clientX)"
      @pointerup="updatePointerInteraction(null)"
      @pointerout="updatePointerInteraction(null)"
      @mousemove="(e) => updateMovement(e.clientX)"
      @touchmove="(e) => e.touches[0] && updateMovement(e.touches[0].clientX)"
    />
  </div>
</template>

<script lang="ts" setup>
import createGlobe, { type COBEOptions } from 'cobe'
import { useSpring } from 'vue-use-spring'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { cn } from '@/utils/shadcn'

type GlobeProps = {
  class?: string
  config?: Partial<COBEOptions>
  mass?: number
  tension?: number
  friction?: number
  precision?: number
}

const colorMode = useColorMode()

const DEFAULT_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.5,
  dark: colorMode.value === 'dark' ? 1 : 0,
  diffuse: 1,
  mapSamples: 16000,
  mapBrightness: 1,
  baseColor: [1.2, 1.2, 1.2],
  glowColor: [116 / 255, 52 / 255, 227 / 255],
  markerColor: [230 / 255, 25 / 255, 162 / 255],
  markers: [
    { location: [50.930691, 5.33248], size: 0.1 },
  ],
}

const props = withDefaults(defineProps<GlobeProps>(), {
  mass: 1,
  tension: 280,
  friction: 100,
  precision: 0.001,
})

const globeCanvasRef = ref<HTMLCanvasElement>()
const phi = ref(0)
const width = ref(0)
const pointerInteracting = ref()
const pointerInteractionMovement = ref()

let globe: ReturnType<typeof createGlobe> | null = null

const spring = useSpring(
  {
    r: 0,
  },
  {
    mass: props.mass,
    tension: props.tension,
    friction: props.friction,
    precision: props.precision,
  },
)

function updatePointerInteraction(clientX: number | null) {
  if (clientX !== null) {
    pointerInteracting.value = clientX - (pointerInteractionMovement.value ?? clientX)
  }
  else {
    pointerInteracting.value = null
  }

  if (globeCanvasRef.value) {
    globeCanvasRef.value.style.cursor = clientX ? 'grabbing' : 'grab'
  }
}

function updateMovement(clientX: number) {
  if (pointerInteracting.value !== null) {
    const delta = clientX - (pointerInteracting.value ?? clientX)
    pointerInteractionMovement.value = delta
    spring.r = delta / 200
  }
}

function onRender(state: Record<string, unknown>) {
  if (!pointerInteracting.value) {
    phi.value += 0.005
  }

  state.phi = phi.value + spring.r
  state.width = width.value * 2
  state.height = width.value * 2
}

function onResize() {
  if (globeCanvasRef.value) {
    width.value = globeCanvasRef.value.offsetWidth
  }
}

function createGlobeOnMounted() {
  const config = { ...DEFAULT_CONFIG, ...props.config }

  globe = createGlobe(globeCanvasRef.value!, {
    ...config,
    width: width.value * 2,
    height: width.value * 2,
    onRender,
  })
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  onResize()
  createGlobeOnMounted()

  setTimeout(() => (globeCanvasRef.value!.style.opacity = '1'))
})

onBeforeUnmount(() => {
  globe?.destroy()
  window.removeEventListener('resize', onResize)
})
</script>

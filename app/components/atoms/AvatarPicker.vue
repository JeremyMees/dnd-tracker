<script setup lang="ts">
import type { AvatarVariants } from '../ui/avatar'

const emit = defineEmits<{ save: [Avatar] }>()

const props = withDefaults(
  defineProps<{
    profile?: boolean
    deprecatedAvatar?: boolean
    hideCreatorToggle?: boolean
    size?: AvatarVariants['size']
  }>(), {
    size: 'lg',
  },
)

const avatar = defineModel<Avatar>()

const avatarCreator = useAvatarCreator()
const initialAvatar = ref<Avatar | null>(null)
const creatorOpen = ref<boolean>(props.hideCreatorToggle)

const isChanged = computed<boolean>(() => {
  if (!initialAvatar.value) return false

  if (avatarCreator.avatar.value && initialAvatar.value) {
    const initialOptions = initialAvatar.value.extra
    const currentOptions = avatarCreator.avatar.value.extra

    if (initialOptions && currentOptions) {
      const initial = filterUnwantedKeys(initialOptions as SelectedStyleOptions)
      const current = filterUnwantedKeys(currentOptions as SelectedStyleOptions)

      return Object.entries(current).some(([key, value]) => {
        if (!initial[key]) return true

        if (key.includes('Color')) {
          const initialValue = initial[key].toString().replace('#', '')
          const currentValue = value.toString().replace('#', '')
          return initialValue !== currentValue
        }
        return initial[key] !== value
      })
    }
  }

  return JSON.stringify(initialAvatar.value) !== JSON.stringify(avatarCreator.avatar.value)
})

watch(avatar, (v) => {
  if (v && JSON.stringify(v) !== JSON.stringify(avatarCreator.avatar.value)) {
    avatarCreator.avatar.value = v
  }
}, { deep: true })

watch(() => avatarCreator.avatar.value, (v) => {
  if (v && JSON.stringify(v) !== JSON.stringify(avatar.value)) {
    avatar.value = v
  }
}, { deep: true })

onMounted(() => {
  if (avatar.value) {
    avatarCreator.avatar.value = avatar.value
    initialAvatar.value = JSON.parse(JSON.stringify(avatar.value))
  }
  else {
    avatarCreator.random()
  }

  if (avatarCreator.avatar.value && !avatar.value) {
    avatar.value = avatarCreator.avatar.value
    initialAvatar.value = JSON.parse(JSON.stringify(avatarCreator.avatar.value))
  }
})

function filterUnwantedKeys(selected: SelectedStyleOptions): SelectedStyleOptions {
  const values: SelectedStyleOptions = {}

  for (const key in selected) {
    if (avatarCreator.blackListedKeys.includes(key)) continue

    let value = selected[key]

    if (value === undefined) continue

    if (typeof value === 'string' && value.includes('#')) {
      value = value.replace('#', '')
    }

    if (key === 'primaryBackgroundColor') {
      values.backgroundColor = value
    }
    else values[key] = value
  }

  return values
}

function updateAvatar(key: string, value: string): void {
  avatarCreator.update({ [key]: value })

  if (avatarCreator.avatar.value) {
    avatar.value = avatarCreator.avatar.value
  }
}

function save(): void {
  if (avatarCreator.avatar.value) {
    avatar.value = avatarCreator.avatar.value
    initialAvatar.value = JSON.parse(JSON.stringify(avatarCreator.avatar.value))
    creatorOpen.value = false
    emit('save', avatarCreator.avatar.value)
  }
}

function reset(): void {
  if (initialAvatar.value && initialAvatar.value.extra) {
    const initialOptions = initialAvatar.value.extra as SelectedStyleOptions
    avatarCreator.update(initialOptions)
    avatar.value = avatarCreator.avatar.value
    creatorOpen.value = false
  }
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center"
    :class="{
      'max-w-prose': profile,
    }"
  >
    <UiAvatar
      :size="size"
      class="border-4 border-primary"
    >
      <UiAvatarImage
        :src="avatarCreator.avatar?.value?.url || ''"
        alt="Avatar image"
      />
      <UiAvatarFallback>
        <Icon
          name="tabler:user"
          :class="{
            'size-8 min-w-8': size === 'base',
            'size-6 min-w-6': size === 'sm',
            'size-12 min-w-12': size === 'lg',
          }"
          class="text-muted-foreground"
        />
      </UiAvatarFallback>
    </UiAvatar>
    <div class="bg-primary/50 border-2 border-primary rounded-lg flex w-fit relative bottom-2 backdrop-blur">
      <button
        v-tippy="$t('actions.random')"
        class="size-7 flex flex-col items-center justify-center outline-none text-white"
        :class="{ 'border-r-2 border-primary': !hideCreatorToggle }"
        :aria-label="$t('actions.random')"
        @click="avatarCreator.random()"
      >
        <Icon
          name="tabler:arrows-shuffle-2"
          aria-hidden="true"
          class="size-5"
        />
      </button>
      <button
        v-if="!hideCreatorToggle"
        v-tippy="$t('components.avatarPicker.options')"
        :aria-label="$t('components.avatarPicker.options')"
        class="size-7 flex flex-col items-center justify-center outline-none text-white"
        :class="{ 'border-r-2 border-primary': profile && isChanged }"
        @click="creatorOpen = !creatorOpen"
      >
        <Icon
          name="tabler:shirt"
          aria-hidden="true"
          class="size-5"
        />
      </button>
      <template v-if="profile && isChanged && avatarCreator.avatar.value">
        <button
          v-if="avatar?.extra"
          v-tippy="$t('actions.reset')"
          class="size-7 flex flex-col items-center justify-center outline-none border-r-2 border-primary text-white"
          :aria-label="$t('actions.reset')"
          @click="reset"
        >
          <Icon
            name="tabler:refresh"
            aria-hidden="true"
            class="size-5"
          />
        </button>
        <button
          v-tippy="$t('actions.save')"
          class="size-7 flex flex-col items-center justify-center outline-none text-white"
          :aria-label="$t('actions.save')"
          @click="save"
        >
          <Icon
            name="tabler:device-floppy"
            aria-hidden="true"
            class="size-5"
          />
        </button>
      </template>
    </div>
    <div
      v-if="deprecatedAvatar"
      class="text-foreground text-xs mt-1 bg-destructive/50 rounded-lg py-1 px-2"
    >
      {{ $t('components.avatarPicker.deprecated') }}
    </div>
    <AnimationExpand>
      <div
        v-if="creatorOpen"
        class="flex flex-wrap items-center justify-center gap-1 pt-2"
      >
        <AvatarSelector
          v-for="[key, option] in Object.entries(avatarCreator.configStyleOptions)"
          :key="key"
          :identifier="key"
          :options="option.values"
          :selected="avatarCreator.options.value[key]?.toString().replace('#', '')"
          @update="updateAvatar(key, $event)"
        />
      </div>
    </AnimationExpand>
  </div>
</template>

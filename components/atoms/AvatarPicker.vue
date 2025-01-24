<script setup lang="ts">
import type { AvatarVariants } from '../ui/avatar'

const emit = defineEmits<{
  change: [Avatar]
  save: [Avatar]
}>()

const props = withDefaults(
  defineProps<{
    profile?: boolean
    deprecatedAvatar?: boolean
    hideCreatorToggle?: boolean
    size?: AvatarVariants['size']
    selectedOptions?: SelectedStyleOptions
  }>(), {
    size: 'lg',
  },
)

const avatarCreator = useAvatarCreator()

const creatorOpen = ref<boolean>(props.hideCreatorToggle)

const isChanged = computed<boolean>(() => {
  if (!props.selectedOptions) return true

  const values = filterUnwantedKeys(props.selectedOptions)

  return Object.entries(values)
    .some(([key, value]) => {
      if (key.includes('Color')) {
        const hasHash = avatarCreator.options.value[key].toString().includes('#')

        return hasHash
          ? avatarCreator.options.value[key].toString().replace('#', '') !== value
          : avatarCreator.options.value[key] !== value
      }
      else {
        return avatarCreator.options.value[key] !== value
      }
    })
})

onMounted(() => {
  if (props.selectedOptions) avatarCreator.update(props.selectedOptions)
  else avatarCreator.random()

  if (avatarCreator.avatar.value) {
    emit('change', avatarCreator.avatar.value)
  }
})

function filterUnwantedKeys(selected: SelectedStyleOptions): SelectedStyleOptions {
  const values: SelectedStyleOptions = {}

  for (const key in selected) {
    if (avatarCreator.blackListedKeys.includes(key)) continue

    let value = selected[key]

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
    emit('change', avatarCreator.avatar.value)
  }
}

function save(): void {
  if (avatarCreator.avatar.value) {
    emit('save', avatarCreator.avatar.value)
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
          v-if="props.selectedOptions"
          v-tippy="$t('actions.reset')"
          class="size-7 flex flex-col items-center justify-center outline-none border-r-2 border-primary text-white"
          :aria-label="$t('actions.reset')"
          @click="() => {
            if (props.selectedOptions) avatarCreator.update(props.selectedOptions)
            creatorOpen = false
          }"
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

import { Avatar as DiceBearAvatar } from '@dicebear/core'

export type Avatar = { url: string; extra: Record<string, unknown> }

export function useAvatarCreator() {
  const avatar = ref<Avatar>()
  const options = ref<SelectedStyleOptions>({})

  function update(selectedOptions: SelectedStyleOptions): void {
    Object.assign(options.value, normalizeStyleOptions(selectedOptions))

    generate()
  }

  function random(): void {
    options.value = Object.fromEntries(
      Object.entries(configStyleOptions).map(([key, { values }]) => [
        key,
        randomArrayItem(values),
      ]),
    )

    generate()
  }

  function generate(): void {
    const generatedAvatar = new DiceBearAvatar(
      avatarStyle,
      getAvatarOptions(options.value),
    )

    avatar.value = {
      url: generatedAvatar.toDataUri(),
      extra: getAvatarExtra(generatedAvatar),
    }
  }

  return {
    avatar,
    options,
    configStyleOptions,
    update,
    generate,
    random,
  }
}

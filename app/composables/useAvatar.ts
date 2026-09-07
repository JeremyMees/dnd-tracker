export function useAvatarCreator() {
  const avatar = ref<Avatar>()
  const options = ref<SelectedStyleOptions>({})
  const pending = ref<boolean>(false)
  const configStyleOptions = getStyleOptions()

  let latestRequest = 0

  const generate = useDebounceFn(async (): Promise<void> => {
    const request = ++latestRequest

    pending.value = true

    try {
      const generated = await $fetch<Avatar>('/api/avatar', {
        query: options.value,
      })

      if (request === latestRequest) avatar.value = generated
    } finally {
      if (request === latestRequest) pending.value = false
    }
  }, 150)

  function update(selectedOptions: SelectedStyleOptions): Promise<void> {
    Object.assign(options.value, normalizeStyleOptions(selectedOptions))

    return generate()
  }

  function random(): Promise<void> {
    options.value = Object.fromEntries(
      Object.entries(configStyleOptions).map(([key, { values }]) => [
        key,
        randomArrayItem(values),
      ]),
    )

    return generate()
  }

  return {
    avatar,
    options,
    pending,
    configStyleOptions,
    update,
    generate,
    random,
  }
}

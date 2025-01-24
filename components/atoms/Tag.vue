<script setup lang="ts">
const emit = defineEmits<{
  remove: [string]
  add: [string]
  update: [InitiativeSheetRow['conditions'][0]]
}>()

const props = withDefaults(
  defineProps<{
    condition: InitiativeSheetRow['conditions'][0]
    removable?: boolean
    addable?: boolean
    selected?: boolean
    color?: Color | 'slate'
  }>(), {
    removable: false,
    addable: false,
    selected: false,
    color: 'slate',
  },
)

const amount = ref<number>(props.condition.level || 1)

watch(() => amount.value, (v) => {
  emit('update', { ...props.condition, level: v })
})

function listFromText(text: string, exhaustion: boolean = false): string[] {
  return exhaustion
    ? text.replace('*', '').split(/\|\s\d+\s+\|/g).slice(1).map(bullet => bullet.split('|')[0])
    : text.replace('*', '').split(/\s\*\s/g)
}
</script>

<template>
  <div
    class="px-2 py-1 text-xs rounded-full flex gap-2 w-fit items-center text-white border-2 transition-colors duration-200"
    :class="{
      'bg-black/50 border-black': color === 'black',
      'bg-secondary/50 border-secondary': color === 'slate',
      'bg-primary/50 border-primary': color === 'primary',
      'bg-tertiary/50 border-tertiary': color === 'tertiary',
      'bg-success/50 border-success': color === 'success',
      'bg-info/50 border-info': color === 'info',
      'bg-warning/50 border-warning': color === 'warning',
      'bg-help/50 border-help': color === 'help',
      'bg-destructive/50  border-destructive': color === 'danger',
      'border-white': selected,
    }"
  >
    <tippy
      :delay="0"
      trigger="click"
      interactive
    >
      <span class="whitespace-nowrap cursor-pointer">
        {{ condition.name }} {{ condition.level ? `(${condition.level})` : '' }}
      </span>
      <template #content>
        <div class="p-4 space-y-2 overflow-auto">
          <h3>
            {{ condition.name }}
          </h3>
          <template v-if="condition.desc">
            <ul class="mx-6">
              <li
                v-for="bullet in listFromText(condition.desc, condition.name === 'Exhaustion')"
                :key="bullet"
                class="body-small pb-1"
                :class="[condition.name === 'Exhaustion' ? 'list-decimal' : 'list-disc']"
              >
                {{ bullet }}
              </li>
            </ul>
          </template>
          <div v-if="condition.hasLevels">
            <span class="body-small mb-1 font-bold">
              {{ $t('general.level') }}
            </span>
            <div class="w-fit flex gap-2 items-center bg-secondary/50 rounded-lg border-2 border-secondary">
              <button
                :disabled="amount <= 1"
                class="disabled:opacity-40 disabled:cursor-not-allowed duration-300 ease-in-out py-1 pl-1 pr-2 border-r-2 border-secondary flex flex-col items-center"
                @click="amount--"
              >
                <Icon
                  name="tabler:chevron-left"
                  class="size-6"
                  aria-hidden="true"
                />
              </button>
              <span class="font-bold px-2 min-w-7 text-center">
                {{ amount }}
              </span>
              <button
                :disabled="amount >= 6"
                class="disabled:cursor-not-allowed disabled:opacity-40 py-1 pl-2 pr-1 border-l-2 border-secondary flex flex-col items-center"
                @click="amount++"
              >
                <Icon
                  name="tabler:chevron-right"
                  class="size-6"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <button
            v-if="removable"
            :aria-label="$t('actions.remove')"
            class="btn-destructive w-full"
            @click="$emit('remove', condition.name)"
          >
            {{ $t('actions.remove') }}
          </button>
        </div>
      </template>
    </tippy>
  </div>
</template>

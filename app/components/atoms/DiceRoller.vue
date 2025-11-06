<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

const emit = defineEmits<{ rolled: [amount: number] }>()

withDefaults(defineProps<{
  styled?: boolean
}>(), {
  styled: true,
})

const { toast } = useToast()
const { t } = useI18n()

const dices: Dice[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']
const toRoll = ref<Record<Dice, number>>({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 })

function calculateDiceRoll() {
  const rolled: Partial<Record<Dice, number[]>> = {}

  for (const [dice, count] of Object.entries(toRoll.value)) {
    if (count > 0) {
      rolled[dice as Dice] = rollDice(+dice.replace('d', ''), count)
    }
  }

  const keys = Object.keys(rolled)
  const values = Object.values(rolled)
  const amount = values.reduce((sum, arr) => sum + (arr?.reduce((a, b) => a + b, 0) || 0), 0)

  toast({
    title: t('components.diceRoll.rolled', { amount: values[0]?.length ?? 0, dice: keys.join(', ') }, keys.length),
    description: h('div', { class: 'flex flex-col gap-y-1' }, [
      ...Object.entries(rolled).map(([dice, numbers]) =>
        h('span', [
          h('span', { class: 'font-bold' }, `${dice}: `),
          h('span',
            numbers?.map((num, index) => [
              h('span', {
                class: {
                  'text-success': num === +(dice.replace('d', '')),
                  'text-destructive': num === 1,
                },
              }, num),
              index < numbers.length - 1 ? ', ' : '',
            ]).flat(),
          ),
        ]),
      ),
      Object.values(rolled).flat().length > 1 && h('span', { class: 'flex flex-row' }, [
        h('span', { class: 'font-bold mr-2' }, `${t('general.total')}:`),
        h('span', Object.values(rolled).flat().reduce((a, b) => a + b, 0)),
      ]),
    ]),
  })

  toRoll.value = { d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0 }
  emit('rolled', amount)
}
</script>

<template>
  <div :class="{ 'bg-background rounded-lg p-2 mb-4': styled }">
    <div class="flex items-center gap-x-2">
      <div
        v-for="dice in dices"
        :key="dice"
        class="flex flex-col items-center flex-1"
      >
        <UiButton
          type="button"
          variant="background-ghost"
          size="icon-sm"
          :aria-label="$t('general.more')"
          :disabled="toRoll[dice] >= 100"
          @click="toRoll[dice] = toRoll[dice] ? toRoll[dice] + 1 : 1"
        >
          <Icon name="tabler:caret-up" />
        </UiButton>
        <div class="size-5">
          <NuxtImg
            v-tippy="dice.toUpperCase()"
            :src="`/${dice}.webp`"
            :alt="dice.toUpperCase()"
            sizes="sm:20px md:20px lg:20px"
            class="w-full h-full object-contain"
            format="webp"
            provider="imagekit"
          />
        </div>
        <UiButton
          type="button"
          variant="background-ghost"
          size="icon-sm"
          :aria-label="$t('general.less')"
          :disabled="toRoll[dice] <= 0"
          @click="toRoll[dice] = toRoll[dice] ? toRoll[dice] - 1 : 0"
        >
          <Icon
            name="tabler:caret-down"
            class="size-5"
          />
        </UiButton>
        <span class="text-xs">
          {{ toRoll[dice] }}
        </span>
      </div>
    </div>
    <UiButton
      type="button"
      :disabled="Object.values(toRoll).every((value) => value === 0)"
      class="mt-4 w-full"
      @click="calculateDiceRoll"
    >
      {{ $t('actions.roll') }}
    </UiButton>
  </div>
</template>

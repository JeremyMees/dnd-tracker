<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

withDefaults(
  defineProps<{
    form?: boolean
  }>(),
  {
    form: false,
  },
)

const { toast } = useToast()
const { t } = useI18n()

const input = ref()

onMounted(() => {
  if (input.value) focusInput(input.value)
})

function roll(form: RollForm, node: FormNode): void {
  node.clearErrors()

  const { dice, amount } = sanitizeForm<RollForm>(form)

  const number = +dice.replace('d', '')
  const result = rollDice(number, amount)

  toast({
    title: t('components.sidebar.rolled', { amount, dice: dice.toUpperCase() }),
    description: h('div', { class: 'flex flex-col gap-y-1' }, [
      h(
        'span',
        result.map((num, index) => [
          h('span', {
            class: {
              'text-success': num === number,
              'text-destructive': num === 1,
            },
          }, num),
          index < result.length - 1 ? ', ' : '',
        ]).flat(),
      ),
      h('span', { class: 'flex flex-row' }, [
        h('span', { class: 'font-bold mr-2' }, `${t('general.total')}:`),
        h('span', result.reduce((a, b) => a + b, 0)),
      ]),
    ]),
    variant: 'help',
  })
}

defineExpose({ roll })
</script>

<template>
  <FormKit
    type="togglebuttons"
    name="dice"
    value="d20"
    :options="['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']"
    validation="required"
    :input-class="`${form ? '!border-background' : ''} aria-pressed:!border-primary focus-within:!border-primary`"
  >
    <template #default="{ option }">
      <NuxtImg
        v-tippy="option.value.toUpperCase()"
        :src="`/${option.value}.webp`"
        :alt="option.value.toUpperCase()"
        sizes="sm:20px md:20px lg:20px"
        class="w-full h-full object-contain"
        format="webp"
        provider="imagekit"
      />
    </template>
  </FormKit>
  <div class="flex items-center gap-x-2">
    <FormKit
      ref="input"
      type="number"
      name="amount"
      value="1"
      :min="1"
      :max="100"
      :inner-class="form ? '' : 'border-secondary'"
      outer-class="$remove:mb-4 grow"
      validation="required|min:1|max:100"
    />
    <FormKit
      v-if="!form"
      type="submit"
      :label="$t('actions.roll')"
      input-class="py-2 px-2"
    />
  </div>
</template>

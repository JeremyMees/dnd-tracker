<script setup lang="ts">
import { useFormKitNodeById } from '@formkit/vue'
import { reset } from '@formkit/core'

const props = defineProps<{
  label: string
  sheet: InitiativeSheet | undefined
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

const { t } = useI18n()

const popoverOpen = ref<boolean>(false)

const usedTypes = computed(() => [...new Set(props.sheet?.rows.map(({ type }) => type))])

function rollAllInitiatives() {
  const selected = useFormKitNodeById<string[]>('selected').value?.value ?? []

  props.sheet?.rows
    .filter(({ type }) => selected.includes(type))
    .forEach(({ id }) => useFormKitNodeById(id, (node: FormNode) => node.input(randomRoll(20))))
}

interface QuickInitiativeForm {
  selected: string[]
  ignore: boolean
  [key: string]: any
}

async function handleSubmit(form: QuickInitiativeForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    if (!props.sheet) return

    const { ignore, selected, ...characters } = sanitizeForm<QuickInitiativeForm>(form)

    const rows = [...props.sheet.rows]

    for (const key in characters) {
      if (characters[key].amount !== undefined) {
        const index = rows.findIndex(({ id }) => id === key)

        if (index >= 0) {
          let init = characters[key].amount

          if (!ignore && !isNaN(characters[key].initiative)) init += characters[key].initiative

          if (rows[index]) rows[index] = { ...rows[index], initiative: Math.max(init, 0) }
        }
      }
    }

    await props.update({ rows })
    popoverOpen.value = false
  }
  catch (err: any) {
    reset('InitiativeRowInit')
    node.setErrors(t('general.error.text'))
  }
}
</script>

<template>
  <div>
    <UiPopover v-model:open="popoverOpen">
      <UiPopoverTrigger as-child>
        <button
          id="tour-10"
          class="flex items-center gap-x-1 w-fit rounded-lg hover:bg-warning/50 hover:text-foreground hover:-mx-2 hover:-my-1 hover:px-2 hover:py-1 transition-all duration-300"
        >
          {{ label }}
          <Icon
            name="tabler:bolt-filled"
            class="text-warning"
          />
        </button>
      </UiPopoverTrigger>
      <UiPopoverContent>
        <UiPopoverHeader>
          <UiPopoverTitle>
            {{ $t('components.initiativeTableHeader.initiative.title') }}
          </UiPopoverTitle>
        </UiPopoverHeader>
        <FormKit
          id="form"
          type="form"
          :actions="false"
          @submit="handleSubmit"
        >
          <div class="flex flex-col">
            <FormKit
              v-for="row in sheet?.rows || []"
              :key="row.id"
              :name="row.id.toString()"
              type="group"
            >
              <div class="flex gap-x-2 items-end">
                <FormKit
                  :id="row.id"
                  name="amount"
                  :label="row.name"
                  validation="between:0,50|number"
                  type="number"
                  number
                  outer-class="grow"
                  suffix-icon="tabler:hexagon"
                  @suffix-icon-click="(node: FormNode) => node.input(randomRoll(20))"
                />
                <FormKit
                  name="initiative"
                  label="MOD"
                  validation="between:-20,20|number"
                  type="number"
                  number
                  min="-20"
                  max="20"
                  outer-class="w-[100px]"
                />
              </div>
            </FormKit>
          </div>
          <div class="py-4">
            <FormKit
              id="selected"
              name="selected"
              type="checkbox"
              :value="usedTypes"
              :label="$t('components.initiativeTableHeader.initiative.select')"
              :options="usedTypes.map((type) => ({
                label: $t(`general.${type}`),
                value: type,
              }))"
              options-class="flex flex-wrap gap-y-2 gap-x-6"
            />
            <FormKit
              name="ignore"
              type="toggle"
              outer-class="!mb-0"
              wrapper-class="!mb-0"
              :label="$t('components.initiativeTableHeader.initiative.ignore')"
            />
          </div>
          <div class="flex gap-2 items-center">
            <FormKit
              :aria-label="$t('components.initiativeTableHeader.initiative.roll')"
              type="button"
              input-class="$reset !mb-0 btn-primary"
              outer-class="!mb-0"
              @click="rollAllInitiatives"
            >
              {{ $t('components.initiativeTableHeader.initiative.roll') }}
            </FormKit>
            <FormKit
              :aria-label="$t('actions.update')"
              outer-class="!mb-0 grow"
              type="submit"
            >
              {{ $t('actions.update') }}
            </FormKit>
          </div>
        </FormKit>
      </UiPopoverContent>
    </UiPopover>
  </div>
</template>

const passthrough = { template: '<div><slot /></div>' }

const item = {
  props: { disabled: Boolean },
  emits: ['select'],
  template:
    '<button :disabled="disabled" @click="$emit(\'select\')"><slot /></button>',
}

const checkboxItem = {
  props: { modelValue: Boolean },
  emits: ['update:modelValue'],
  template:
    '<button role="menuitemcheckbox" :aria-checked="String(modelValue)" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>',
}

export const dropdownStubs = {
  DropdownMenu: passthrough,
  DropdownMenuTrigger: passthrough,
  DropdownMenuContent: passthrough,
  DropdownMenuGroup: passthrough,
  DropdownMenuLabel: passthrough,
  DropdownMenuSeparator: { template: '<hr />' },
  DropdownMenuSub: passthrough,
  DropdownMenuSubContent: passthrough,
  DropdownMenuSubTrigger: item,
  DropdownMenuItem: item,
  DropdownMenuCheckboxItem: checkboxItem,
}

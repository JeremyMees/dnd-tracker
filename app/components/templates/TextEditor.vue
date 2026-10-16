<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import { CharacterCount, Placeholder } from '@tiptap/extensions'

const emit = defineEmits<{ updated: [string] }>()

const props = withDefaults(
  defineProps<{
    content?: string
    charLimit?: number
    placeholder?: string
    variant?: 'input' | 'widget'
  }>(),
  {
    content: '',
    charLimit: 5000,
    placeholder: 'components.tipTapEditor.placeholder',
    variant: 'input',
  },
)

const { t } = useI18n()

const editor = ref<Editor>()
const isOpen = ref<boolean>(false)
const dropdown = ref<HTMLDivElement>()
const invalidHTML = ref<boolean>(false)
const isFocused = ref<boolean>(false)

onClickOutside(dropdown, () => (isOpen.value = false))
onKeyStroke('Escape', () => (isOpen.value = false))

type HeadingLevel = 1 | 2 | 3

onMounted(() => {
  editor.value = new Editor({
    content: props.content,
    extensions: [
      Highlight,
      Placeholder.configure({ placeholder: t(props.placeholder) }),
      CharacterCount.configure({ limit: props.charLimit }),
      StarterKit.configure({
        codeBlock: false,
        hardBreak: false,
        code: false,
        listKeymap: false,
        underline: false,
        heading: { levels: [1, 2, 3] },
      }),
    ],
    editorProps: {
      attributes: { spellcheck: 'false' },
    },
    onUpdate() {
      sanitizeBeforeUpdate()
    },
    onFocus() {
      isFocused.value = true
    },
    onBlur() {
      isFocused.value = false
    },
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value = undefined
})

watchDebounced(
  () => props.content,
  v => {
    if (isFocused.value) return
    if (v !== editor.value?.getHTML()) editor.value?.commands.setContent(v)
  },
  { debounce: 500, maxWait: 1000 },
)

const sanitizeBeforeUpdate = useDebounceFn(
  async () => {
    if (!editor.value) return

    invalidHTML.value = false

    const dirty = editor.value.getHTML()
    const clean = await sanitizeClientHTML(dirty)

    if (dirty === clean) emit('updated', clean)
    else invalidHTML.value = true
  },
  500,
  { maxWait: 2500 },
)

function chain() {
  return editor.value!.chain().focus()
}

const toolbarGroups = computed<EditorToolbarButton[][]>(() => {
  const current = editor.value

  if (!current) return []

  return [
    [
      {
        id: 'link',
        icon: 'tabler:link',
        label: t('general.link'),
        active: current.isActive('link'),
        run: setLink,
      },
      {
        id: 'unlink',
        icon: 'tabler:unlink',
        label: t('actions.unlink'),
        disabled: !current.isActive('link'),
        run: () => chain().unsetLink().run(),
      },
      {
        id: 'bullet-list',
        icon: 'tabler:list',
        label: t('general.unOrderedList'),
        active: current.isActive('bulletList'),
        run: () => chain().toggleBulletList().run(),
      },
      {
        id: 'ordered-list',
        icon: 'tabler:list-numbers',
        label: t('general.orderedList'),
        active: current.isActive('orderedList'),
        run: () => chain().toggleOrderedList().run(),
      },
      {
        id: 'blockquote',
        icon: 'tabler:blockquote',
        label: t('general.quote'),
        active: current.isActive('blockquote'),
        run: () => chain().toggleBlockquote().run(),
      },
      {
        id: 'horizontal-rule',
        icon: 'tabler:separator',
        label: t('general.horizontalRule'),
        run: () => chain().setHorizontalRule().run(),
      },
    ],
    [
      {
        id: 'bold',
        icon: 'tabler:bold',
        label: t('general.bold'),
        active: current.isActive('bold'),
        disabled: !current.can().chain().focus().toggleBold().run(),
        run: () => chain().toggleBold().run(),
      },
      {
        id: 'italic',
        icon: 'tabler:italic',
        label: t('general.italic'),
        active: current.isActive('italic'),
        disabled: !current.can().chain().focus().toggleItalic().run(),
        run: () => chain().toggleItalic().run(),
      },
      {
        id: 'strike',
        icon: 'tabler:strikethrough',
        label: t('general.strikeThrough'),
        active: current.isActive('strike'),
        disabled: !current.can().chain().focus().toggleStrike().run(),
        run: () => chain().toggleStrike().run(),
      },
      {
        id: 'highlight',
        icon: 'tabler:highlight',
        label: t('actions.highlight'),
        active: current.isActive('highlight'),
        run: () => chain().toggleHighlight().run(),
      },
      {
        id: 'clear-formatting',
        icon: 'tabler:clear-formatting',
        label: t('actions.clearFormatting'),
        run: () => chain().unsetAllMarks().run(),
      },
    ],
    [
      {
        id: 'undo',
        icon: 'tabler:arrow-back',
        label: t('actions.undo'),
        disabled: !current.can().chain().focus().undo().run(),
        run: () => chain().undo().run(),
      },
      {
        id: 'redo',
        icon: 'tabler:arrow-forward',
        label: t('actions.redo'),
        disabled: !current.can().chain().focus().redo().run(),
        run: () => chain().redo().run(),
      },
    ],
  ]
})

const characterStats = computed(() => {
  if (!editor.value) return { characters: 0, words: 0 }

  return {
    characters: editor.value.storage.characterCount.characters(),
    words: editor.value.storage.characterCount.words(),
  }
})

function setLink() {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('Link url', previousUrl)

  if (url === null) return

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  } else {
    editor.value
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run()
  }
}
</script>

<template>
  <ClientOnly>
    <div
      v-if="editor"
      test-id="editor"
      class="py-2 px-0 rounded-lg"
      :class="{
        'border border-input bg-background': variant === 'input',
        'border-4 border-secondary bg-secondary/50': variant === 'widget',
        'ring-offset-background ring-2 ring-ring':
          isFocused && variant === 'input',
        'border-primary!': isFocused && variant === 'widget',
      }"
    >
      <div
        class="border-b pb-1 px-2 mb-2 flex items-center gap-x-2 flex-wrap"
        :class="{
          'border-secondary': variant === 'widget',
        }"
      >
        <div
          ref="dropdown"
          class="relative group w-fit"
          test-id="dropdown-wrapper"
          @mouseleave="isOpen = false"
        >
          <button
            class="group-hover:bg-secondary px-1 pt-1 rounded-lg rounded-b-none flex flex-row items-center cursor-pointer duration-200 ease-in-out transition-all"
            aria-label="Text style dropdown"
            type="button"
            test-id="text-style-dropdown"
            @mouseenter="isOpen = true"
            @click="isOpen = true"
          >
            <span
              class="duration-200 font-bold text-sm min-w-10"
              test-id="heading-label"
            >
              {{
                editor.isActive('heading')
                  ? `H${editor.getAttributes('heading').level}`
                  : $t('general.text')
              }}
            </span>
            <Icon
              class="size-4"
              name="tabler:chevron-down"
              aria-hidden="true"
            />
          </button>
          <AnimationExpand>
            <div
              v-if="isOpen"
              class="absolute z-1 block w-max left-0"
              test-id="dropdown-menu"
            >
              <div
                class="flex flex-col gap-y-1 p-2 relative rounded-b-lg rounded-tr-lg bg-secondary"
              >
                <button
                  type="button"
                  :aria-label="$t('general.paragraph')"
                  :class="{
                    'bg-muted!': editor.isActive('paragraph'),
                  }"
                  class="flex items-center gap-x-2 px-2 py-1 rounded-md hover:bg-foreground/50"
                  test-id="paragraph"
                  @click="
                    () => {
                      editor?.chain().focus().setParagraph().run()
                      isOpen = false
                    }
                  "
                >
                  <Icon
                    name="tabler:pilcrow"
                    class="size-4"
                    aria-hidden="true"
                  />
                  <span class="text-sm">
                    {{ $t('general.paragraph') }}
                  </span>
                </button>
                <button
                  v-for="level in 3"
                  :key="level"
                  type="button"
                  :aria-label="`${$t('general.heading')} ${level}`"
                  :class="{
                    'bg-muted!': editor.isActive('heading', { level }),
                  }"
                  class="flex items-center gap-x-2 px-2 py-1 rounded-md hover:bg-foreground/50"
                  :test-id="`heading-${level}`"
                  @click="
                    () => {
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({ level: level as HeadingLevel })
                        .run()
                      isOpen = false
                    }
                  "
                >
                  <Icon
                    :name="`tabler:h-${level}`"
                    class="size-4"
                    aria-hidden="true"
                  />
                  <span class="text-sm">
                    {{ $t('general.heading') }} {{ level }}
                  </span>
                </button>
              </div>
            </div>
          </AnimationExpand>
        </div>
        <div
          v-for="(group, index) in toolbarGroups"
          :key="index"
          class="flex items-center"
          :class="
            index < toolbarGroups.length - 1 && [
              'border-r pr-2',
              variant === 'input' ? 'border-input' : 'border-secondary',
            ]
          "
        >
          <Tooltip
            v-for="button in group"
            :key="button.id"
            :text="button.label"
          >
            <UiButton
              type="button"
              size="icon-sm"
              variant="default-ghost"
              :class="{ 'bg-primary!': button.active }"
              :disabled="button.disabled"
              :aria-label="button.label"
              :test-id="button.id"
              @click="button.run"
            >
              <Icon :name="button.icon" aria-hidden="true" />
            </UiButton>
          </Tooltip>
        </div>
      </div>
      <EditorContent
        :editor="editor"
        :class="{ 'html-invalid': invalidHTML }"
        class="html-richtext"
        test-id="editor-content"
      />
      <div class="flex items-center gap-2 px-2 pt-4">
        <PercentageDial :limit="charLimit" :value="characterStats.characters" />
        <div
          class="flex flex-col text-xs text-muted-foreground duration-300 transition-colors"
        >
          <span
            :class="{
              'text-destructive': characterStats.characters === charLimit,
            }"
          >
            {{ characterStats.characters }} / {{ charLimit }}
            {{ $t('general.character', 2).toLowerCase() }}
          </span>
          <span>
            {{ characterStats.words }} {{ $t('general.word', 2).toLowerCase() }}
          </span>
        </div>
      </div>
    </div>
    <slot name="error" />
    <template #fallback>
      <UiSkeleton class="w-full h-[190px]" />
    </template>
  </ClientOnly>
</template>

<style>
@reference '~/assets/css/global.css';

.html-invalid .tiptap {
  @apply outline-destructive!;
}

.tiptap {
  @apply first:mt-0 outline-none py-2 px-4 min-h-20;

  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    @apply text-muted-foreground float-left h-0 pointer-events-none;
  }
}
</style>

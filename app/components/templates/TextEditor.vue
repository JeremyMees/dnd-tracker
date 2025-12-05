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
  }>(), {
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

onClickOutside(dropdown, () => isOpen.value = false)
onKeyStroke('Escape', () => isOpen.value = false)

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

onBeforeUnmount(() => editor.value?.destroy())

watchDebounced(() => props.content, (v) => {
  if (isFocused.value) return
  if (v !== editor.value?.getHTML()) editor.value?.commands.setContent(v)
}, { debounce: 500, maxWait: 1000 })

const sanitizeBeforeUpdate = useDebounceFn(() => {
  if (!editor.value) return

  invalidHTML.value = false

  const dirty = editor.value.getHTML()
  const clean = sanitizeHTML(dirty)

  if (dirty === clean) emit('updated', clean)
  else invalidHTML.value = true
}, 500, { maxWait: 2500 })

const buttonStates = computed(() => ({
  isBold: editor.value?.isActive('bold') ?? false,
  isItalic: editor.value?.isActive('italic') ?? false,
  isStrike: editor.value?.isActive('strike') ?? false,
  isHighlight: editor.value?.isActive('highlight') ?? false,
  isLink: editor.value?.isActive('link') ?? false,
  isBulletList: editor.value?.isActive('bulletList') ?? false,
  isOrderedList: editor.value?.isActive('orderedList') ?? false,
  isBlockquote: editor.value?.isActive('blockquote') ?? false,
  canUndo: editor.value?.can().chain().focus().undo().run() ?? false,
  canRedo: editor.value?.can().chain().focus().redo().run() ?? false,
  canBold: editor.value?.can().chain().focus().toggleBold().run() ?? false,
  canItalic: editor.value?.can().chain().focus().toggleItalic().run() ?? false,
  canStrike: editor.value?.can().chain().focus().toggleStrike().run() ?? false,
}))

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
  }
  else {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
}
</script>

<template>
  <ClientOnly>
    <div
      v-if="editor"
      class="py-2 px-0 rounded-lg"
      :class="{
        'border border-input bg-background': variant === 'input',
        'border-4 border-secondary bg-secondary/50': variant === 'widget',
        'ring-offset-background ring-2 ring-ring': isFocused && variant === 'input',
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
          @mouseleave="isOpen = false"
        >
          <button
            class="group-hover:bg-secondary px-1 pt-1 rounded-lg rounded-b-none flex flex-row items-center cursor-pointer duration-200 ease-in-out transition-all"
            aria-label="Text style dropdown"
            type="button"
            @mouseenter="isOpen = true"
            @click="isOpen = true"
          >
            <span class="duration-200 font-bold text-sm min-w-10">
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
            >
              <div class="flex flex-col gap-y-1 p-2 relative rounded-b-lg rounded-tr-lg bg-secondary">
                <button
                  type="button"
                  :aria-label="$t('general.paragraph')"
                  :class="{
                    'bg-muted!': editor.isActive('paragraph'),
                  }"
                  class="flex items-center gap-x-2 px-2 py-1 rounded-md hover:bg-foreground/50"
                  @click="() => {
                    editor?.chain().focus().setParagraph().run()
                    isOpen = false
                  }"
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
                  @click="() => {
                    editor?.chain().focus().toggleHeading({ level: level as HeadingLevel }).run()
                    isOpen = false
                  }"
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
          class="flex items-center border-r pr-2"
          :class="{
            'border-input': variant === 'input',
            'border-secondary': variant === 'widget',
          }"
        >
          <UiButton
            v-tippy="$t('general.link')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :class="{ 'bg-primary': buttonStates.isLink }"
            :aria-label="$t('general.link')"
            @click="setLink"
          >
            <Icon
              name="tabler:link"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('actions.unlink')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :disabled="!buttonStates.isLink"
            :aria-label="$t('actions.unlink')"
            @click="editor.chain().focus().unsetLink().run()"
          >
            <Icon
              name="tabler:unlink"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('general.unOrderedList')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :class="{ 'bg-primary!': buttonStates.isBulletList }"
            :aria-label="$t('general.unOrderedList')"
            @click="editor.chain().focus().toggleBulletList().run()"
          >
            <Icon
              name="tabler:list"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('general.orderedList')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :class="{ 'bg-primary!': buttonStates.isOrderedList }"
            :aria-label="$t('general.orderedList')"
            @click="editor.chain().focus().toggleOrderedList().run()"
          >
            <Icon
              name="tabler:list-numbers"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('general.quote')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :class="{ 'bg-primary!': buttonStates.isBlockquote }"
            :aria-label="$t('general.quote')"
            @click="editor.chain().focus().toggleBlockquote().run()"
          >
            <Icon
              name="tabler:blockquote"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('general.horizontalRule')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :aria-label="$t('general.horizontalRule')"
            @click="editor.chain().focus().setHorizontalRule().run()"
          >
            <Icon
              name="tabler:separator"
              aria-hidden="true"
            />
          </UiButton>
        </div>
        <div
          class="flex items-center border-r pr-2"
          :class="{
            'border-input': variant === 'input',
            'border-secondary': variant === 'widget',
          }"
        >
          <UiButton
            v-tippy="$t('general.bold')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :class="{ 'bg-primary!': buttonStates.isBold }"
            :disabled="!buttonStates.canBold"
            :aria-label="$t('general.bold')"
            @click="editor.chain().focus().toggleBold().run()"
          >
            <Icon
              name="tabler:bold"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('general.italic')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :class="{ 'bg-primary!': buttonStates.isItalic }"
            :disabled="!buttonStates.canItalic"
            :aria-label="$t('general.italic')"
            @click="editor.chain().focus().toggleItalic().run()"
          >
            <Icon
              name="tabler:italic"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('general.strikeThrough')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :class="{ 'bg-primary!': buttonStates.isStrike }"
            :disabled="!buttonStates.canStrike"
            :aria-label="$t('general.strikeThrough')"
            @click="editor.chain().focus().toggleStrike().run()"
          >
            <Icon
              name="tabler:strikethrough"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('actions.highlight')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :class="{ 'bg-primary!': buttonStates.isHighlight }"
            :aria-label="$t('actions.highlight')"
            @click="editor.chain().focus().toggleHighlight().run()"
          >
            <Icon
              name="tabler:highlight"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('actions.clearFormatting')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :aria-label="$t('actions.clearFormatting')"
            @click="editor.chain().focus().unsetAllMarks().run()"
          >
            <Icon
              name="tabler:clear-formatting"
              aria-hidden="true"
            />
          </UiButton>
        </div>
        <div class="flex items-center">
          <UiButton
            v-tippy="$t('actions.undo')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :disabled="!buttonStates.canUndo"
            :aria-label="$t('actions.undo')"
            @click="editor.chain().focus().undo().run()"
          >
            <Icon
              name="tabler:arrow-back"
              aria-hidden="true"
            />
          </UiButton>
          <UiButton
            v-tippy="$t('actions.redo')"
            type="button"
            size="icon-sm"
            variant="default-ghost"
            :disabled="!buttonStates.canRedo"
            :aria-label="$t('actions.redo')"
            @click="editor.chain().focus().redo().run()"
          >
            <Icon
              name="tabler:arrow-forward"
              aria-hidden="true"
            />
          </UiButton>
        </div>
      </div>
      <EditorContent
        :editor="editor"
        :class="{ 'html-invalid': invalidHTML }"
        class="html-richtext"
      />
      <div class="flex items-center gap-2 px-2 pt-4">
        <PercentageDial
          :limit="charLimit"
          :value="characterStats.characters"
        />
        <div class="flex flex-col text-xs text-muted-foreground duration-300 transition-colors">
          <span
            :class="{
              'text-destructive': characterStats.characters === charLimit,
            }"
          >
            {{ characterStats.characters }} / {{ charLimit }} {{ $t('general.character', 2).toLowerCase() }}
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

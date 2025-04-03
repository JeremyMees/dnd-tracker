<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'

const emit = defineEmits<{ updated: [string] }>()

const props = withDefaults(
  defineProps<{
    content?: string
    charLimit?: number
    placeholder?: string
    color?: 'background' | 'secondary'
  }>(), {
    content: '',
    charLimit: 5000,
    placeholder: 'components.tipTapEditor.placeholder',
    color: 'secondary',
  },
)

const { t } = useI18n()

const editor = ref<Editor>()
const isOpen = ref<boolean>(false)
const dropdown = ref<HTMLDivElement>()
const invalidHTML = ref<boolean>(false)
const isFocused = ref<boolean>(false)

onClickOutside(dropdown, () => close())
onKeyStroke('Escape', () => close())

type HeadingLevel = 1 | 2 | 3

onMounted(() => {
  editor.value = new Editor({
    content: props.content,
    extensions: [
      Highlight,
      Link,
      Placeholder.configure({ placeholder: t(props.placeholder) }),
      CharacterCount.configure({ limit: props.charLimit }),
      StarterKit.configure({
        codeBlock: false,
        hardBreak: false,
        code: false,
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

watch(() => props.content, (v) => {
  if (v !== editor.value?.getHTML()) editor.value?.commands.setContent(v)
})

const sanitizeBeforeUpdate = useDebounceFn(() => {
  if (!editor.value) return

  invalidHTML.value = false

  const dirty = editor.value.getHTML()
  const clean = sanitizeHTML(dirty)

  if (dirty === clean) emit('updated', clean)
  else invalidHTML.value = true
}, 500, { maxWait: 2500 })

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
    <Card
      v-if="editor"
      :color="color"
      no-padding
      class="py-2 px-0"
      :class="{
        'border-primary': isFocused,
        '!bg-background': color === 'background',
      }"
    >
      <div
        class="border-b pb-1 px-2 mb-2 flex items-center gap-x-2 flex-wrap"
        :class="{
          'border-background': color === 'background',
          'border-secondary': color === 'secondary',
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
          >
            <span class="duration-200 font-bold body-small min-w-10">
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
              class="absolute z-[1] block w-max left-0"
            >
              <div class="flex flex-col gap-y-1 p-2 relative rounded-b-lg rounded-tr-lg bg-secondary">
                <button
                  type="button"
                  :aria-label="$t('general.paragraph')"
                  :class="{
                    '!bg-muted': editor.isActive('paragraph'),
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
                  <span class="body-small">
                    {{ $t('general.paragraph') }}
                  </span>
                </button>
                <button
                  v-for="level in 3"
                  :key="level"
                  type="button"
                  :aria-label="`${$t('general.heading')} ${level}`"
                  :class="{
                    '!bg-foreground': editor.isActive('heading', { level }),
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
                  <span class="body-small">
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
            'border-background': color === 'background',
            'border-secondary': color === 'secondary',
          }"
        >
          <button
            v-tippy="$t('general.link')"
            type="button"
            :aria-label="$t('general.link')"
            :class="{ '!bg-primary/100': editor.isActive('link') }"
            class="icon-btn-primary size-6 text-foreground"
            @click="setLink"
          >
            <Icon
              name="tabler:link"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('actions.unlink')"
            type="button"
            :aria-label="$t('actions.unlink')"
            class="icon-btn-primary size-6 text-foreground"
            :disabled="!editor.isActive('link')"
            @click="editor.chain().focus().unsetLink().run()"
          >
            <Icon
              name="tabler:unlink"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('general.unOrderedList')"
            type="button"
            :aria-label="$t('general.unOrderedList')"
            :class="{ '!bg-primary/100': editor.isActive('bulletList') }"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().toggleBulletList().run()"
          >
            <Icon
              name="tabler:list"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('general.orderedList')"
            type="button"
            :aria-label="$t('general.orderedList')"
            :class="{ '!bg-primary/100': editor.isActive('orderedList') }"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().toggleOrderedList().run()"
          >
            <Icon
              name="tabler:list-numbers"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('general.quote')"
            type="button"
            :aria-label="$t('general.quote')"
            :class="{ '!bg-primary/100': editor.isActive('blockquote') }"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().toggleBlockquote().run()"
          >
            <Icon
              name="tabler:blockquote"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('general.horizontalRule')"
            type="button"
            :aria-label="$t('general.horizontalRule')"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().setHorizontalRule().run()"
          >
            <Icon
              name="tabler:separator"
              class="size-4"
              aria-hidden="true"
            />
          </button>
        </div>
        <div
          class="flex items-center border-r pr-2"
          :class="{
            'border-background': color === 'background',
            'border-secondary': color === 'secondary',
          }"
        >
          <button
            v-tippy="$t('general.bold')"
            type="button"
            :aria-label="$t('general.bold')"
            :disabled="!editor.can().chain().focus().toggleBold().run()"
            :class="{ '!bg-primary/100': editor.isActive('bold') }"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().toggleBold().run()"
          >
            <Icon
              name="tabler:bold"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('general.italic')"
            type="button"
            :aria-label="$t('general.italic')"
            :disabled="!editor.can().chain().focus().toggleItalic().run()"
            :class="{ '!bg-primary/100': editor.isActive('italic') }"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().toggleItalic().run()"
          >
            <Icon
              name="tabler:italic"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('general.strikeThrough')"
            type="button"
            :aria-label="$t('general.strikeThrough')"
            :disabled="!editor.can().chain().focus().toggleStrike().run()"
            :class="{ '!bg-primary/100': editor.isActive('strike') }"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().toggleStrike().run()"
          >
            <Icon
              name="tabler:strikethrough"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('actions.highlight')"
            type="button"
            :aria-label="$t('actions.highlight')"
            :class="{ '!bg-primary/100': editor.isActive('highlight') }"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().toggleHighlight().run()"
          >
            <Icon
              name="tabler:highlight"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('actions.clearFormatting')"
            type="button"
            :aria-label="$t('actions.clearFormatting')"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().unsetAllMarks().run()"
          >
            <Icon
              name="tabler:clear-formatting"
              class="size-4"
              aria-hidden="true"
            />
          </button>
        </div>
        <div class="flex items-center">
          <button
            v-tippy="$t('actions.undo')"
            type="button"
            :aria-label="$t('actions.undo')"
            :disabled="!editor.can().chain().focus().undo().run()"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().undo().run()"
          >
            <Icon
              name="tabler:arrow-back"
              class="size-4"
              aria-hidden="true"
            />
          </button>
          <button
            v-tippy="$t('actions.redo')"
            type="button"
            :aria-label="$t('actions.redo')"
            :disabled="!editor.can().chain().focus().redo().run()"
            class="icon-btn-primary size-6 text-foreground"
            @click="editor.chain().focus().redo().run()"
          >
            <Icon
              name="tabler:arrow-forward"
              class="size-4"
              aria-hidden="true"
            />
          </button>
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
          :value="editor.storage.characterCount.characters()"
        />
        <div class="flex flex-col text-xs text-muted-foreground duration-300 transition-colors">
          <span
            :class="{
              'text-destructive': editor.storage.characterCount.characters() === charLimit,
            }"
          >
            {{ editor.storage.characterCount.characters() }} / {{ charLimit }} {{ $t('general.character', 2).toLowerCase() }}
          </span>
          <span>
            {{ editor.storage.characterCount.words() }} {{ $t('general.word', 2).toLowerCase() }}
          </span>
        </div>
      </div>
    </Card>
    <slot name="error" />
    <template #fallback>
      <UiSkeleton class="w-full h-[190px]" />
    </template>
  </ClientOnly>
</template>

<style>
.html-invalid .tiptap {
  @apply !outline-destructive;
}

.tiptap {
  @apply first:mt-0 outline-none py-2 px-4 min-h-20;

  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    @apply text-muted-foreground float-left h-0 pointer-events-none;
  }
}
</style>

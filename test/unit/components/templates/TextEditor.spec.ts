import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import TextEditor from '~/components/templates/TextEditor.vue'

interface Props {
  content?: string
  charLimit?: number
  placeholder?: string
  color?: 'background' | 'secondary'
}

const props: Props = {
  content: '',
  charLimit: 5000,
  placeholder: 'components.tipTapEditor.placeholder',
  color: 'secondary',
}

describe('TextEditor', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(TextEditor, { props })

    expect(component.html()).toMatchSnapshot()
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { mockStorage, setStorageItem } from '~~/test/unit/stubs/storage'
import { fillEmailTemplate, renderEmail } from '~~/server/utils/email'

describe('fillEmailTemplate', () => {
  it('escapes double-brace values in html', () => {
    expect(
      fillEmailTemplate(
        '<p>Hi {{ name }}</p>',
        { name: '<b>"Tom" & \'Jerry\'</b>' },
        'html',
      ),
    ).toBe('<p>Hi &lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;</p>')
  })

  it('inserts triple-brace values as raw html', () => {
    expect(
      fillEmailTemplate(
        '<div>{{{ note }}}</div>',
        { note: '<p>Hello</p>' },
        'html',
      ),
    ).toBe('<div><p>Hello</p></div>')
  })

  it('accepts placeholders with or without inner spaces', () => {
    expect(
      fillEmailTemplate(
        '{{a}} {{ b }} {{{c}}}',
        { a: '1', b: '2', c: '3' },
        'html',
      ),
    ).toBe('1 2 3')
  })

  it('leaves double-brace values unescaped in text', () => {
    expect(
      fillEmailTemplate('Hi {{ name }}', { name: 'Tom & Jerry' }, 'text'),
    ).toBe('Hi Tom & Jerry')
  })

  it('strips triple-brace html to lines of text', () => {
    expect(
      fillEmailTemplate(
        'Note:\n{{{ note }}}',
        {
          note: '<h2>Title</h2><p>One <strong>two</strong></p><ul><li>A</li><li>B</li></ul>',
        },
        'text',
      ),
    ).toBe('Note:\nTitle\nOne two\nA\nB')
  })

  it('does not fill placeholders that appear inside inserted values', () => {
    expect(
      fillEmailTemplate(
        '{{{ note }}} {{ name }}',
        { note: '{{ name }}', name: 'Tom' },
        'html',
      ),
    ).toBe('{{ name }} Tom')
  })

  it('keeps a section when its value is set', () => {
    expect(
      fillEmailTemplate(
        'Mail{{#name}} from {{ name }}{{/name}}',
        { name: 'Tom' },
        'text',
      ),
    ).toBe('Mail from Tom')
  })

  it('removes a section and its placeholders when its value is missing or empty', () => {
    const template = '<p>A</p>{{#name}}<p>{{ name }}</p>{{/name}}<p>B</p>'

    expect(fillEmailTemplate(template, {}, 'html')).toBe('<p>A</p><p>B</p>')
    expect(fillEmailTemplate(template, { name: '' }, 'html')).toBe(
      '<p>A</p><p>B</p>',
    )
  })

  it('throws when a value is missing', () => {
    expect(() => fillEmailTemplate('{{ name }}', {}, 'html')).toThrow(
      'Missing email value for "name"',
    )
  })
})

describe('renderEmail', () => {
  beforeEach(() => {
    mockStorage()
  })

  it('fills the compiled html and text templates from server assets', async () => {
    setStorageItem(
      'emails:CampaignInviteNoUser.html',
      '<p>{{ invitedBy }} invited you to {{ campaign }}</p>',
    )
    setStorageItem(
      'emails:CampaignInviteNoUser.txt',
      '{{ invitedBy }} invited you to {{ campaign }}',
    )

    await expect(
      renderEmail('CampaignInviteNoUser', {
        campaign: 'Curse <of> Strahd',
        invitedBy: 'The DM',
      }),
    ).resolves.toEqual({
      html: '<p>The DM invited you to Curse &lt;of&gt; Strahd</p>',
      text: 'The DM invited you to Curse <of> Strahd',
    })
  })

  it('throws when the compiled template is missing', async () => {
    setStorageItem('emails:CampaignInviteNoUser.html', '<p></p>')

    await expect(
      renderEmail('CampaignInviteNoUser', { campaign: 'A', invitedBy: 'B' }),
    ).rejects.toThrow(
      'Compiled email template "CampaignInviteNoUser" not found',
    )
  })
})

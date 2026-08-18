import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import GameSystemFilter from '~/components/atoms/GameSystemFilter.vue'

interface Props {
  documents: Open5eDocument[]
  disabled?: boolean
}

interface Vm {
  documentOptions: Record<Open5eGameSystem, Open5eDocument[]>
}

function createDocument(
  key: string,
  displayName: string,
  gamesystem: Open5eGameSystem,
  publisherKey: string,
  publisherName: string,
): Open5eDocument {
  return {
    name: displayName,
    key,
    url: `https://api.open5e.com/v2/documents/${key}/`,
    licenses: [],
    publisher: {
      name: publisherName,
      key: publisherKey,
      url: `https://api.open5e.com/v2/publishers/${publisherKey}/`,
    },
    gamesystem: {
      name: gamesystem,
      key: gamesystem,
      url: `https://api.open5e.com/v2/gamesystems/${gamesystem}/`,
    },
    display_name: displayName,
    desc: '',
    type: 'document',
    author: publisherName,
    publication_date: '2014-01-01',
    permalink: `https://example.com/${key}`,
    distance_unit: 'ft',
    weight_unit: 'lb',
  }
}

const wotcDoc2014 = createDocument(
  'srd-2014',
  'SRD 2014',
  '5e-2014',
  'wizards-of-the-coast',
  'Wizards of the Coast',
)
const koboldDoc2014 = createDocument(
  'kobold-2014',
  'Kobold Press 2014',
  '5e-2014',
  'kobold-press',
  'Kobold Press',
)
const greenRoninDoc2014 = createDocument(
  'green-ronin-2014',
  'Green Ronin 2014',
  '5e-2014',
  'green-ronin',
  'Green Ronin',
)
const wotcDoc2024 = createDocument(
  'srd-2024',
  'SRD 2024',
  '5e-2024',
  'wizards-of-the-coast',
  'Wizards of the Coast',
)

const documents: Open5eDocument[] = [
  koboldDoc2014,
  wotcDoc2014,
  greenRoninDoc2014,
  wotcDoc2024,
]

const props: Props = {
  documents,
}

const popoverContentStub = { template: '<div><slot /></div>' }

const stubs = {
  PopoverContent: popoverContentStub,
}

describe('GameSystemFilter', async () => {
  it('Should match snapshot', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2014', document: [] },
      global: { stubs },
    })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the selected system on the trigger button', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2024', document: [] },
      global: { stubs },
    })

    expect(component.find('[test-id="trigger"]').text()).toContain('5e-2024')
  })

  it('Should disable the trigger button when disabled prop is set', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2014', document: [], disabled: true },
      global: { stubs },
    })

    expect(
      component.find('[test-id="trigger"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('Should default the selected documents to the srd of the selected system when none are selected', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2014', document: [] },
      global: { stubs },
    })

    const emitted = component.emitted()
    expect(emitted['update:document']).toBeTruthy()
    expect(emitted['update:document']![0]).toEqual([['srd-2014']])
  })

  it('Should not override an already selected document on initial mount', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2014', document: ['kobold-2014'] },
      global: { stubs },
    })

    const emitted = component.emitted()
    expect(emitted['update:document']).toBeFalsy()
  })

  it('Should reset the selected documents when the selected system changes', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2014', document: ['kobold-2014'] },
      global: { stubs },
    })

    await component.setProps({ system: '5e-2024' })
    await nextTick()

    const emitted = component.emitted()
    const updates = emitted['update:document']!
    expect(updates[updates.length - 1]).toEqual([['srd-2024']])
  })

  it('Should update the selected system when a radio option is clicked', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2014', document: [] },
      global: { stubs },
    })

    const radios = component.findAll('button[role="radio"]')
    expect(radios.length).toBe(2)

    await radios[1]!.trigger('click')

    const emitted = component.emitted()
    expect(emitted['update:system']).toBeTruthy()
    expect(emitted['update:system']![0]).toEqual(['5e-2024'])
  })

  it('Should only render documents belonging to the selected system', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2024', document: [] },
      global: { stubs },
    })

    expect(component.find('[test-id="srd-2024"]').exists()).toBeTruthy()
    expect(component.find('[test-id="srd-2014"]').exists()).toBeFalsy()
    expect(component.find('[test-id="kobold-2014"]').exists()).toBeFalsy()
    expect(component.find('[test-id="green-ronin-2014"]').exists()).toBeFalsy()
  })

  it('Should group and sort documents by game system, prioritizing Wizards of the Coast, then alphabetically', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2014', document: [] },
      global: { stubs },
    })

    const vm = component.vm as unknown as Vm
    const options = vm.documentOptions['5e-2014']!

    expect(options.map(option => option.key)).toEqual([
      'srd-2014',
      'green-ronin-2014',
      'kobold-2014',
    ])
  })

  it('Should render the publisher name and link for each document', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2014', document: [] },
      global: { stubs },
    })

    const publisherLink = component.find('[test-id="publisher-srd-2014"]')
    expect(publisherLink.text()).toBe('Wizards of the Coast')
    expect(publisherLink.attributes('href')).toBe(wotcDoc2014.permalink)
  })

  it('Should add a document to the selection when its checkbox is checked', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: { ...props, system: '5e-2014', document: ['srd-2014'] },
      global: { stubs },
    })

    const checkbox = component.find('[test-id="checkbox-kobold-2014"]')
    await checkbox.trigger('click')

    const emitted = component.emitted()
    const updates = emitted['update:document']!
    expect(updates[updates.length - 1]).toEqual([['srd-2014', 'kobold-2014']])
  })

  it('Should remove a document from the selection when its checkbox is unchecked', async () => {
    const component = await mountSuspended(GameSystemFilter, {
      props: {
        ...props,
        system: '5e-2014',
        document: ['srd-2014', 'kobold-2014'],
      },
      global: { stubs },
    })

    const checkbox = component.find('[test-id="checkbox-kobold-2014"]')
    await checkbox.trigger('click')

    const emitted = component.emitted()
    const updates = emitted['update:document']!
    expect(updates[updates.length - 1]).toEqual([['srd-2014']])
  })
})

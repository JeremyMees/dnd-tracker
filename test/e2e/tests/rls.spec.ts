import { beforeAll, describe, expect, it } from 'vitest'
import {
  requireEnv,
  testTitle,
  signInClient,
  type SignedInClient,
  supabaseClient,
} from '../utils'

describe('row level security', () => {
  let owner: SignedInClient
  let other: SignedInClient
  const anonymous = supabaseClient()
  const title = testTitle('Private')
  let campaignId: number
  let encounterId: number

  beforeAll(async () => {
    owner = await signInClient(
      requireEnv('E2E_EMAIL'),
      requireEnv('E2E_PASSWORD'),
    )
    other = await signInClient(
      requireEnv('E2E_OTHER_EMAIL'),
      requireEnv('E2E_OTHER_PASSWORD'),
    )

    const created = await owner.supabase
      .from('campaigns')
      .insert({ title, createdBy: owner.userId })
    if (created.error) throw created.error

    const campaign = await owner.supabase
      .from('campaigns')
      .select('id')
      .eq('title', title)
      .single()
    if (campaign.error) throw campaign.error
    campaignId = campaign.data.id

    const added = await owner.supabase
      .from('initiative_sheets')
      .insert({ title, rows: [], campaign: campaignId })
    if (added.error) throw added.error

    const encounter = await owner.supabase
      .from('initiative_sheets')
      .select('id')
      .eq('title', title)
      .single()

    if (encounter.error) throw encounter.error
    encounterId = encounter.data.id
  })

  it('hides a campaign from users outside it', async () => {
    const { data } = await other.supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)

    expect(data).toEqual([])
  })

  it('hides a campaign from anonymous visitors', async () => {
    const { data } = await anonymous
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)

    expect(data).toEqual([])
  })

  it('ignores updates from users outside the campaign', async () => {
    const { data } = await other.supabase
      .from('campaigns')
      .update({ title: testTitle('Hijacked') })
      .eq('id', campaignId)
      .select('id')
    const { data: stored } = await owner.supabase
      .from('campaigns')
      .select('title')
      .eq('id', campaignId)
      .single()

    expect(data).toEqual([])
    expect(stored?.title).toBe(title)
  })

  it('ignores deletes from users outside the campaign', async () => {
    const { data } = await other.supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)
      .select('id')
    const { count } = await owner.supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('id', campaignId)

    expect(data).toEqual([])
    expect(count).toBe(1)
  })

  it('rejects campaigns created on behalf of another user', async () => {
    const { error } = await other.supabase
      .from('campaigns')
      .insert({ title: testTitle('Forged'), createdBy: owner.userId })

    expect(error?.code).toBe('42501')
  })

  it('hides encounters from users outside the campaign', async () => {
    const { data } = await other.supabase
      .from('initiative_sheets')
      .select('id')
      .eq('id', encounterId)

    expect(data).toEqual([])
  })

  it('rejects encounters added to a campaign the user is not part of', async () => {
    const { error } = await other.supabase
      .from('initiative_sheets')
      .insert({ title: testTitle('Intruder'), rows: [], campaign: campaignId })

    expect(error?.code).toBe('42501')
  })

  it('rejects moving an own encounter into a campaign the user is not part of', async () => {
    const ownTitle = testTitle('Smuggled')
    const added = await other.supabase
      .from('initiative_sheets')
      .insert({ title: ownTitle, rows: [] })
    if (added.error) throw added.error

    const { error } = await other.supabase
      .from('initiative_sheets')
      .update({ campaign: campaignId })
      .eq('title', ownTitle)

    expect(error?.code).toBe('42501')
  })
})

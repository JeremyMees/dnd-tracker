import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import playgroundValues from '~/constants/playground-initiative'

export const useInitiativeSheet = defineStore('useInitiativeSheet', () => {
  const supabase = useSupabaseClient<Database>()
  const channel = supabase.channel('initiative_sheets')
  const toast = useToast()

  const isPlayground = ref<boolean>(true)

  async function get(id?: number): Promise<InitiativeSheet | undefined> {
    if (!id) return playgroundValues

    const { data } = await supabase
      .from('initiative_sheets')
      .select(`
        *, 
        campaign(
          id,
          title,
          created_by(id, username, avatar), 
          team(
            id,
            role, 
            user(id, username, avatar)
          )
        )
      `)
      .eq('id', id)
      .returns<InitiativeSheet>()
      .single()

    return data || undefined
  }

  async function updateInitiativeSheet(sheet: Omit<InitiativeUpdate, NotUpdatable>, id: number): Promise<void> {
    const { error } = await supabase
      .from('initiative_sheets')
      .update(sheet)
      .eq('id', id)

    if (error) throw createError(error)
  }

  function subscribeInitiativeSheet(
    id: number,
    cb: (payload: RealtimePostgresChangesPayload<InitiativeRow>) => void,
  ): void {
    channel.on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'initiative_sheets',
        filter: `id=eq.${id}`,
      },
      cb,
    )
      .subscribe()
  }

  function unsubscribeInitiativeSheet(): void {
    supabase.removeChannel(channel)
  }

  return {
    isPlayground,
    get,
    updateInitiativeSheet,
    subscribeInitiativeSheet,
    unsubscribeInitiativeSheet,
  }
})

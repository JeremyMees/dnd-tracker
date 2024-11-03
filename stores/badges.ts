export const useBadges = defineStore('useBadges', () => {
  const supabase = useSupabaseClient()
  const profile = useProfile()
  const { t } = useI18n()

  async function addBadge(code: string): Promise<void> {
    const { data: result, error: err } = await supabase
      .from('badges')
      .select('id, background, color, description, icon, label')
      .eq('code', code)
      .single()

    if (err?.message === 'JSON object requested, multiple (or no) rows returned') {
      throw createError(t('components.badgeModal.nothing'))
    }
    else if (result && profile.data?.badges) {
      const badges = profile.data.badges as BadgeEarned[]
      const badge: BadgeEarned = { ...result, earned: Date.now() }

      if (Array.isArray(badges) && !badges.find(b => b.id === badge.id)) {
        badges.push(badge)
        await profile.updateProfile({ badges: badges })
      }
      else {
        throw createError(t('components.badgeModal.already'))
      }
    }
  }

  return {
    addBadge,
  }
})

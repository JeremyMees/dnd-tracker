export function urlMatches(url: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
    if (regex.test(url)) return true
  }
  return false
}

export function isMaintenanceEnabled(): boolean {
  const { maintenanceMode } = useRuntimeConfig().public
  const type = typeof maintenanceMode

  const strValue = type === 'string'
    ? maintenanceMode.replace(/^"|"$/g, '')
    : maintenanceMode

  if (
    (type === 'string' && (strValue === 'true' || strValue === '1'))
    || (type === 'boolean' && maintenanceMode)
    || (type === 'number' && Number(maintenanceMode) === 1)
  ) return true
  else return false
}

export function isUnderMaintenance(path: string, exclude: string[] | null): boolean {
  if (exclude && urlMatches(path, exclude)) return false
  return true
}

export function throwMaintenanceError(): void {
  throw createError({
    statusCode: 503,
    statusMessage: 'Site is under maintenance',
  })
}

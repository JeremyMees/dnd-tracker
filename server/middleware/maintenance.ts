export default defineEventHandler((event) => {
  if (!isMaintenanceEnabled()) return

  if (isUnderMaintenance(event.path, ['/maintenance'])) {
    if (event.path.includes('/maintenance')) return
    else return sendRedirect(event, '/maintenance')
  }
})

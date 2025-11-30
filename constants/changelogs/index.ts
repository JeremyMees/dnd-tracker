const modules = import.meta.glob<{ default: any }>('./*.json', { eager: true })

export const changelogs = Object.keys(modules)
  .map(path => modules[path]?.default)
  .sort((a, b) => {
    const versionA = a.version.replace(/v/g, '').split('.').map(Number)
    const versionB = b.version.replace(/v/g, '').split('.').map(Number)

    for (let i = 0; i < 3; i++) {
      if (versionB[i] !== versionA[i]) return versionB[i] - versionA[i]
    }

    return 0
  })

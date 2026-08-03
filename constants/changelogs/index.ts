const modules = import.meta.glob<{ default: Changelog }>('./*.json', {
  eager: true,
})

export const changelogs = Object.values(modules)
  .map(module => module.default)
  .sort((a, b) => {
    const versionA = a.version.replace(/v/g, '').split('.').map(Number)
    const versionB = b.version.replace(/v/g, '').split('.').map(Number)

    for (let i = 0; i < 3; i++) {
      const partA = versionA[i] ?? 0
      const partB = versionB[i] ?? 0

      if (partB !== partA) return partB - partA
    }

    return 0
  })
